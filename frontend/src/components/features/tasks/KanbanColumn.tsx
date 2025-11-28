import React, { useState, useEffect, useRef } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';

import KanbanTask from './KanbanTask';
import type { Task, Column } from '@/types';

interface KanbanColumnProps {
    column: Column;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onAddTask: (columnId: string) => void;
    activeDragType: string | null;
    overColumnId: string | null;
    onUpdateTitle: (newTitle: string) => void;
    onDelete: () => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks, onTaskClick, onAddTask, activeDragType, overColumnId, onUpdateTitle, onDelete }) => {
    const { setNodeRef } = useDroppable({ id: column.id, data: {type: 'column'} });
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(column.title);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setTitle(column.title);
    }, [column.title]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTitleChange = () => {
        if (title.trim() && title.trim() !== column.title) {
            onUpdateTitle(title.trim());
            setTitle(title.trim());
        } else {
            setTitle(column.title);
        }
        setIsEditing(false);
    };

    const isDropZoneActive = overColumnId === column.id && activeDragType === 'task';

    return (
        <div 
            ref={setNodeRef}
            className={`w-72 h-full flex flex-col flex-shrink-0 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg transition-all duration-200 ${isDropZoneActive ? 'bg-sky-100 dark:bg-sky-900/50 ring-2 ring-sky-500 ring-inset' : ''}`}
        >
            <div className="flex justify-between items-center mb-4 px-1 group">
                {isEditing ? (
                     <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleChange()}
                        className="font-semibold text-gray-700 dark:text-gray-200 bg-transparent border-b-2 border-brand-500 focus:outline-none w-full"
                    />
                ) : (
                    <h3 onClick={() => setIsEditing(true)} className="font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">{column.title}</h3>
                )}
                
                <div className="relative ml-1 group" ref={menuRef}>
                    {/* Number label (visible by default, hides on hover) */}
                    <span className="
                        w-6 h-6 flex items-center justify-center
                        text-sm text-gray-500 dark:text-gray-400 
                        bg-gray-200 dark:bg-gray-700 
                        rounded-full
                        transition-opacity duration-150
                        group-hover:opacity-0
                    ">
                        {tasks.length}
                    </span>

                    {/* MoreHorizontal button (hidden by default, appears on hover) */}
                    <button
                        onClick={() => setMenuOpen(p => !p)}
                        className="
                            absolute inset-0 flex items-center
                            w-6 h-6 flex items-center justify-center
                            opacity-0 
                            group-hover:opacity-100 
                            transition-opacity duration-150
                            rounded-full 
                            bg-gray-200 dark:bg-gray-600
                        "
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {/* The menu itself */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => { onDelete(); setMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <SortableContext
                id={column.id}
                items={tasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 overflow-y-auto p-1 -m-1 space-y-2 min-h-[40px]">
                    {tasks.map(task => (
                        <KanbanTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
                    ))}
                </div>
            </SortableContext>
            
            <button onClick={() => onAddTask(column.id)} className="mt-4 w-full flex items-center justify-center p-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                <Plus size={16} className="mr-2" /> Add Task
            </button>
        </div>
    );
};

export default KanbanColumn;
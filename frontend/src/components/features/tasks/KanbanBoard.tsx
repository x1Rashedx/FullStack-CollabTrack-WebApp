
import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import type { Task, Column } from '@/types';

interface KanbanBoardProps {
    columns: { [key: string]: Column };
    columnOrder: string[];
    tasks: { [key: string]: Task };
    processedTasksMap: { [key: string]: Task[] }; // New prop for filtered tasks
    onTaskClick: (task: Task) => void;
    onAddTask: (columnId: string) => void;
    onCreateColumn: (title: string) => void;
    activeDragType: string | null;
    overColumnId: string | null;
    onUpdateColumn: (columnId: string, newTitle: string) => void;
    onDeleteColumn: (columnId: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    columns, 
    columnOrder, 
    tasks, 
    processedTasksMap,
    onTaskClick, 
    onAddTask, 
    onCreateColumn, 
    activeDragType, 
    overColumnId, 
    onUpdateColumn, 
    onDeleteColumn 
}) => {
    return (
        <div className="flex-1 flex overflow-x-auto space-x-4 p-4">
            {columnOrder.map(columnId => {
                const column = columns[columnId];
                // Use the processed map if available (for filtering/sorting), otherwise fallback to default
                const columnTasks = processedTasksMap ? processedTasksMap[columnId] || [] : column.taskIds.map(taskId => tasks[taskId]).filter(Boolean);
                
                return (
                  <DraggableColumn key={column.id} column={column}>
                    <KanbanColumn
                        column={column}
                        tasks={columnTasks}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                        activeDragType={activeDragType}
                        overColumnId={overColumnId}
                        onUpdateTitle={(title) => onUpdateColumn(column.id, title)}
                        onDelete={() => onDeleteColumn(column.id)}
                    />
                  </DraggableColumn>
                );
            })}
            <div className="h-full flex-shrink-0">
                <AddColumn onCreate={onCreateColumn} />
            </div>
        </div>
    );
};

// Wrapper to make columns draggable
const DraggableColumn: React.FC<{column: Column, children: React.ReactNode}> = ({ column, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: 'column' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    height: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
      {children}
    </div>
  );
};

const AddColumn: React.FC<{ onCreate: (title: string) => void }> = ({ onCreate }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAdding) {
            inputRef.current?.focus();
        }
    }, [isAdding]);

    const handleSubmit = () => {
        if (title.trim()) {
            onCreate(title.trim());
            setTitle('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="w-72 flex items-center p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300 transition-colors"
            >
                <Plus size={16} className="mr-2" />
                Add another column
            </button>
        );
    }

    return (
        <div className="w-72 bg-gray-200 dark:bg-gray-700/60 p-2 rounded-lg">
            <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                onBlur={() => { if(!title.trim()) setIsAdding(false);}}
                placeholder="Enter column title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
            />
            <div className="mt-2 flex items-center space-x-2">
                <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700">
                    Add Column
                </button>
                <button onClick={() => {setIsAdding(false); setTitle("")}} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};


export default KanbanBoard;

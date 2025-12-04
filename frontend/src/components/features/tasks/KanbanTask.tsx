import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, Calendar, CheckCircle, CheckSquare } from 'lucide-react';
import type { Task } from '@/types';
import Avatar from '@components/common/Avatar';

interface KanbanTaskProps {
    task: Task;
    onClick: () => void;
}

const priorityColors = {
    low: 'bg-success-status-100 text-success-status-800 dark:bg-success-status-900/50 dark:text-success-status-300',
    medium: 'bg-warning-status-100 text-warning-status-800 dark:bg-warning-status-900/50 dark:text-warning-status-300',
    high: 'bg-error-status-100 text-error-status-800 dark:bg-error-status-900/50 dark:text-error-status-300',
};

const KanbanTask: React.FC<KanbanTaskProps> = ({ task, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: {type: 'task'} });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : task.completed ? 0.7 : 1,
    };
    
    const lastComment = task.comments && task.comments.length > 0 ? task.comments[task.comments.length - 1] : null;
    
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

    // Calculate subtask progress
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.completed).length;
    const totalSubtasks = subtasks.length;

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative group ${task.completed ? 'ring-2 ring-success-status-500/50 dark:ring-success-status-500/30' : ''}`}
        >
            <div className="flex justify-between items-start">
                 <div className="flex items-start gap-2">
                    {task.completed && (
                        <CheckCircle size={16} className="text-success-status-500 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 break-words ${task.completed ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}>{task.title}</p>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span>
                     <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 rounded border dark:border-gray-600" title="Task Weight">
                         {task.weight || 1}
                     </span>
                 </div>
            </div>
            
            {task.description && (
                <p className={`mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 ${task.completed ? 'line-through opacity-75' : ''}`}>{task.description}</p>
            )}

            {task.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">{tag}</span>
                    ))}
                </div>
            )}
            
            {lastComment && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                        <Avatar user={lastComment.author} className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {lastComment.content}
                    </p>
                </div>
            )}
            
            <div className="mt-3 flex justify-between items-center">
                <div className="flex -space-x-2">
                    {task.assignees.map(user => (
                        <div key={user.id} className="border-2 border-white dark:border-gray-800 rounded-full">
                           <Avatar user={user} className="h-6 w-6" />
                        </div>
                    ))}
                </div>
                 <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    {totalSubtasks > 0 && (
                        <div className={`flex items-center ${completedSubtasks === totalSubtasks ? 'text-success-status-500' : 'hover:text-primary-500'} transition-colors`} title={`${completedSubtasks}/${totalSubtasks} subtasks completed`}>
                            <CheckSquare size={12} className="mr-1"/>
                            {completedSubtasks}/{totalSubtasks}
                        </div>
                    )}
                    {task.dueDate && (
                        <div className={`flex items-center ${isOverdue ? 'text-error-status-500 font-medium' : ''}`}>
                            <Calendar size={12} className="mr-1"/>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex items-center hover:text-primary-500 transition-colors">
                            <MessageSquare size={12} className="mr-1"/> {task.comments.length}
                        </div>
                    )}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="flex items-center hover:text-primary-500 transition-colors">
                            <Paperclip size={12} className="mr-1"/> {task.attachments.length}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KanbanTask;
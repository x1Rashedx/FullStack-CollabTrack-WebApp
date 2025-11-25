
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Paperclip, MessageSquare, Trash2, User as UserIcon, Plus, UploadCloud, CheckCircle, BarChart2, Target, Save } from 'lucide-react';
import type { Task, User, Comment, Attachment } from '../types';
import Avatar from './Avatar';
import CustomDatePicker from './CustomDatePicker';
import ConfirmationModal from './ConfirmationModal';

interface TaskModalProps {
    task: Task;
    onClose: () => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    projectMembers: User[];
    currentUser: User;
    isTeamAdmin: boolean;
}

const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdateTask, onDeleteTask, projectMembers, currentUser, isTeamAdmin }) => {
    const [editableTask, setEditableTask] = useState<Task>(task);
    const [newComment, setNewComment] = useState('');
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Assignee Picker State
    const [isAssigneePickerOpen, setAssigneePickerOpen] = useState(false);
    const [assigneeMenuPos, setAssigneeMenuPos] = useState({ top: 0, left: 0 });
    const assigneePickerRef = useRef<HTMLDivElement>(null);
    const assigneeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setEditableTask(task);
        setHasUnsavedChanges(false);
    }, [task]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneePickerRef.current && !assigneePickerRef.current.contains(event.target as Node) && assigneeButtonRef.current && !assigneeButtonRef.current.contains(event.target as Node)) {
                setAssigneePickerOpen(false);
            }
        };
        if (isAssigneePickerOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isAssigneePickerOpen]);

    const handleUpdate = <K extends keyof Task>(field: K, value: Task[K]) => {
        const updatedTask = { ...editableTask, [field]: value };
        setEditableTask(updatedTask);
        setHasUnsavedChanges(true);
    };

    const handleSaveChanges = () => {
        onUpdateTask(editableTask);
        setHasUnsavedChanges(false);
        onClose();
    };
    
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDeleteTask(task.id);
        setShowDeleteConfirm(false);
    };
    
    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: `comment-${Date.now()}`,
            author: currentUser,
            content: newComment.trim(),
            timestamp: new Date().toISOString(),
        };
        // Comments are added immediately, persisting the current state of the task as well
        const updatedComments = [...editableTask.comments, comment];
        const updatedTask = { ...editableTask, comments: updatedComments };
        setEditableTask(updatedTask);
        onUpdateTask(updatedTask);
        setNewComment('');
    };
    
    const handleAddTag = () => {
        if (!isTeamAdmin) return;
        const trimmedTag = newTag.trim();
        if (trimmedTag && !editableTask.tags.includes(trimmedTag)) {
            handleUpdate('tags', [...editableTask.tags, trimmedTag]);
        }
        setNewTag('');
        setIsAddingTag(false);
    };
    
    const handleRemoveTag = (tagToRemove: string) => {
        if (!isTeamAdmin) return;
        const updatedTags = editableTask.tags.filter(tag => tag !== tagToRemove);
        handleUpdate('tags', updatedTags);
    };
    
    const toggleAssignee = (member: User) => {
        if (!isTeamAdmin) return;
        const isAssigned = editableTask.assignees.some(a => a.id === member.id);
        let newAssignees;
        if (isAssigned) {
            newAssignees = editableTask.assignees.filter(a => a.id !== member.id);
        } else {
            newAssignees = [...editableTask.assignees, member];
        }
        handleUpdate('assignees', newAssignees);
    };
    
    const handleToggleAssigneePicker = () => {
        if (isAssigneePickerOpen) {
            setAssigneePickerOpen(false);
        } else if (assigneeButtonRef.current) {
            const rect = assigneeButtonRef.current.getBoundingClientRect();
            const width = 256; // w-64
            let left = rect.left;
            
            // Adjust if it goes off the right side of the screen
            if (left + width > window.innerWidth) {
                left = rect.right - width;
            }
            
            setAssigneeMenuPos({
                top: rect.bottom + 5,
                left: left
            });
            setAssigneePickerOpen(true);
        }
    };

    const handleAddAttachments = (files: FileList) => {
        const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
            id: `att-${Date.now()}-${index}`,
            name: file.name,
            url: '#', // Placeholder
            createdAt: new Date().toISOString(),
        }));
        handleUpdate('attachments', [...editableTask.attachments, ...newAttachments]);
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        const updatedAttachments = editableTask.attachments.filter(att => att.id !== attachmentId);
        handleUpdate('attachments', updatedAttachments);
    };
    
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDraggingOver(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleAddAttachments(files);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                     <div className="flex items-center flex-grow gap-3 mr-4">
                        <button 
                            onClick={() => handleUpdate('completed', !editableTask.completed)}
                            className={`flex-shrink-0 p-1.5 rounded-full border-2 transition-colors ${editableTask.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent hover:border-green-500'}`}
                            title={editableTask.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                            <CheckCircle size={20} className={editableTask.completed ? "block" : "invisible"} />
                        </button>
                        <input
                            type="text"
                            value={editableTask.title}
                            onChange={(e) => handleUpdate('title', e.target.value)}
                            className={`text-lg font-semibold bg-transparent w-full focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md px-2 py-1 text-gray-800 dark:text-white ${editableTask.completed ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                         {isTeamAdmin && (
                             <button onClick={handleDeleteClick} className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50">
                                <Trash2 size={18} />
                            </button>
                         )}
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                </header>
                
                <main 
                    className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto"
                    onScroll={() => isAssigneePickerOpen && setAssigneePickerOpen(false)}
                >
                    {/* Main content */}
                    <div className="md:col-span-2 space-y-6">
                         <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
                            <textarea
                                value={editableTask.description}
                                onChange={(e) => handleUpdate('description', e.target.value)}
                                rows={5}
                                placeholder="Add a more detailed description..."
                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-800 dark:text-gray-200"
                             />
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center"><Paperclip size={14} className="mr-2"/> Attachments</h3>
                             <div className="space-y-2 mt-1">
                                {editableTask.attachments.map((att) => (
                                    <div key={att.id} className="flex items-center justify-between p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{att.name}</a>
                                        <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-red-500 hover:text-red-700 ml-2">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDraggingOver ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'}`}
                                onClick={() => document.getElementById('task-file-upload-input')?.click()}
                            >
                                <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
                                </p>
                                <input id="task-file-upload-input" type="file" multiple className="hidden" onChange={(e) => e.target.files && handleAddAttachments(e.target.files)} />
                            </div>
                        </div>

                         <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center"><MessageSquare size={14} className="mr-2"/> Activity</h3>
                            <div className="space-y-4">
                                {editableTask.comments.map(comment => (
                                    <div key={comment.id} className="flex items-start space-x-3">
                                        <Avatar user={comment.author} className="h-8 w-8" />
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-semibold text-gray-800 dark:text-gray-100">{comment.author.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{new Date(comment.timestamp).toLocaleString()}</span>
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-start space-x-3">
                                <Avatar user={currentUser} className="h-8 w-8" />
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        rows={2}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-800 dark:text-gray-200"
                                    />
                                    <button onClick={handleAddComment} className="mt-2 px-4 py-1.5 text-sm font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700">Comment</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sidebar with details */}
                    <aside className="space-y-6">
                         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                             <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${editableTask.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {editableTask.completed ? 'Completed' : 'Incomplete'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={editableTask.completed} 
                                        onChange={(e) => handleUpdate('completed', e.target.checked)}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                </label>
                             </div>
                         </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</h3>
                             <select
                                value={editableTask.priority}
                                onChange={(e) => handleUpdate('priority', e.target.value as 'low' | 'medium' | 'high')}
                                disabled={!isTeamAdmin}
                                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm font-semibold ${priorityColors[editableTask.priority]} disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                         <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center"><BarChart2 size={14} className="mr-2"/> Weight</h3>
                            <select
                                value={editableTask.weight || 1}
                                onChange={(e) => handleUpdate('weight', Number(e.target.value))}
                                disabled={!isTeamAdmin}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-500 focus:border-brand-500 text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>

                         <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center"><UserIcon size={14} className="mr-2"/> Assignees</h3>
                            </div>
                            <div className={`flex flex-wrap ${isTeamAdmin ? 'gap-2' : 'gap-1'}`}>
                                {editableTask.assignees.length > 0 ? (
                                    editableTask.assignees.map(member => (
                                        <div 
                                            key={member.id} 
                                            className={`flex items-center gap-2 py-1 rounded-full ${isTeamAdmin ? 'pl-1 pr-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600' : ''}`}
                                        >
                                            <Avatar user={member} className="h-6 w-6" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate" title={member.name}>{member.name}</span>
                                            {isTeamAdmin && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleAssignee(member); }}
                                                    className="ml-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 focus:outline-none"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm text-gray-400 italic py-1">Unassigned</span>
                                )}
                                
                                {isTeamAdmin && (
                                    <button 
                                        ref={assigneeButtonRef}
                                        onClick={handleToggleAssigneePicker}
                                        className="flex items-center justify-center gap-1 pl-2 pr-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-500 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-gray-700 transition-all h-8"
                                        title="Add Assignee"
                                    >
                                        <Plus size={14} />
                                        <span>Add</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        
                         <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center"><Calendar size={14} className="mr-2"/> Due Date</h3>
                            {isTeamAdmin ? (
                                <CustomDatePicker
                                    value={editableTask.dueDate}
                                    onChange={(date) => handleUpdate('dueDate', date)}
                                />
                            ) : (
                                <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200">
                                    {editableTask.dueDate ? new Date(editableTask.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No due date'}
                                </div>
                            )}
                        </div>

                         <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center"><Tag size={14} className="mr-2"/> Tags</h3>
                            <div className="flex flex-wrap gap-1 items-center">
                                {editableTask.tags.map(tag => (
                                    <span key={tag} className="flex items-center px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                        {tag}
                                        {isTeamAdmin && (
                                            <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                                <X size={12} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {isTeamAdmin && (
                                    isAddingTag ? (
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                            }}
                                            onBlur={handleAddTag}
                                            autoFocus
                                            className="w-20 px-1 py-0.5 text-xs rounded-md bg-transparent border border-brand-500 text-gray-900 dark:text-gray-100"
                                        />
                                    ) : (
                                        <button onClick={() => setIsAddingTag(true)} className="px-2 py-1 text-xs rounded-md border border-dashed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200">
                                            <Plus size={12} />
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </aside>
                </main>
                <footer className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex justify-end items-center space-x-3 flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    {hasUnsavedChanges && (
                        <button 
                            onClick={handleSaveChanges}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 shadow-sm animate-in fade-in duration-200"
                        >
                            <Save size={16} className="mr-2" />
                            Save Changes
                        </button>
                    )}
                </footer>
            </div>
            
            {isAssigneePickerOpen && (
                <div 
                    ref={assigneePickerRef}
                    style={{ top: assigneeMenuPos.top, left: assigneeMenuPos.left }}
                    className="fixed w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-50 p-2 max-h-60 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">Select Members</h4>
                    <div className="space-y-1">
                        {projectMembers.map(member => {
                            const isAssigned = editableTask.assignees.some(a => a.id === member.id);
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => toggleAssignee(member)}
                                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition-colors ${isAssigned ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                >
                                    <div className="relative">
                                        <Avatar user={member} className="h-6 w-6" />
                                        {isAssigned && (
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border border-white dark:border-gray-800">
                                                <CheckCircle size={8} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="truncate">{member.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};

export default TaskModal;

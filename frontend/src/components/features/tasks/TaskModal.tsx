import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, Paperclip, MessageSquare, Trash2, User as UserIcon, Plus, UploadCloud, CheckCircle, BarChart2, Save, Clock, History, CheckSquare, Wand2, Sparkles, Loader2, MinusCircle, Send, MoreHorizontal } from 'lucide-react';
import type { Task, User, Comment, Attachment, Subtask } from '@/types';
import Avatar from '@components/common/Avatar';
import CustomDatePicker from '@components/features/calendar/CustomDatePicker';
import ConfirmationModal from '@components/modals/ConfirmationModal';

interface TaskModalProps {
    task: Task;
    onClose: () => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    projectMembers: User[];
    currentUser: User;
    isTeamAdmin: boolean;

    onCreateComment: (taskId: string, content: string) => void;
    onUploadAttachment: (taskId: string, file: File) => Promise<Attachment>;
    onDeleteAttachment: (attachmentId: string) => void;
}

const priorityColors = {
    low: 'bg-success-status-100 text-success-status-800 dark:bg-success-status-900/50 dark:text-success-status-300 border-success-status-200 dark:border-success-status-800',
    medium: 'bg-warning-status-100 text-warning-status-800 dark:bg-warning-status-900/50 dark:text-warning-status-300 border-warning-status-200 dark:border-warning-status-800',
    high: 'bg-error-status-100 text-error-status-800 dark:bg-error-status-900/50 dark:text-error-status-300 border-error-status-200 dark:border-error-status-800',
};

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onUpdateTask, onDeleteTask, onCreateComment, onUploadAttachment, onDeleteAttachment, projectMembers, currentUser, isTeamAdmin }) => {
    const [editableTask, setEditableTask] = useState<Task>({ ...task, subtasks: task.subtasks || [] });
    const [newComment, setNewComment] = useState('');
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Subtask State
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    
    // Assignee Picker State
    const [isAssigneePickerOpen, setAssigneePickerOpen] = useState(false);
    const [assigneeMenuPos, setAssigneeMenuPos] = useState({ top: 0, left: 0 });
    const assigneePickerRef = useRef<HTMLDivElement>(null);
    const assigneeButtonRef = useRef<HTMLButtonElement>(null);
    
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (hasUnsavedChanges) return;
        setEditableTask({ ...task, subtasks: task.subtasks || [] });
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
    
    // Scroll comments to bottom when added
    useEffect(() => {
        if (editableTask.comments.length > 0) {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [editableTask.comments]);

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

    const handleSaveChanges = async () => {
        setIsSaving(true);

        let updatedTask = { ...editableTask, assigneeIds: editableTask.assignees.map(a => a.id) };

        try {
            // If there are pending files, upload them first
            if (pendingFiles.length > 0) {
                // Create a copy to iterate so we can mutate pendingFiles during uploads
                const toUpload = [...pendingFiles];

                for (const f of toUpload) {

                    const res = await onUploadAttachment(task.id, f);
                    const newAtts = Array.isArray(res) ? res : [res];
                    updatedTask.attachments = [...(updatedTask.attachments || []), ...newAtts];

                    // Update UI immediately with the newly uploaded attachment(s)
                    setEditableTask({ ...updatedTask });

                    // Remove this file from the pending queue as soon as it's uploaded
                    setPendingFiles(prev => prev.filter(p => !(p.name === f.name && p.size === f.size && p.lastModified === f.lastModified)));
                }
            }

            // After uploads, ensure final task state is propagated
            onUpdateTask(updatedTask);
            setHasUnsavedChanges(false);
        } finally {
            setIsSaving(false);
        }
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
        const content = newComment.trim();
        // send to backend
        onCreateComment(task.id, content)
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
        const fileArray = Array.from(files);
        // Append to pending queue (do not upload yet)
        setPendingFiles(prev => [...prev, ...fileArray]);
        setHasUnsavedChanges(true);
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
        setHasUnsavedChanges(true);
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        onDeleteAttachment(attachmentId);
    };

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSubtask: Subtask = {
            id: `st-${Date.now()}`,
            title: newSubtaskTitle.trim(),
            completed: false
        };
        const updatedSubtasks = [...editableTask.subtasks, newSubtask];
        handleUpdate('subtasks', updatedSubtasks);
        setNewSubtaskTitle('');
    };

    const toggleSubtask = (subtaskId: string) => {
        const updatedSubtasks = editableTask.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        handleUpdate('subtasks', updatedSubtasks);
    };

    const removeSubtask = (subtaskId: string) => {
        const updatedSubtasks = editableTask.subtasks.filter(st => st.id !== subtaskId);
        handleUpdate('subtasks', updatedSubtasks);
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

    const completedSubtasks = editableTask.subtasks?.filter(st => st.completed).length;
    const totalSubtasks = editableTask.subtasks?.length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col relative animate-fade-in overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <header className="flex justify-between items-start p-5 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10 flex-shrink-0">
                     <div className="flex items-start flex-grow gap-4">
                        <button 
                            onClick={() => handleUpdate('completed', !editableTask.completed)}
                            className={`flex-shrink-0 mt-1 p-1 rounded-full border-2 transition-all duration-200 ${editableTask.completed ? 'bg-success-status-500 border-success-status-500 text-white' : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-success-status-500'}`}
                            title={editableTask.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                            <CheckCircle size={20} className={editableTask.completed ? "block" : "invisible"} />
                        </button>
                        <div className="w-full">
                            <input
                                type="text"
                                value={editableTask.title}
                                onChange={(e) => handleUpdate('title', e.target.value)}
                                className={`text-2xl font-bold bg-transparent w-full focus:outline-none focus:ring-0 px-0 py-0 text-gray-900 dark:text-white placeholder-gray-400 ${editableTask.completed ? 'line-through text-gray-500 dark:text-gray-500' : ''}`}
                                placeholder="Task Title"
                            />
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                {editableTask.createdAt && (
                                    <span className="flex items-center gap-1"><Clock size={10} /> Created {new Date(editableTask.createdAt).toLocaleDateString()}</span>
                                )}
                                {editableTask.updatedAt && (
                                    <span className="flex items-center gap-1"><History size={10} /> Updated {new Date(editableTask.updatedAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {hasUnsavedChanges && (
                            <button 
                                onClick={handleSaveChanges}
                                className="flex items-center px-3 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-md hover:bg-primary-700 shadow-sm animate-in fade-in duration-200"
                            >
                                <Save size={14} className="mr-1.5" />
                                Save
                            </button>
                        )}
                         {isTeamAdmin && (
                             <button onClick={handleDeleteClick} className="p-2 rounded-lg text-gray-400 hover:bg-error-status-50 hover:text-error-status-600 dark:hover:bg-error-status-900/30 transition-colors">
                                <Trash2 size={18} />
                            </button>
                         )}
                        <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                {/* Meta Data Ribbon */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-3 bg-gray-50/80 dark:bg-gray-900/30 border-b dark:border-gray-700 text-sm">
                    {/* Assignees */}
                    <div className="flex items-center gap-2 relative group">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <UserIcon size={14} className="mr-1.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Assignees</span>
                        </div>
                        <div className="flex items-center -space-x-2 ml-1">
                            {editableTask.assignees.length > 0 ? (
                                editableTask.assignees.map(member => (
                                    <div key={member.id} className="relative group/avatar cursor-pointer hover:scale-110 transition-transform" onClick={() => isTeamAdmin && toggleAssignee(member)}>
                                        <div className="ring-2 ring-white dark:ring-gray-800 rounded-full flex items-center">
                                            <div className="relative">
                                                <Avatar user={member} className="h-6 w-6" />
                                                {isTeamAdmin && (
                                                <div className={`absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover/avatar:opacity-100 transition-opacity`}>
                                                    <X size={18} />
                                                </div>
                                                )}
                                            </div>

                                            {editableTask.assignees.length === 1 && (
                                                <span className="ml-1 mr-2 text-xs text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                                                {member.name}
                                                </span>
                                            )}
                                        
                                            <div className="absolute mt-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                {member.name}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <span className="text-xs text-gray-400 italic mr-1">Unassigned</span>
                            )}
                            <div className='p-3'></div>
                            {isTeamAdmin && (
                                <button 
                                    ref={assigneeButtonRef}
                                    onClick={handleToggleAssigneePicker}
                                    className="ml-2 w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-primary-600 hover:border-primary-400 hover:bg-white dark:hover:bg-gray-700 transition-all"
                                >
                                    <Plus size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

                    {/* Due Date */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <Calendar size={14} className="mr-1.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Due Date</span>
                        </div>
                        {isTeamAdmin ? (
                            <div className="w-36">
                                <CustomDatePicker
                                    value={editableTask.dueDate}
                                    onChange={(date) => handleUpdate('dueDate', date)}
                                />
                            </div>
                        ) : (
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {editableTask.dueDate ? new Date(editableTask.dueDate).toLocaleDateString() : 'None'}
                            </span>
                        )}
                    </div>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

                    {/* Priority */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <BarChart2 size={14} className="mr-1.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Priority</span>
                        </div>
                        <select
                            value={editableTask.priority}
                            onChange={(e) => handleUpdate('priority', e.target.value as 'low' | 'medium' | 'high')}
                            disabled={!isTeamAdmin}
                            className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${priorityColors[editableTask.priority]} focus:ring-0 cursor-pointer disabled:cursor-default disabled:opacity-80`}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

                    {/* Weight - Re-added */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <BarChart2 size={14} className="mr-1.5" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Weight</span>
                        </div>
                        <select
                            value={editableTask.weight}
                            onChange={(e) => handleUpdate('weight', Number(e.target.value))}
                            disabled={!isTeamAdmin}
                            className="px-2 py-0.5 rounded-md text-xs font-bold uppercase border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-0 cursor-pointer disabled:cursor-default disabled:opacity-80 text-gray-800 dark:text-gray-200"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                    </div>
                    
                </div>
                
                {/* Main Body - Dashboard Grid Layout */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                    <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* LEFT COLUMN (60%): Description & Discussion */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            
                            {/* Description Section */}
                            <section className="group">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <AlignLeftIcon size={16} className="text-gray-400" /> Description
                                    </h3>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={editableTask.description}
                                        onChange={(e) => handleUpdate('description', e.target.value)}
                                        rows={Math.max(6, editableTask.description.split('\n').length)}
                                        placeholder="Add a detailed description..."
                                        className="w-full p-4 text-sm leading-relaxed border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-900/30 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 dark:text-gray-200 transition-all resize-none shadow-sm"
                                    />
                                </div>
                            </section>

                            {/* Activity Section - Integrated into Main Column */}
                            <section className="flex-1 flex flex-col min-h-[300px]">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <MessageSquare size={16} className="text-gray-400" /> Activity
                                    </h3>
                                    <span className="text-xs text-gray-400">{editableTask.comments.length} comments</span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[400px] custom-scrollbar">
                                    {editableTask.comments.length === 0 && (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                                <MessageSquare size={20} />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
                                        </div>
                                    )}
                                    {editableTask.comments.map(comment => {
                                        const isCurrentUserComment = comment.author.id === currentUser.id;
                                        return (
                                            <div key={comment.id} className={`flex gap-2 group ${isCurrentUserComment ? 'flex-row-reverse' : ''}`}>
                                                <Avatar user={comment.author} className="h-8 w-8 flex-shrink-0" />
                                                <div className="flex-2">
                                                    <div className={`mt-2 p-3 rounded-lg ${isCurrentUserComment ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-gray-50 dark:bg-gray-700/40 rounded-tl-none border border-gray-100 dark:border-gray-700'}`}>
                                                        <div className={`flex gap-2 items-baseline mb-1 ${isCurrentUserComment ? 'justify-end' : 'justify-start'}`}>
                                                            {!isCurrentUserComment && <span className="text-[10px] font-semibold text-xs text-gray-900 dark:text-gray-100">{comment.author.name}</span>}
                                                            {isCurrentUserComment && <span className="text-[10px] font-semibold text-xs text-primary-100">{comment.author.name}</span>}
                                                            <span className={`text-[10px] ${isCurrentUserComment ? 'text-primary-100/70' : 'text-gray-400'}`}>{new Date(comment.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className="text-sm break-all leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={commentsEndRef} />
                                </div>

                                <div className="mt-4 relative">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }}}
                                        placeholder="Write a comment..."
                                        rows={1}
                                        className="w-full pl-4 pr-12 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 dark:text-gray-200 resize-none shadow-sm"
                                    />
                                    <button 
                                        onClick={handleAddComment} 
                                        disabled={!newComment.trim()}
                                        className="absolute right-2.5 bottom-3.5 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN (40%): Actionables (Subtasks, Attachments) */}
                        <div className="lg:col-span-5 space-y-10 py-8">
                            
                            {/* Checklist Section */}
                            <section className="bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <CheckSquare size={16} className="text-primary-500" /> Checklist
                                    </h3>
                                    {totalSubtasks > 0 && (
                                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full border border-primary-100 dark:border-primary-800">
                                            {Math.round(progress)}%
                                        </span>
                                    )}
                                </div>
                                
                                {totalSubtasks > 0 && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-5 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-success-status-500' : 'bg-primary-500'}`} 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {editableTask.subtasks?.map(st => (
                                        <div key={st.id} className="flex items-center gap-3 group p-2 hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                                            <button 
                                                onClick={() => toggleSubtask(st.id)}
                                                className={`flex-shrink-0 transition-all duration-200 ${st.completed ? 'text-success-status-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-primary-500 hover:scale-110'}`}
                                            >
                                                {st.completed ? <CheckCircle size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current"></div>}
                                            </button>
                                            <input
                                                type="text"
                                                value={st.title}
                                                onChange={(e) => {
                                                    const updatedSubtasks = editableTask.subtasks.map(s => s.id === st.id ? { ...s, title: e.target.value } : s);
                                                    handleUpdate('subtasks', updatedSubtasks);
                                                }}
                                                className={`flex-grow bg-transparent text-sm focus:outline-none border-none p-0 focus:ring-0 ${st.completed ? 'line-through text-gray-400 transition-colors' : 'text-gray-800 dark:text-gray-200'}`}
                                            />
                                            <button 
                                                onClick={() => removeSubtask(st.id)}
                                                className="text-gray-400 hover:text-error-status-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-error-status-50 dark:hover:bg-error-status-900/30 rounded"
                                            >
                                                <MinusCircle size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {isAddingSubtask ? (
                                        <div className="flex items-center gap-3 p-2 animate-in fade-in slide-in-from-top-1 bg-white dark:bg-gray-700/50 rounded-lg border border-primary-200 dark:border-primary-800 ring-2 ring-primary-100 dark:ring-primary-900/20">
                                            <div className="w-[18px] h-[18px] rounded-full border-2 border-dashed border-gray-300 dark:border-gray-500"></div>
                                            <input
                                                type="text"
                                                value={newSubtaskTitle}
                                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddSubtask();
                                                    if (e.key === 'Escape') setIsAddingSubtask(false);
                                                }}
                                                onBlur={() => {
                                                    if(newSubtaskTitle.trim()) handleAddSubtask();
                                                    setIsAddingSubtask(false);
                                                }}
                                                placeholder="What needs to be done?"
                                                autoFocus
                                                className="flex-grow text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
                                            />
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setIsAddingSubtask(true)}
                                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 mt-2 px-2 py-2 w-full text-left rounded-lg hover:bg-white dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                                        >
                                            <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add an item
                                        </button>
                                    )}
                                </div>
                            </section>
                            
                            {/* Attachments Section */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Paperclip size={16} className="text-gray-400"/> Attachments
                                </h3>
                                 <div className="grid grid-cols-2 gap-3">
                                    {editableTask.attachments.map((att) => (
                                        <div key={att.id} className="relative group p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between min-h-[80px]">
                                            <div className="flex items-start justify-between">
                                                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-500">
                                                    <Paperclip size={14} />
                                                </div>
                                                <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-gray-400 hover:text-error-status-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={att.name}>{att.name}</div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{att.name.split('.').pop()}</span>
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:underline">Download</a>
                                                </div>
                                            </div>
                                        </div>
                                        
                                    ))}
                                    {pendingFiles.map((file, idx) => (
                                        <div key={idx} className="relative group p-3 rounded-xl bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-600 hover:shadow-sm transition-all flex flex-col justify-between min-h-[80px]">
                                            <div className="flex items-start justify-between">
                                                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-500">
                                                    <Paperclip size={14} />
                                                </div>
                                                <button type="button" onClick={() => handleRemovePendingFile(idx)} className="text-gray-400 hover:text-error-status-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{file.name.split('.').pop()}</span>
                                                    <a href={file.webkitRelativePath} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium text-primary-600 dark:text-primary-400 hover:underline">Download</a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[80px] ${isDraggingOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                        onClick={() => document.getElementById('task-file-upload-input')?.click()}
                                    >
                                        <UploadCloud className="h-5 w-5 text-gray-400 mb-1" />
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Upload</span>
                                        <input id="task-file-upload-input" type="file" multiple className="hidden" onChange={(e) => e.target.files && handleAddAttachments(e.target.files)} />
                                    </div>
                                </div>
                            </section>

                            {/* Tags */}
                            <section>
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Tag size={16} className="text-gray-400"/> Tags
                                </h3>
                                <div className="flex items-center gap-2 flex-grow">
                                    <div className="flex flex-wrap gap-1.5">
                                        {editableTask.tags.map(tag => (
                                            <span key={tag} className="flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 group">
                                                {tag}
                                                {isTeamAdmin && (
                                                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 w-0 group-hover:w-auto overflow-hidden transition-all text-gray-400 hover:text-error-status-500">
                                                        <X size={10} />
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
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                                                    onBlur={handleAddTag}
                                                    autoFocus
                                                    className="w-20 px-2 py-0.5 text-xs rounded-full bg-white dark:bg-gray-700 border border-primary-500 text-gray-800 dark:text-gray-200"
                                                    placeholder="New Tag..."
                                                />
                                            ) : (
                                                <button onClick={() => setIsAddingTag(true)} className="px-2 py-0.5 text-xs rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-primary-600 hover:border-primary-400 transition-colors">
                                                    + Tag
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Assignee Picker Popover */}
            {isAssigneePickerOpen && (
                <div 
                    ref={assigneePickerRef}
                    style={{ top: assigneeMenuPos.top, left: assigneeMenuPos.left }}
                    className="fixed w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 z-50 p-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">Select Members</h4>
                    <div className="space-y-1">
                        {projectMembers.map(member => {
                            const isAssigned = editableTask.assignees.some(a => a.id === member.id);
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => toggleAssignee(member)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isAssigned ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                >
                                    <div className="relative">
                                        <Avatar user={member} className="h-6 w-6" />
                                        {isAssigned && (
                                            <div className="absolute -bottom-1 -right-1 bg-success-status-500 rounded-full p-0.5 border border-white dark:border-gray-800">
                                                <CheckCircle size={8} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="truncate font-medium">{member.name}</span>
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

// Helper component for Icon use if needed
const AlignLeftIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
)

export default TaskModal;
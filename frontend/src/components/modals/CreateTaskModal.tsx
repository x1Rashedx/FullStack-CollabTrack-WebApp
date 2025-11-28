
import React, { useState, useEffect } from 'react';
import { X, Trash2, UploadCloud, BarChart2 } from 'lucide-react';
import type { User, Task, Attachment } from '@/types';
import CustomDatePicker from '@components/features/calendar/CustomDatePicker';
import Avatar from '@components/common/Avatar';

interface CreateTaskModalProps {
    onClose: () => void;
    onCreateTask: (newTaskData: Omit<Task, 'id' | 'projectId'>, columnId: string) => Promise<Task>;
    columnId: string;
    projectMembers: User[];
    allTags: string[];
    onUploadAttachment: (taskId: string, file: File) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onCreateTask, columnId, projectMembers, allTags, onUploadAttachment }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [weight, setWeight] = useState<number>(1);
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        if (currentTag) {
            const filtered = allTags.filter(t => t.toLowerCase().includes(currentTag.toLowerCase()) && !tags.includes(t));
            setTagSuggestions(filtered);
        } else {
            setTagSuggestions([]);
        }
    }, [currentTag, allTags, tags]);

    const addTag = (tag: string) => {
        const newTag = tag.trim();
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }
        setCurrentTag('');
        setTagSuggestions([]);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(currentTag);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleAddAttachments = (files: FileList) => {
        const fileList = Array.from(files);
        setAttachments(prev => [...prev, ...fileList]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleAddAttachments(files);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            // Create task without attachments first
            const createdTask = await onCreateTask({
                title: title.trim(),
                description: description.trim(),
                assignees: projectMembers.filter(m => assigneeIds.includes(m.id)),
                priority,
                dueDate,
                tags,
                attachments: [],
                comments: [],
                weight: weight,
                completed: false
            }, columnId);

            // Upload attachments (if any) and link to task
            if (attachments.length > 0 && createdTask && createdTask.id) {
                const uploaded: any[] = [];
                for (const f of attachments) {
                    try {
                        onUploadAttachment(createdTask.id, f);
                    } catch (err) {
                        console.error('Attachment upload failed', err);
                    }
                }
            }

            // close modal
            onClose();
        } catch (err) {
            console.error('Failed to create task', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create New Task</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</label>
                            <input
                                id="taskTitle"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="e.g., Design the new logo"
                            />
                        </div>
                        <div>
                            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                id="taskDescription"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="Add more details about the task..."
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                <CustomDatePicker
                                    value={dueDate}
                                    onChange={setDueDate}
                                />
                            </div>
                            <div>
                                <label htmlFor="taskPriority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                <select
                                    id="taskPriority"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="taskWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"><BarChart2 size={12}/> Weight</label>
                                <select
                                    id="taskWeight"
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => (
                                        <option key={w} value={w}>{w}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignees</label>
                             <div className="mt-2 flex flex-wrap gap-2">
                                {projectMembers.map(member => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => {
                                            setAssigneeIds(prev =>
                                                prev.includes(member.id)
                                                    ? prev.filter(id => id !== member.id)
                                                    : [...prev, member.id]
                                            );
                                        }}
                                        className={`flex items-center gap-2 p-1 rounded-full text-gray-700 dark:text-gray-300 ${assigneeIds.includes(member.id) ? 'bg-brand-100 dark:bg-brand-900 ring-2 ring-brand-500' : 'bg-gray-100 dark:bg-gray-700'}`}
                                    >
                                        <Avatar user={member} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm pr-2">{member.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="taskTags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {tags.map(tag => (
                                    <span key={tag} className="flex items-center px-2 py-1 text-xs rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                id="taskTags"
                                type="text"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100"
                                placeholder="Add a tag and press Enter"
                            />
                            {tagSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border dark:border-gray-600">
                                    {tagSuggestions.map(suggestion => (
                                        <div key={suggestion} onClick={() => addTag(suggestion)} className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ">
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</label>
                            <div className="space-y-2 mt-1">
                                {attachments.map((att, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        <span className="truncate">{att.name}</span>
                                        <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700">
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
                                onClick={() => document.getElementById('file-upload-input')?.click()}
                            >
                                <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold text-brand-600">Click to upload</span> or drag and drop
                                </p>
                                <input id="file-upload-input" type="file" multiple className="hidden" onChange={(e) => e.target.files && handleAddAttachments(e.target.files)} />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-2 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700">
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;

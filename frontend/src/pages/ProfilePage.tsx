
import React, { useState, useEffect, useRef } from 'react';
import type { User, Project } from '../types';
import { Mail, Briefcase, Calendar, Sun, Moon, Phone, User as UserIcon, Camera } from 'lucide-react';
import Avatar from '../components/Avatar';
import ImageCropperModal from '../components/ImageCropperModal';
import imageCompression from 'browser-image-compression';

interface ProfilePageProps {
    currentUser: User;
    projects: Project[];
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onUpdateUser: (user: User, avatarFile?: File) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, projects, isDarkMode, onToggleTheme, onUpdateUser }) => {
    const [formState, setFormState] = useState(currentUser);
    const [isDirty, setIsDirty] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormState(currentUser);
        setIsDirty(false); // Reset dirty state when props change from above
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSave = () => {
        console.log("Saving user profile", formState, avatarFile);
        onUpdateUser(formState, avatarFile || undefined);
        setIsDirty(false);
        setAvatarFile(null);
    };

    const handleCancel = () => {
        setFormState(currentUser);
        setIsDirty(false);
        setAvatarFile(null);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if cancelled
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const compressImage = async (file: File): Promise<File> => {
        try {
            const options = {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 256,
                useWebWorker: true,
            };
            const compressedBlob = await imageCompression(file, options);
            return new File([compressedBlob], file.name, { type: 'image/jpeg' });
        } catch (error) {
            console.error('Image compression failed:', error);
            return file; // Return original file if compression fails
        }
    };

    const handleCropComplete = async (croppedUrl: string) => {
        // Convert base64 string to Blob, then to File
        const base64Data = croppedUrl.split(',')[1]; // Remove data:image/...;base64, prefix
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        let file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        // Compress the image before setting it
        file = await compressImage(file);
        
        setAvatarFile(file);
        setFormState(prev => ({ ...prev, avatarUrl: croppedUrl }));
        setIsDirty(true);
        setUploadedImage(null);
    };
    
    // Get all tasks assigned to the current user
    const myTasks = Object.values(projects).flatMap(p =>
        Object.values(p.tasks)
            .filter(t => t.assignees.some(a => a.id === currentUser.id))
            .map(t => ({ ...t, projectName: p.name }))
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 dark:bg-gray-900/80 overflow-auto h-full">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <Avatar user={formState} className="h-24 w-24 ring-4 ring-brand-500" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white w-8 h-8" />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{formState.name || 'New User'}</h1>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
                            <Mail size={16} />
                            <span>{formState.email || 'No email provided'}</span>
                        </p>
                    </div>
                </div>

                {/* Settings and My Tasks */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Settings Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                             <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Personal Information</h2>
                             <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input type="text" name="name" id="name" value={formState.name} onChange={handleChange} placeholder="Your full name" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                                </div>
                                 <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input type="email" name="email" id="email" value={formState.email || ''} onChange={handleChange} placeholder="your.email@example.com" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                                </div>
                                 <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                    <input type="tel" name="phone" id="phone" value={formState.phone || ''} onChange={handleChange} placeholder="Your phone number" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100" />
                                </div>
                                <div>
                                     <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                                     <select name="gender" id="gender" value={formState.gender || 'prefer-not-to-say'} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-brand-500 focus:border-brand-500 text-gray-900 dark:text-gray-100">
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                     </select>
                                </div>
                                {isDirty && (
                                     <div className="flex justify-end gap-2 pt-2">
                                        <button onClick={handleCancel} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white dark:text-gray-200 dark:bg-gray-700 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                                        <button onClick={handleSave} className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700">Save Changes</button>
                                     </div>
                                )}
                             </div>
                        </div>

                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                             <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Settings</h2>
                             <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                     <label htmlFor="theme-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</label>
                                     <button onClick={onToggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                    </button>
                                 </div>
                                 <div className="flex items-center justify-between">
                                      <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                                      {/* Mock toggle switch */}
                                      <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" value="" id="email-notifications" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                      </div>
                                 </div>
                                  <div className="flex items-center justify-between">
                                      <label htmlFor="push-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">Push Notifications</label>
                                      {/* Mock toggle switch */}
                                      <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" value="" id="push-notifications" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                      </div>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* My Tasks Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">My Tasks</h2>
                            </div>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                                {myTasks.length > 0 ? myTasks.sort((a,b) => (a.dueDate && b.dueDate) ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : a.dueDate ? -1 : 1 ).map(task => (
                                    <li key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{task.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                    <Briefcase size={12} /> {task.projectName}
                                                </p>
                                            </div>
                                            {task.dueDate && (
                                                <div className={`text-xs flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    <Calendar size={12} />
                                                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )) : (
                                    <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No tasks assigned to you.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            {uploadedImage && (
                <ImageCropperModal
                    imageUrl={uploadedImage}
                    onClose={() => setUploadedImage(null)}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
};

export default ProfilePage;

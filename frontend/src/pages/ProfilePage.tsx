
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Project, Task } from '../types';
import { 
    User as UserIcon, Mail, Phone, Camera, Save, X, 
    Settings, Bell, Shield, CheckCircle, Layout, 
    Moon, Sun, Briefcase, Calendar, Clock, Lock,
    CheckSquare, LogOut, ChevronRight
} from 'lucide-react';
import Avatar from '@components/common/Avatar';
import ImageCropperModal from '@components/modals/ImageCropperModal';
import imageCompression from 'browser-image-compression';

interface ProfilePageProps {
    currentUser: User;
    projects: Project[];
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onUpdateUser: (user: User, avatarFile?: File) => void;
}

type TabType = 'general' | 'tasks' | 'preferences' | 'security';

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, projects, isDarkMode, onToggleTheme, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [formState, setFormState] = useState(currentUser);
    const [isDirty, setIsDirty] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync form state if currentUser changes externally
    useEffect(() => {
        setFormState(currentUser);
        setIsDirty(false);
    }, [currentUser]);

    // --- Computed Data ---
    const myTasks = useMemo(() => {
        return projects.flatMap((p: Project) =>
            Object.values(p.tasks)
                .filter((t: Task) => t.assignees.some(a => a.id === currentUser.id))
                .map((t: Task) => ({ ...t, projectName: p.name, projectId: p.id }))
        ).sort((a, b) => {
            // Sort by due date (nearest first), then priority
            if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return 0;
        });
    }, [projects, currentUser.id]);

    const taskStats = useMemo(() => {
        const total = myTasks.length;
        const completed = myTasks.filter(t => t.completed).length;
        const pending = total - completed;
        return { total, completed, pending };
    }, [myTasks]);

    // --- Handlers ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdateUser(formState, avatarFile || undefined);
        setIsDirty(false);
        setAvatarFile(null);
    };

    const handleCancel = () => {
        setFormState(currentUser);
        setIsDirty(false);
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
        
        setFormState(prev => ({ ...prev, avatarUrl: croppedUrl }));
        setAvatarFile(file);
        setIsDirty(true);
        setUploadedImage(null);
    };

    // --- Render Components ---

    const NavButton = ({ id, icon: Icon, label, description }: { id: TabType, icon: any, label: string, description?: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center gap-4 group ${
                activeTab === id 
                    ? 'bg-white dark:bg-gray-800 shadow-md border-l-4 border-brand-500' 
                    : 'hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-sm'
            }`}
        >
            <div className={`p-2 rounded-lg ${activeTab === id ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-600'}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className={`font-semibold text-sm ${activeTab === id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{label}</p>
                {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
            </div>
            {activeTab === id && <ChevronRight size={16} className="ml-auto text-brand-500" />}
        </button>
    );

    return (
        <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900 overflow-hidden">
            {/* Header Banner */}
            <div className="h-48 w-full bg-gradient-to-r from-brand-600 to-purple-600 relative flex-shrink-0">
                <div className="absolute inset-0"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-50/50 dark:from-gray-900 to-transparent"></div>
            </div>

            <div className="flex-1 overflow-hidden relative -mt-16 z-10 px-4 sm:px-8 pb-8">
                <div className="max-w-6xl mx-auto h-full flex flex-col md:flex-row gap-8">
                    
                    {/* Left Column: Profile Card & Nav */}
                    <div className="opacity-0 animate-slide-up w-full md:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
                        {/* Profile Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700 p-6 flex flex-col items-center text-center">
                            <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                                <div className="ring-4 ring-white dark:ring-gray-900 rounded-full shadow-lg">
                                    <Avatar user={formState} className="h-28 w-28 text-3xl" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formState.name || 'User'}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{formState.email}</p>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="space-y-2">
                            <NavButton id="general" icon={UserIcon} label="General" description="Personal information" />
                            <NavButton id="tasks" icon={CheckSquare} label="My Tasks" description={`You have ${taskStats.pending} pending tasks`} />
                            <NavButton id="preferences" icon={Settings} label="Preferences" description="Theme & notifications" />
                            <NavButton id="security" icon={Shield} label="Security" description="Password & 2FA" />
                        </div>
                    </div>

                    {/* Right Column: Content Area */}
                    <div className="opacity-0 animate-slide-up flex-1 flex flex-col min-h-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
                        
                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="opacity-0 animate-slide-up flex-1 overflow-y-auto p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Settings</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Manage your personal details and public profile.</p>
                                    </div>
                                    {isDirty && (
                                        <div className="flex gap-3 animate-slide-up">
                                            <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-md transition-colors flex items-center gap-2">
                                                <Save size={16} /> Save Changes
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-3xl">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                                        <div className="relative">
                                            <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" name="name" value={formState.name} onChange={handleChange} 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="email" name="email" value={formState.email || ''} onChange={handleChange} 
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="tel" name="phone" value={formState.phone || ''} onChange={handleChange} placeholder="+1 (555) 000-0000"
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                                        <div className="relative">
                                            <select 
                                                name="gender" value={formState.gender || 'prefer-not-to-say'} onChange={handleChange}
                                                className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                                            >
                                                <option value="prefer-not-to-say">Prefer not to say</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronRight size={16} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MY TASKS TAB */}
                        {activeTab === 'tasks' && (
                            <div className="opacity-0 animate-slide-up flex-1 flex flex-col min-h-0">
                                <div className="p-8 border-b border-gray-200 dark:border-gray-700 flex justify-between items-end flex-shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h2>
                                        <p className="text-gray-500 dark:text-gray-400">Tasks assigned to you across all projects.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{taskStats.pending}</p>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                                        </div>
                                        <div className="w-px bg-gray-200 dark:bg-gray-700 h-10"></div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Done</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/30">
                                    {myTasks.length > 0 ? (
                                        <div className="space-y-3">
                                            {myTasks.map(task => {
                                                const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
                                                return (
                                                    <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group flex items-center justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`mt-1 p-1.5 rounded-full ${task.completed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                                                                {task.completed ? <CheckCircle size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current"></div>}
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-semibold text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</h4>
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="flex items-center gap-1 hover:text-brand-600 transition-colors"><Briefcase size={12} /> {task.projectName}</span>
                                                                    {task.dueDate && (
                                                                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
                                                                            <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-1.5 py-0.5 rounded uppercase font-bold text-[10px] ${
                                                                        task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                    }`}>
                                                                        {task.priority}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-600 transition-all p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                                            <Layout size={48} className="mb-4 opacity-50" />
                                            <p>No tasks assigned to you yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PREFERENCES TAB */}
                        {activeTab === 'preferences' && (
                            <div className="opacity-0 animate-slide-up flex-1 overflow-y-auto p-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Preferences</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">Customize your workspace experience.</p>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                                {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Appearance</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={onToggleTheme}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
                                        </button>
                                    </div>

                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                                <Bell size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white">Notifications</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive alerts.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pl-[4.5rem]">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="opacity-0 animate-slide-up flex-1 overflow-y-auto p-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Security</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">Keep your account secure.</p>

                                <div className="space-y-6 max-w-2xl">
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                                <Lock size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 dark:text-white">Change Password</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ensure your account uses a strong, unique password.</p>
                                                
                                                <div className="space-y-3">
                                                    <input type="password" placeholder="Current Password" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white" />
                                                    <input type="password" placeholder="New Password" className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white" />
                                                    <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                                                        Update Password
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <LogOut size={20} className="text-gray-500" />
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Log out of all devices</span>
                                        </div>
                                        <button className="text-sm text-red-600 hover:underline font-medium">Log Out All</button>
                                    </div>
                                </div>
                            </div>
                        )}

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
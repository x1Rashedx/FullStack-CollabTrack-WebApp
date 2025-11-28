import React from 'react';
import type { TeamMember, Project } from '@/types';
import { X, Mail, Phone, User as UserIcon, Briefcase } from 'lucide-react';
import Avatar from '@components/common/Avatar';

interface MemberProfileModalProps {
    member: TeamMember;
    teamProjects: Project[];
    onClose: () => void;
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ member, teamProjects, onClose }) => {
    const { user } = member;

    const assignedTasks = teamProjects.flatMap(project =>
        Object.values(project.tasks)
            .filter(task => task.assignees.some(assignee => assignee.id === user.id))
            .map(task => ({ ...task, projectName: project.name }))
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-start p-6 border-b dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <Avatar user={user} className="h-16 w-16 ring-4 ring-brand-500/50" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user.name || 'New User'}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.name?.toLowerCase().replace(/\s/g, '') || 'newuser'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </header>

                <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                    {/* Left Panel: Contact Info */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Contact Information</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                <span>{user.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <span>{user.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <UserIcon size={16} className="text-gray-400" />
                                <span className="capitalize">{user.gender?.replace('-', ' ') || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Panel: Assigned Tasks */}
                    <div className="md:col-span-2">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                            Assigned Tasks in this Team ({assignedTasks.length})
                        </h3>
                        {assignedTasks.length > 0 ? (
                            <div className="space-y-3 pr-2 -mr-2 max-h-96 overflow-y-auto">
                                {assignedTasks.map(task => (
                                    <div key={task.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{task.title}</p>
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <Briefcase size={12} className="mr-1.5" />
                                            <span>{task.projectName}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                No tasks assigned in this team's projects.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MemberProfileModal;
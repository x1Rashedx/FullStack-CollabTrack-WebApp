
import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Hash, CheckSquare, AlignLeft, Edit2 } from 'lucide-react';
import type { Project, Team } from '../types';
import Avatar from './Avatar';

interface ProjectInfoProps {
    project: Project;
    team: Team;
    isTeamAdmin: boolean;
    onUpdateProject: (updatedProject: Project) => void;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ project, team, isTeamAdmin, onUpdateProject }) => {
    const taskCount = Object.keys(project.tasks).length;
    const completedCount = Object.values(project.tasks).filter(t => t.completed).length;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState(project.name);
    
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editingDescription, setEditingDescription] = useState(project.description);

    useEffect(() => {
        setEditingName(project.name);
        setEditingDescription(project.description);
    }, [project.name, project.description]);

    const handleSaveName = () => {
        if (editingName.trim() && editingName !== project.name) {
            onUpdateProject({ ...project, name: editingName.trim() });
            project.name = editingName.trim();
        }
        setIsEditingName(false);
    };

    const handleSaveDescription = () => {
        if (editingDescription !== project.description) {
            onUpdateProject({ ...project, description: editingDescription });
            project.description = editingDescription;
        }
        setIsEditingDescription(false);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 mr-4">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={handleSaveName}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveName();
                                        if (e.key === 'Escape') {
                                            setIsEditingName(false);
                                            setEditingName(project.name);
                                        }
                                    }}
                                    autoFocus
                                    className="text-3xl font-bold bg-transparent border-b-2 border-brand-500 focus:outline-none text-gray-900 dark:text-white w-full mb-2"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 group">
                                    {project.name}
                                    {isTeamAdmin && (
                                        <button 
                                            onClick={() => setIsEditingName(true)} 
                                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Edit Project Name"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </h1>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Briefcase size={16} />
                                <span>Project ID: {project.id}</span>
                            </div>
                        </div>
                         <div className={`w-16 h-16 rounded-xl ${team.icon} flex items-center justify-center shadow-inner flex-shrink-0`}>
                             <span className="text-white font-bold text-xl">{project.name.charAt(0)}</span>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                             <AlignLeft size={16} /> Description
                             {isTeamAdmin && !isEditingDescription && (
                                <button 
                                    onClick={() => setIsEditingDescription(true)} 
                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title="Edit Description"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                        </h3>
                        
                        {isEditingDescription ? (
                            <textarea
                                value={editingDescription}
                                onChange={(e) => setEditingDescription(e.target.value)}
                                onBlur={handleSaveDescription}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsEditingDescription(false);
                                        setEditingDescription(project.description);
                                    }
                                }}
                                autoFocus
                                rows={4}
                                className="w-full text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-brand-500 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                {project.description || "No description provided."}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users size={20} className="text-brand-500" /> Owning Team
                        </h3>
                        <div className="flex items-center gap-4 mb-4">
                             <div className={`w-12 h-12 rounded-lg ${team.icon} shadow-sm`}></div>
                             <div>
                                 <p className="font-bold text-gray-900 dark:text-white">{team.name}</p>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                             </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            {team.description}
                        </p>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Team Members</p>
                            <div className="flex flex-wrap gap-2">
                                {team.members.map(member => (
                                    <div key={member.user.id} className="flex items-center gap-2 p-1.5 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 pr-3">
                                        <Avatar user={member.user} className="h-6 w-6" />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{member.user.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Hash size={20} className="text-brand-500" /> Quick Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                        <CheckSquare size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">Total Tasks</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{taskCount}</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                        <CheckSquare size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">Completed</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">{completedCount}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <Users size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">Contributors</span>
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {new Set(Object.values(project.tasks).flatMap(t => t.assignees.map(a => a.id))).size}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectInfo;

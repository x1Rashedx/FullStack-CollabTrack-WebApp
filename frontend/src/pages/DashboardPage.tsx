import React, { useState } from 'react';
import type { Project, Team, User } from '@/types';
import CreateProjectModal from '@components/modals/CreateProjectModal';
import CreateTeamModal from '@components/modals/CreateTeamModal';
import { Plus, Users, CheckSquare, Briefcase } from 'lucide-react';
import Avatar from '@components/common/Avatar';

interface DashboardPageProps {
    projects: Project[];
    teams: Team[];
    currentUser: User;
    onSelectProject: (projectId: string) => void;
    onCreateProject: (name: string, description: string, teamId: string) => void;
    onNavigateToTeam: (teamId: string) => void;
    onCreateTeam: (name: string, description: string, icon: string) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ projects, teams, currentUser, onSelectProject, onCreateProject, onNavigateToTeam, onCreateTeam }) => {
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);

    const getTeamForProject = (project: Project): Team | undefined => {
        return teams.find(team => team.id === project.teamId);
    };

    return (
        <div>
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Welcome back, {currentUser.name?.split(' ')[0] || 'User'}! Here's what's happening.</p>
                    </div>
                    <button onClick={() => setIsCreateTeamModalOpen(true)} className="flex items-center bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-900 w-full sm:w-auto justify-center">
                        <Plus size={20} className="mr-2" />
                        New Team
                    </button>
                </div>

                {/* Teams Section */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-brand-600 dark:text-brand-400" /> Your Teams
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.length > 0 ? teams.map(team => (
                            <div 
                                key={team.id}
                                onClick={() => onNavigateToTeam(team.id)}
                                className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 flex flex-col border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-lg ${team.icon} flex-shrink-0 shadow-sm`}></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{team.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow line-clamp-2">{team.description || "No description provided."}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex -space-x-2">
                                        {team.members.slice(0, 4).map(member => (
                                            <div key={member.user.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                <Avatar user={member.user} className="h-8 w-8" />
                                            </div>
                                        ))}
                                        {team.members.length > 4 && (
                                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                +{team.members.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-md">
                                        {team.projectIds.length} Projects
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-8 bg-white dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <Users size={32} className="mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">You haven't joined any teams yet.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Projects Section */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-brand-600 dark:text-brand-400" /> Your Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => {
                            const team = getTeamForProject(project);
                            return (
                                <div 
                                    key={project.id} 
                                    onClick={() => onSelectProject(project.id)}
                                    className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 flex flex-col border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
                                >
                                    <div className="flex-grow">
                                        {team && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`w-1.5 h-4 rounded-full ${team.icon}`}></div>
                                                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{team.name}</p>
                                            </div>
                                        )}
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 h-10 overflow-hidden text-ellipsis line-clamp-2">{project.description}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            <div className="flex items-center gap-1">
                                                <CheckSquare size={14} />
                                                <span>{Object.keys(project.tasks).length} Tasks</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`w-2 h-2 rounded-full ${Object.values(project.tasks).filter(t => t.completed).length === Object.keys(project.tasks).length && Object.keys(project.tasks).length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                <span>{Object.values(project.tasks).filter(t => t.completed).length}/{Object.keys(project.tasks).length} Done</span>
                                            </div>
                                        </div>
                                        {team && (
                                            <div className="flex -space-x-2">
                                                {team.members.slice(0, 5).map(member => (
                                                    <div key={member.user.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                        <Avatar user={member.user} className="h-6 w-6" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div onClick={() => setIsCreateProjectModalOpen(true)} className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors min-h-[200px]">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <Plus size={24} className="mx-auto mb-2"/>
                                <p className="font-semibold">Create a New Project</p>
                                <p className="text-xs mt-1">Start tracking your work</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {isCreateProjectModalOpen && (
                <CreateProjectModal 
                    onClose={() => setIsCreateProjectModalOpen(false)}
                    onCreate={onCreateProject}
                    teams={teams}
                />
            )}

            {isCreateTeamModalOpen && (
                <CreateTeamModal 
                    onClose={() => setIsCreateTeamModalOpen(false)} 
                    onCreate={onCreateTeam}
                />
            )}
        </div>
    );
};

export default DashboardPage;
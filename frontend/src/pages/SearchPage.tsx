import React, { useState, useEffect } from 'react';
import { Briefcase, Users, CheckSquare, Search as SearchIcon, MessageSquare } from 'lucide-react';
import type { Project, Team, Task, User } from '../types';
import Avatar from '../components/Avatar';
import { on } from 'events';

interface SearchPageProps {
    query: string;
    allProjects: Project[];
    allTeams: Team[];
    allUsers: User[];
    onSelectProject: (projectId: string) => void;
    onSelectTask: (projectId: string, taskId: string) => void;
    onNavigateToTeam: (teamId: string) => void;
    onStartConversation: (partnerId: string) => void;
    onViewUser: (user: User) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({
    query,
    allProjects,
    allTeams,
    allUsers,
    onSelectProject,
    onSelectTask,
    onNavigateToTeam,
    onStartConversation,
    onViewUser
}) => {
    const [results, setResults] = useState<{
        teams: Team[],
        projects: Project[],
        tasks: { task: Task, project: Project }[],
        users: User[]
    }>({ teams: [], projects: [], tasks: [], users: [] });

    useEffect(() => {
        if (query.length < 1) {
            setResults({ teams: [], projects: [], tasks: [], users: [] });
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Search Tasks
        const allTasks = allProjects.flatMap(p => 
            Object.values(p.tasks).map(t => ({ task: t, project: p }))
        );
        const filteredTasks = allTasks.filter(({ task }) =>
            task.title.toLowerCase().includes(lowerQuery) ||
            task.description.toLowerCase().includes(lowerQuery)
        );

        // Search Projects
        const filteredProjects = allProjects.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
        );
        
        // Search Teams
        const filteredTeams = allTeams.filter(t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery)
        );

        // Search Users
        const filteredUsers = allUsers.filter(u =>
            u.name.toLowerCase().includes(lowerQuery) ||
            u.email?.toLowerCase().includes(lowerQuery)
        );
        
        setResults({
            tasks: filteredTasks,
            projects: filteredProjects,
            teams: filteredTeams,
            users: filteredUsers,
        });

    }, [query, allProjects, allTeams, allUsers]);

    const hasResults = results.tasks.length > 0 || results.projects.length > 0 || results.teams.length > 0 || results.users.length > 0;

    const getTeamForProject = (teamId: string) => allTeams.find(t => t.id === teamId);

    return (
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto h-full">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Search results for "<span className="text-brand-600">{query}</span>"
            </h1>

            {hasResults ? (
                <div className="space-y-8">
                    {/* Teams Results */}
                    {results.teams.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Teams ({results.teams.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.teams.map(team => (
                                    <div key={team.id} onClick={() => onNavigateToTeam(team.id)} className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className={`w-12 h-12 rounded-lg ${team.icon} flex-shrink-0`}></div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{team.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                     {/* Projects Results */}
                    {results.projects.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Projects ({results.projects.length})</h2>
                            <div className="space-y-4">
                                {results.projects.map(project => {
                                    const team = getTeamForProject(project.teamId);
                                    return (
                                        <div key={project.id} onClick={() => onSelectProject(project.id)} className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{project.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                                            {team && <p className="text-xs text-brand-600 dark:text-brand-400 mt-2 font-semibold">{team.name}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    
                     {/* Tasks Results */}
                    {results.tasks.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Tasks ({results.tasks.length})</h2>
                            <div className="space-y-2">
                                {results.tasks.map(({ task, project }) => (
                                    <div key={task.id} onClick={() => onSelectTask(project.id, task.id)} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div>
                                            <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{task.title}</p>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <Briefcase size={12} className="mr-1.5" />
                                                <span>{project.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {task.assignees.slice(0, 3).map(user => (
                                                <div key={user.id} className="border-2 border-white dark:border-gray-800 rounded-full">
                                                    <Avatar user={user} className="h-6 w-6" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Users Results */}
                    {results.users.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Users ({results.users.length})</h2>
                            <div className="space-y-2">
                                {results.users.map(user => (
                                    <div key={user.id} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                                        <button onClick={() => onViewUser(user)} className="flex items-center gap-3 group text-left">
                                            <Avatar user={user} className="h-10 w-10 group-hover:ring-2 group-hover:ring-brand-500 transition-shadow" />
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">{user.name || 'New User'}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                            </div>
                                        </button>
                                        <button onClick={() => onStartConversation(user.id)} className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-100 p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/50">
                                            <MessageSquare size={16} />
                                            <span>Message</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <SearchIcon size={48} className="mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No results found</h2>
                    <p className="mt-1">Try a different search term.</p>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
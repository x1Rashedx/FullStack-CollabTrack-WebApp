import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Search, Bell, Briefcase, Users, LogOut, User as UserIcon } from 'lucide-react';
import type { Project, User, Task, Team } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
    currentProject: Project | null;
    currentTeam: Team | null;
    currentUser: User;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onNavigate: (page: 'dashboard' | 'teams' | 'settings' | 'messages') => void;
    onLogout: () => void;
    projects: Project[];
    allUsers: User[];
    allTeams: Team[];
    onSelectTask: (projectId: string, taskId: string) => void;
    onSearchSubmit: (query: string) => void;
    currentPage: string;
}

const Header: React.FC<HeaderProps> = ({ 
    currentProject, currentTeam, currentUser, isDarkMode, onToggleTheme, onNavigate, onLogout,
    projects, allUsers, allTeams, onSelectTask, onSearchSubmit, currentPage
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        teams: Team[],
        projects: Project[],
        tasks: { task: Task, project: Project }[],
        users: User[]
    }>({ teams: [], projects: [], tasks: [], users: [] });
    const [isSearchFocused, setSearchFocused] = useState(false);
    
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [isProfileOpen, setProfileOpen] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults({ teams: [], projects: [], tasks: [], users: [] });
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();

        // Search Tasks
        const allTasks = projects.flatMap(p => 
            Object.values(p.tasks).map(t => ({ task: t, project: p }))
        );
        const filteredTasks = allTasks.filter(({ task }) =>
            task.title.toLowerCase().includes(lowerQuery) ||
            task.description.toLowerCase().includes(lowerQuery)
        ).slice(0, 5);

        // Search Projects
        const filteredProjects = projects.filter(p =>
            p.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);
        
        // Search Teams
        const filteredTeams = allTeams.filter(t =>
            t.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        // Search Users
        const filteredUsers = allUsers.filter(u =>
            u.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);
        
        setSearchResults({
            tasks: filteredTasks,
            projects: filteredProjects,
            teams: filteredTeams,
            users: filteredUsers,
        });

    }, [searchQuery, projects, allUsers, allTeams]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchFocused(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectTask = (projectId: string, taskId: string) => {
        onSelectTask(projectId, taskId);
        setSearchQuery('');
        setSearchResults({ teams: [], projects: [], tasks: [], users: [] });
        setSearchFocused(false);
        setProfileOpen(false);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.trim().length > 0) {
            onSearchSubmit(searchQuery);
            setSearchFocused(false);
        }
    };

    const hasResults = searchResults.tasks.length > 0 || searchResults.projects.length > 0 || searchResults.teams.length > 0 || searchResults.users.length > 0;
    
    const pageTitle = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

    return (
        <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 z-20">
            <div className="min-w-0">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
                    {currentProject && currentPage === 'project' ? (
                        currentTeam ? (
                        <div className="flex items-center truncate">
                            <span
                                className="text-gray-500 dark:text-gray-400 hover:underline cursor-pointer"
                                onClick={() => onNavigate('teams')}
                            >
                                {currentTeam.name}
                            </span>
                            <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
                            <span className="truncate">{currentProject.name}</span>
                        </div>
                        ) : (
                           <span className="truncate">{currentProject.name}</span>
                        )
                    ) : (
                        pageTitle
                    )}
                </h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onKeyDown={handleSearchKeyDown}
                        className="w-full md:w-64 pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    />
                    {isSearchFocused && searchQuery && (
                        <div className="absolute top-full mt-2 w-full md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 max-h-96 overflow-y-auto">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {searchResults.tasks.length > 0 && (
                                    <li>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tasks</div>
                                        <ul>
                                        {searchResults.tasks.map(({ task, project }) => (
                                            <li key={task.id}>
                                                <button onClick={() => handleSelectTask(project.id, task.id)} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{task.title}</p>
                                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        <Briefcase size={12} className="mr-1.5" />
                                                        <span>{project.name}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                        </ul>
                                    </li>
                                )}
                                {searchResults.projects.length > 0 && (
                                     <ul>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</div>
                                        {searchResults.projects.map(project => (
                                            <li key={project.id}>
                                                <button onClick={() => handleSelectTask(project.id, '')} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                                                    <Briefcase size={16} className="text-gray-400" />
                                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{project.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                     </ul>
                                )}
                                {searchResults.teams.length > 0 && (
                                     <ul>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teams</div>
                                        {searchResults.teams.map(team => (
                                            <li key={team.id}>
                                                <button onClick={() => onNavigate('teams')} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                                                    <Users size={16} className="text-gray-400" />
                                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{team.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                     </ul>
                                )}
                                 {searchResults.users.length > 0 && (
                                     <ul>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</div>
                                        {searchResults.users.map(user => (
                                            <li key={user.id}>
                                                <button onClick={() => onNavigate('teams')} className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3">
                                                    <Avatar user={user} className="w-6 h-6" />
                                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{user.name || 'New User'}</span>
                                                </button>
                                            </li>
                                        ))}
                                     </ul>
                                )}
                                <li className="p-2">
                                     <button onClick={() => onSearchSubmit(searchQuery)} className="w-full text-center px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/50 rounded-md">
                                        View all results for "{searchQuery}"
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
                
                <button onClick={onToggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => { setNotificationsOpen(!isNotificationsOpen); setHasUnread(false); }} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                        <Bell size={20} />
                        {hasUnread && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>}
                    </button>
                    {isNotificationsOpen && (
                         <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700">
                             <div className="p-3 border-b dark:border-gray-700">
                                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Notifications</h3>
                             </div>
                             <ul className="py-1 max-h-72 overflow-y-auto">
                                <li className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">Maria Garcia commented on 'Design the new logo'.</li>
                                <li className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">New task assigned: 'Write API documentation'.</li>
                                <li className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300">Project 'Website Redesign' is due in 3 days.</li>
                             </ul>
                         </div>
                    )}
                </div>

                <div className="relative" ref={profileRef}>
                    <button onClick={() => setProfileOpen(prev => !prev)} className="flex items-center p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Avatar user={currentUser} className="h-9 w-9" />
                         <div className="ml-3 hidden md:block text-left">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">{currentUser.name || 'New User'}</p>
                            {currentUser.email && <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>}
                        </div>
                    </button>
                     {isProfileOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1">
                            <button
                                onClick={() => { onNavigate('settings'); setProfileOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <UserIcon size={16} /> Profile
                            </button>
                            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                            <button
                                onClick={() => { onLogout(); setProfileOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                            >
                                <LogOut size={16} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
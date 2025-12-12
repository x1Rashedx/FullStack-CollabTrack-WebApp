

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, Team, Project, TeamMember, Task } from '../types';
import CreateTeamModal from '@components/modals/CreateTeamModal';
import CreateProjectModal from '@/components/modals/CreateProjectModal';
import MemberProfileModal from '@/components/modals/MemberProfileModal';
import InviteMemberModal from '@/components/modals/InviteMemberModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import { 
    Plus, MoreVertical, Users, Briefcase, Trash2, MessageSquare, 
    UserCheck, UserX, Check, X as XIcon, Edit2, Image as ImageIcon, 
    ChevronsLeft, ChevronsRight, Settings, Activity, Calendar,
    BarChart3, LayoutGrid, List
} from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { Spinner } from '@/components/common';

interface TeamsPageProps {
    currentUser: User;
    allUsers: { [key: string]: User };
    allTeams: Team[];
    allProjects: { [key: string]: Project };
    onSelectProject: (projectId: string) => void;
    onCreateTeam: (name: string, description: string, icon: string) => void;
    onUpdateTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
    onCreateProject: (name: string, description: string, teamId: string) => void;
    onStartConversation: (partnerId: string) => void;
    onInviteMember: (teamId: string, email: string) => void;
    onRequestToJoin: (teamId: string) => void;
    onManageJoinRequest: (teamId: string, userId: string, action: 'approve' | 'deny') => void;
    teamToSelect: string | null;
    onClearTeamToSelect: () => void;
}

const TEAM_ICONS = [
    'bg-gradient-to-tr from-cyan-400 to-blue-600',
    'bg-gradient-to-tr from-purple-400 to-pink-600',
    'bg-gradient-to-tr from-green-400 to-teal-600',
    'bg-gradient-to-tr from-yellow-400 to-orange-600',
    'bg-gradient-to-tr from-red-500 to-red-700',
    'bg-gradient-to-tr from-indigo-500 to-purple-700',
    'bg-gradient-to-tr from-gray-600 to-gray-800',
    'bg-gradient-to-tr from-pink-500 to-rose-500',
];

const MIN_WIDTH = 240;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 80;

const TeamsPage: React.FC<TeamsPageProps> = ({ 
    currentUser, allUsers, allTeams, allProjects, 
    onSelectProject, onCreateTeam, onUpdateTeam, onDeleteTeam, 
    onCreateProject, onStartConversation, onInviteMember, 
    onRequestToJoin, onManageJoinRequest, teamToSelect, onClearTeamToSelect 
}) => {
    // --- State ---
    const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    
    // Sidebar State
    const [isTeamListCollapsed, setTeamListCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Selection & Tabs
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'members' | 'settings'>('overview');
    const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
    
    // Editing State
    const [editingTeamName, setEditingTeamName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingTeamDescription, setEditingTeamDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const iconPickerRef = useRef<HTMLDivElement>(null);
    
    const userTeams = allTeams.filter(team => team.members.some(m => m.user.id === currentUser.id));
    const otherTeams = allTeams.filter(team => !team.members.some(m => m.user.id === currentUser.id));

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem("teamsSidebarWidth");
        return saved ? parseInt(saved, 10) : 320;
    });

    useEffect(() => {
        localStorage.setItem("teamsSidebarWidth", sidebarWidth.toString());
    }, [sidebarWidth]);

    // --- Effects ---

    // Sync selected team with props/navigation
    useEffect(() => {
        if (teamToSelect) {
            const team = allTeams.find(t => t.id === teamToSelect);
            if (team) {
                setSelectedTeam(team);
                setActiveTab('overview');
            }
            onClearTeamToSelect();
            return;
        }

        if (selectedTeam) {
            const freshData = allTeams.find(t => t.id === selectedTeam.id);
            const isStillMember = freshData?.members.some(m => m.user.id === currentUser.id);

            if (freshData && isStillMember) {
                 if (JSON.stringify(freshData) !== JSON.stringify(selectedTeam)) {
                    setSelectedTeam(freshData);
                }
            } else {
                setSelectedTeam(userTeams.length > 0 ? userTeams[0] : null);
            }
        } else if (userTeams.length > 0) {
            setSelectedTeam(userTeams[0]);
        }
    }, [allTeams, teamToSelect, onClearTeamToSelect, currentUser.id, userTeams.length]);

    // Update local edit state when team changes
    useEffect(() => {
        if (selectedTeam) {
            setEditingTeamName(selectedTeam.name);
            setEditingTeamDescription(selectedTeam.description);
            // Reset tab if invalid for role
            const isAdmin = selectedTeam.members.find(m => m.user.id === currentUser.id)?.role === 'admin';
            if (activeTab === 'settings' && !isAdmin) setActiveTab('overview');
        }
    }, [selectedTeam, currentUser.id]);

    // Click outside handler for icon picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        if(isIconPickerOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isIconPickerOpen]);

    // --- Helpers ---

    const isCurrentUserAdmin = (team: Team) => {
        return team.members.find(m => m.user.id === currentUser.id)?.role === 'admin';
    };

    const teamProjects = useMemo(() => {
        return selectedTeam ? selectedTeam.projectIds.map(id => allProjects[id]).filter(Boolean) : [];
    }, [selectedTeam, allProjects]);

    const teamStats = useMemo(() => {
        if (!selectedTeam) return { members: 0, projects: 0, completion: 0 };
        
        const allTasks = teamProjects.flatMap(p => Object.values(p.tasks));
        const completedTasks = allTasks.filter(t => t.completed).length;
        const totalTasks = allTasks.length;
        const completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
            members: selectedTeam.members.length,
            projects: teamProjects.length,
            completion
        };
    }, [selectedTeam, teamProjects]);

    // --- Handlers ---

    const handleSaveTeamName = () => {
        if (selectedTeam && editingTeamName.trim()) {
            onUpdateTeam({ ...selectedTeam, name: editingTeamName.trim() });
        }
        setIsEditingName(false);
    };

    const handleSaveTeamDescription = () => {
        if (selectedTeam) {
            onUpdateTeam({ ...selectedTeam, description: editingTeamDescription });
        }
        setIsEditingDescription(false);
    };

    const handleIconChange = (iconClass: string) => {
        if (selectedTeam) {
            onUpdateTeam({ ...selectedTeam, icon: iconClass });
        }
        setIconPickerOpen(false);
    };

    // Sidebar Resizing
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    if (!selectedTeam && userTeams.length === 0 && otherTeams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-gray-900">
                <div className="w-24 h-24 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                    <Users size={48} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">Welcome to Teams</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 text-lg">
                    Collaborate with your colleagues, manage projects together, and track progress in one place.
                </p>
                <button 
                    onClick={() => setCreateTeamModalOpen(true)} 
                    className="flex items-center gap-2 bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:bg-brand-700 hover:scale-105 transition-all"
                >
                    <Plus size={24} />
                    Create Your First Team
                </button>
                {isCreateTeamModalOpen && (
                    <CreateTeamModal onClose={() => setCreateTeamModalOpen(false)} onCreate={onCreateTeam} />
                )}
            </div>
        );
    }

    return (
        <div className="flex h-full relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* --- Left Sidebar: Team Navigation --- */}
            <div 
                className={`bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl border-r dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0 z-20`}
                style={{ width: isTeamListCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
            >
                {/* Header */}
                <div className={`h-16 flex items-center px-4 border-b border-gray-100 dark:border-gray-700/50 ${isTeamListCollapsed ? 'justify-center p-1' : 'justify-between mb-4'}`}>
                    <h2 className={`text-xl font-bold text-gray-800 dark:text-white transition-opacity duration-300 ${isTeamListCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                        My Teams
                    </h2>
                    {isTeamListCollapsed && <Users size={20} className="mx-auto text-gray-400" />}
                    {!isTeamListCollapsed && (
                        <button 
                            onClick={() => setCreateTeamModalOpen(true)}
                            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                            title="New Team"
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
                

                {/* Team List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                    {/* User Teams */}
                    <div className="space-y-1">
                        {!isTeamListCollapsed && userTeams.length > 0 && (
                            <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Joined</p>
                        )}
                        {userTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeam(team)}
                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group ${
                                    selectedTeam?.id === team.id 
                                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 shadow-sm' 
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                                title={team.name}
                            >
                                <div className={`w-10 h-10 rounded-lg ${team.icon} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 ring-2 ring-transparent group-hover:ring-brand-200 dark:group-hover:ring-brand-800 transition-all`}>
                                    {team.name.charAt(0)}
                                </div>
                                {!isTeamListCollapsed && (
                                    <div className="text-left overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{team.name}</p>
                                        <p className="text-xs opacity-70 truncate">{team.members.length} members</p>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {!isTeamListCollapsed && userTeams.length === 0 && (
                        <p className="px-3 pb-7 text-sm text-gray-500">You are not a member of any team yet.</p>
                    )}

                    {/* Other Teams (Discover) */}
                    {otherTeams.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-2">
                            {!isTeamListCollapsed && (
                                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Discover</p>
                            )}
                            <div className="space-y-1">
                                {otherTeams.map(team => {
                                    const hasRequested = team.joinRequests?.includes(currentUser.id);
                                    return (
                                        <div key={team.id} className="group relative">
                                            <div className={`w-full flex items-center gap-3 p-2 rounded-xl ${isTeamListCollapsed ? 'justify-center' : ''} hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                                <div className={`w-10 h-10 rounded-lg ${team.icon} opacity-70 flex-shrink-0 grayscale group-hover:grayscale-0 transition-all`}></div>
                                                {!isTeamListCollapsed && (
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="font-semibold text-sm text-gray-600 dark:text-gray-400 truncate">{team.name}</p>
                                                    </div>
                                                )}
                                                {!isTeamListCollapsed && (
                                                    <button 
                                                        onClick={() => onRequestToJoin(team.id)}
                                                        disabled={hasRequested}
                                                        className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                            hasRequested 
                                                                ? 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200/80 dark:border-gray-700/80 cursor-not-allowed' 
                                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 text-brand-600 dark:text-brand-300 shadow-sm hover:bg-brand-50'
                                                        }`}
                                                    >
                                                        {hasRequested ? "Requested" : "Join"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button 
                    onClick={() => setTeamListCollapsed(p => !p)}
                    className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 h-16 w-5 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md"                >
                    {isTeamListCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
                </button>

                {/* Resizer */}
                {!isTeamListCollapsed && (
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-brand-500/50 transition-colors z-20"
                    />
                )}
            </div>

            {/* --- Main Content --- */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
                {selectedTeam ? (
                    <div className="min-h-full pb-10">
                        {/* 1. Hero Section */}
                        <div className={`relative h-48 w-full ${selectedTeam.icon} transition-all duration-700`}>
                            <div className="absolute inset-0 bg-gray-50/20"></div>
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent transition-all duration-1000"></div>
                            
                            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="flex items-end gap-6">
                                    {/* Floating Icon */}
                                    <div className="relative group">
                                        <div className={`w-24 h-24 rounded-2xl ${selectedTeam.icon} shadow-2xl border-4 border-white dark:border-gray-900 flex items-center justify-center text-white text-4xl font-bold transform translate-y-4 md:translate-y-8 transition-transform`}>
                                            {selectedTeam.name.charAt(0)}
                                        </div>
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button 
                                                onClick={() => setIconPickerOpen(true)}
                                                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 md:translate-y-8 z-10"
                                            >
                                                <ImageIcon size={24} />
                                            </button>
                                        )}
                                        {isIconPickerOpen && (
                                            <div ref={iconPickerRef} className="absolute top-full left-0 mt-10 z-50 bg-white dark:bg-gray-800 shadow-xl rounded-xl p-3 grid grid-cols-4 gap-2 w-64 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95">
                                                {TEAM_ICONS.map(iconClass => (
                                                    <button key={iconClass} onClick={() => handleIconChange(iconClass)} className={`w-10 h-10 rounded-lg ${iconClass} hover:scale-110 transition-transform ring-2 ring-offset-1 dark:ring-offset-gray-800 ${selectedTeam.icon === iconClass ? 'ring-brand-500' : 'ring-transparent'}`}></button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Info */}
                                    <div className="mb-1 md:mb-0">
                                        {isEditingName && isCurrentUserAdmin(selectedTeam) ? (
                                            <input 
                                                type="text"
                                                value={editingTeamName}
                                                onChange={(e) => setEditingTeamName(e.target.value)}
                                                onBlur={handleSaveTeamName}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTeamName(); if (e.key === 'Escape') setIsEditingName(false); }}
                                                autoFocus
                                                className="text-3xl md:text-4xl font-bold bg-transparent text-white border-b-2 border-white/50 focus:border-white focus:outline-none w-full"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-3 group">
                                                <h1 className="text-3xl md:text-4xl font-bold text-white shadow-sm">{selectedTeam.name}</h1>
                                                {isCurrentUserAdmin(selectedTeam) && (
                                                    <button onClick={() => setIsEditingName(true)} className="text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={18} /></button>
                                                )}
                                            </div>
                                        )}
                                        
                                        {isEditingDescription && isCurrentUserAdmin(selectedTeam) ? (
                                            <input
                                                value={editingTeamDescription}
                                                onChange={(e) => setEditingTeamDescription(e.target.value)}
                                                onBlur={handleSaveTeamDescription}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTeamDescription(); if (e.key === 'Escape') setIsEditingDescription(false); }}
                                                autoFocus
                                                className="mt-1 text-white/90 bg-white/10 rounded px-2 py-1 w-full focus:outline-none border border-white/30"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 group mt-1">
                                                <p className="text-white/80 text-sm md:text-base max-w-xl truncate">{selectedTeam.description || "Add a description..."}</p>
                                                {isCurrentUserAdmin(selectedTeam) && (
                                                    <button onClick={() => setIsEditingDescription(true)} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14} /></button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Header Stats / Actions */}
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="hidden md:flex gap-4 mr-4">
                                        <div className="text-center">
                                            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Members</p>
                                            <p className="text-xl font-bold text-white">{teamStats.members}</p>
                                        </div>
                                        <div className="w-px bg-white/20 h-8 self-center"></div>
                                        <div className="text-center">
                                            <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">Projects</p>
                                            <p className="text-xl font-bold text-white">{teamStats.projects}</p>
                                        </div>
                                    </div>
                                    
                                    {isCurrentUserAdmin(selectedTeam) && (
                                        <button 
                                            onClick={() => setInviteModalOpen(true)}
                                            className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg transition-all flex items-center gap-2"
                                        >
                                            <Users size={16} /> Invite
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => { setActiveTab('settings'); }}
                                        className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10"
                                        title="Settings"
                                    >
                                        <Settings size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Navigation Tabs */}
                        <div className="mt-12 px-6 md:px-8 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-8">
                                {[
                                    { id: 'overview', label: 'Overview', icon: LayoutGrid },
                                    { id: 'projects', label: 'Projects', icon: Briefcase },
                                    { id: 'members', label: 'Members', icon: Users },
                                    ...(isCurrentUserAdmin(selectedTeam) ? [{ id: 'settings', label: 'Settings', icon: Settings }] : [])
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`pb-3 flex items-center gap-2 text-sm font-medium transition-all border-b-2 ${
                                            activeTab === tab.id 
                                                ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                        {tab.id === 'settings' && (selectedTeam.joinRequests?.length || 0) > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{selectedTeam.joinRequests?.length}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Content Area */}
                        <div className="p-6 md:p-8">
                            
                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Active Projects Section */}
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                    <Briefcase size={20} className="text-brand-500" /> Active Projects
                                                </h3>
                                                {isCurrentUserAdmin(selectedTeam) && (
                                                    <button onClick={() => setCreateProjectModalOpen(true)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                                                        + New Project
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {teamProjects.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {teamProjects.slice(0, 4).map(project => {
                                                        const pTasks = Object.values(project.tasks) as Task[];
                                                        const pDone = pTasks.filter(t => t.completed).length;
                                                        const pProgress = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                                                        
                                                        return (
                                                            <div 
                                                                key={project.id} 
                                                                onClick={() => onSelectProject(project.id)}
                                                                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all cursor-pointer group"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-2">{project.name}</h4>
                                                                    <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-brand-500 transition-colors`}>
                                                                        <Activity size={16} />
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-4">{project.description || "No description."}</p>
                                                                
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                                                                        <span>Progress</span>
                                                                        <span>{pProgress}%</span>
                                                                    </div>
                                                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pProgress}%` }}></div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                                    <div className="flex -space-x-2">
                                                                        {selectedTeam.members.slice(0, 3).map(m => (
                                                                            <div key={m.user.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                                                <Avatar user={m.user} className="h-6 w-6" />
                                                                            </div>
                                                                        ))}
                                                                        {selectedTeam.members.length > 3 && (
                                                                            <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-bold">+{selectedTeam.members.length - 3}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">{pTasks.length} tasks</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-700">
                                                    <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-gray-500 dark:text-gray-400">No projects yet.</p>
                                                    {isCurrentUserAdmin(selectedTeam) && (
                                                        <button onClick={() => setCreateProjectModalOpen(true)} className="mt-4 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100">Create Project</button>
                                                    )}
                                                </div>
                                            )}
                                        </section>
                                    </div>

                                    {/* Sidebar Area: Members & Activity */}
                                    <div className="space-y-8">
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                    <Users size={20} className="text-purple-500" /> Key Members
                                                </h3>
                                                <button onClick={() => setActiveTab('members')} className="text-xs text-gray-500 hover:text-gray-700">View All</button>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                                                {selectedTeam.members.slice(0, 5).map(member => (
                                                    <div key={member.user.id} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <Avatar user={member.user} className="h-9 w-9" />
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{member.user.name}</p>
                                                                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => onStartConversation(member.user.id)}
                                                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <MessageSquare size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Mock Recent Activity */}
                                        <section>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                                <Activity size={20} className="text-orange-500" /> Recent Activity
                                            </h3>
                                            <div className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900"></div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold">Alex Johnson</span> created a new project <span className="text-brand-600">Q4 Marketing</span></p>
                                                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"></div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold">Maria Garcia</span> completed 3 tasks in <span className="text-brand-600">Website Redesign</span></p>
                                                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900"></div>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-semibold">James Smith</span> joined the team</p>
                                                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}

                            {/* PROJECTS TAB */}
                            {activeTab === 'projects' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">All Projects</h3>
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button onClick={() => setCreateProjectModalOpen(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 shadow-sm">
                                                <Plus size={18} /> New Project
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {teamProjects.map(project => {
                                            const taskCount = Object.keys(project.tasks).length;
                                            return (
                                                <div 
                                                    key={project.id} 
                                                    onClick={() => onSelectProject(project.id)}
                                                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-blue-50 dark:from-brand-900 dark:to-blue-900/50 rounded-xl flex items-center justify-center text-brand-600 dark:text-brand-400">
                                                            <Briefcase size={24} />
                                                        </div>
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 rounded-md">
                                                            {taskCount} Tasks
                                                        </span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{project.name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-6">{project.description || "No description provided."}</p>
                                                    
                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                        <div className="flex -space-x-2">
                                                            {selectedTeam.members.slice(0, 4).map(m => (
                                                                <div key={m.user.id} className="ring-2 ring-white dark:ring-gray-800 rounded-full">
                                                                    <Avatar user={m.user} className="h-8 w-8" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-semibold text-brand-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                            Open <ChevronsRight size={16} />
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button 
                                                onClick={() => setCreateProjectModalOpen(true)}
                                                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all min-h-[240px]"
                                            >
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                    <Plus size={32} />
                                                </div>
                                                <span className="font-semibold">Create New Project</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* MEMBERS TAB */}
                            {activeTab === 'members' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Team Members</h3>
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button onClick={() => setInviteModalOpen(true)} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 shadow-sm">
                                                <Users size={18} /> Invite Member
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {selectedTeam.members.map((member) => (
                                            <div key={member.user.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                                                <div onClick={() => setViewingMember(member)} className="cursor-pointer">
                                                    <Avatar user={member.user} className="h-14 w-14 ring-4 ring-gray-50 dark:ring-gray-700" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 onClick={() => setViewingMember(member)} className="font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:underline">{member.user.name || "New User"}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.user.email}</p>
                                                        </div>
                                                        {isCurrentUserAdmin(selectedTeam) && currentUser.id !== member.user.id && (
                                                            <div className="relative group/menu">
                                                                <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"><MoreVertical size={16} /></button>
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover/menu:block z-10">
                                                                    <button 
                                                                        onClick={() => onManageJoinRequest(selectedTeam.id, member.user.id, 'deny')} // Reusing deny for kick logic needs separate function ideally but okay for mock
                                                                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                                                    >
                                                                        <Trash2 size={12} /> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wide ${member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                            {member.role}
                                                        </span>
                                                        <button 
                                                            onClick={() => onStartConversation(member.user.id)}
                                                            className="text-xs font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1"
                                                        >
                                                            <MessageSquare size={14} /> Message
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SETTINGS / REQUESTS TAB (Admin Only) */}
                            {activeTab === 'settings' && isCurrentUserAdmin(selectedTeam) && (
                                <div className="max-w-2xl">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Team Settings</h3>
                                    
                                    {/* Join Requests */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-800 dark:text-white">Join Requests</h4>
                                            {selectedTeam.joinRequests && selectedTeam.joinRequests.length > 0 && (
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedTeam.joinRequests.length}</span>
                                            )}
                                        </div>
                                        {selectedTeam.joinRequests && selectedTeam.joinRequests.length > 0 ? (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {selectedTeam.joinRequests.map(userId => {
                                                    const user = allUsers[userId];
                                                    if (!user) return null;
                                                    return (
                                                        <div key={userId} className="p-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar user={user} className="h-10 w-10" />
                                                                <div>
                                                                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => onManageJoinRequest(selectedTeam.id, userId, 'deny')}
                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                                    title="Deny"
                                                                >
                                                                    <XIcon size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => onManageJoinRequest(selectedTeam.id, userId, 'approve')}
                                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                No pending requests
                                            </div>
                                        )}
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 p-6">
                                        <h4 className="text-red-800 dark:text-red-400 font-bold mb-2">Danger Zone</h4>
                                        <p className="text-sm text-red-600 dark:text-red-300/80 mb-4">
                                            Deleting this team will permanently remove all associated data, including projects and tasks. This action cannot be undone.
                                        </p>
                                        <button 
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete Team
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full gap-6 items-center justify-center p-8 text-center bg-white dark:bg-gray-900/50">
                        <div className='flex flex-col items-center justify-center'>
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center mb-6 animate-float">
                                <Users size={40} className="text-brand-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to Teams</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                Collaborate with your colleagues on projects and tasks seamlessly.
                                Create or Join a team to get started. 
                            </p>
                        </div>
                        <button 
                            onClick={() => setCreateTeamModalOpen(true)}
                            className="border-2 w-1/2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all min-h-[240px]"
                        >
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Plus size={32} />
                            </div>
                            <span className="font-semibold">Create New Team</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCreateTeamModalOpen && (
                <CreateTeamModal onClose={() => setCreateTeamModalOpen(false)} onCreate={onCreateTeam} />
            )}
            {isCreateProjectModalOpen && selectedTeam && (
                <CreateProjectModal 
                    onClose={() => setCreateProjectModalOpen(false)}
                    onCreate={onCreateProject}
                    teams={[selectedTeam]}
                    defaultTeamId={selectedTeam.id}
                />
            )}
            {isInviteModalOpen && selectedTeam && (
                <InviteMemberModal
                    onClose={() => setInviteModalOpen(false)}
                    onInvite={(email) => {
                        onInviteMember(selectedTeam.id, email);
                        setInviteModalOpen(false);
                    }}
                />
            )}
            {viewingMember && selectedTeam && (
                <MemberProfileModal
                    member={viewingMember}
                    teamProjects={teamProjects}
                    onClose={() => setViewingMember(null)}
                />
            )}
            {selectedTeam && (
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={() => { onDeleteTeam(selectedTeam.id); setShowDeleteConfirm(false); }}
                    title="Delete Team"
                    message={`Are you sure you want to delete "${selectedTeam.name}"?`}
                    confirmText="Delete Team"
                />
            )}
        </div>
    );
};

export default TeamsPage;
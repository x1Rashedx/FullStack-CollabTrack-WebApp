import React, { useState, useRef, useEffect } from 'react';
import type { User, Team, Project, TeamMember } from '../types';
import CreateTeamModal from '../components/CreateTeamModal';
import CreateProjectModal from '../components/CreateProjectModal';
import MemberProfileModal from '../components/MemberProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import { Plus, MoreVertical, Users, Briefcase, Trash2, MessageSquare, UserCheck, UserX, Check, X as XIcon, Edit2, Image as ImageIcon, PanelLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Avatar from '../components/Avatar';
import { TEAM_ICONS } from '../constants'

interface TeamsPageProps {
    currentUser: User;
    allUsers: { [key: string]: User };
    allTeams: Team[];
    allProjects: { [key: string]: Project };
    onSelectProject: (projectId: string) => void;
    onCreateTeam: (name: string, description: string, icon: string) => void;
    onUpdateTeam: (team: Team) => void;
    onCreateProject: (name: string, description: string, teamId: string) => void;
    onStartConversation: (partnerId: string) => void;
    onInviteMember: (teamId: string, email: string) => void;
    onRequestToJoin: (teamId: string) => void;
    onManageJoinRequest: (teamId: string, userId: string, action: 'approve' | 'deny') => void;
    teamToSelect: string | null;
    onClearTeamToSelect: () => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;
const COLLAPSED_WIDTH = 80;

const TeamsPage: React.FC<TeamsPageProps> = ({ currentUser, allUsers, allTeams, allProjects, onSelectProject, onCreateTeam, onUpdateTeam, onCreateProject, onStartConversation, onInviteMember, onRequestToJoin, onManageJoinRequest, teamToSelect, onClearTeamToSelect }) => {
    const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);

    const [isTeamListCollapsed, setTeamListCollapsed] = useState(false);

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem("teamSidebarWidth");
        return saved ? parseInt(saved, 10) : 320;
    });

    useEffect(() => {
        localStorage.setItem("teamSidebarWidth", sidebarWidth.toString());
    }, [sidebarWidth]);

    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'requests'>('projects');
    const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
    
    const [editingTeamName, setEditingTeamName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingTeamDescription, setEditingTeamDescription] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isIconPickerOpen, setIconPickerOpen] = useState(false);
    const iconPickerRef = useRef<HTMLDivElement>(null);

    const [isResizing, setIsResizing] = useState(false);
    
    const userTeams = allTeams.filter(team => team.members.some(m => m.user.id === currentUser.id));
    const otherTeams = allTeams.filter(team => !team.members.some(m => m.user.id === currentUser.id));

    // This effect synchronizes the selected team with external changes (props) for real-time updates.
    useEffect(() => {
        // Handle direct navigation from search
        if (teamToSelect) {
            const team = allTeams.find(t => t.id === teamToSelect);
            if (team) setSelectedTeam(team);
            onClearTeamToSelect();
            return;
        }

        // Keep local selectedTeam state in sync with allTeams prop
        if (selectedTeam) {
            const freshData = allTeams.find(t => t.id === selectedTeam.id);
            const isStillMember = freshData?.members.some(m => m.user.id === currentUser.id);

            if (freshData && isStillMember) {
                 if (JSON.stringify(freshData) !== JSON.stringify(selectedTeam)) {
                    setSelectedTeam(freshData);
                }
            } else {
                // Team was deleted or user was removed, select first available team
                setSelectedTeam(userTeams.length > 0 ? userTeams[0] : null);
            }
        } else if (userTeams.length > 0) {
            // If no team is selected, pick the first one
            setSelectedTeam(userTeams[0]);
        }
    }, [allTeams, teamToSelect, onClearTeamToSelect, currentUser.id]);

    // This effect reacts to changes in the selected team to update local editing states.
    useEffect(() => {
        if (selectedTeam) {
            setEditingTeamName(selectedTeam.name);
            setEditingTeamDescription(selectedTeam.description);

            const isAdmin = selectedTeam.members.find(m => m.user.id === currentUser.id)?.role === 'admin';
            const hasRequests = (selectedTeam.joinRequests?.length || 0) > 0;
            
            if (activeTab === 'requests' && (!isAdmin || !hasRequests)) {
                setActiveTab('projects');
            } else if (isAdmin && hasRequests && activeTab !== 'requests') {
                 setActiveTab('requests');
            } else if (activeTab !== 'projects' && activeTab !== 'members') {
                setActiveTab('projects');
            }

        }
    }, [selectedTeam, currentUser.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
                setIconPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKickMember = (team: Team, memberId: string) => {
        const updatedMembers = team.members.filter(m => m.user.id !== memberId);
        onUpdateTeam({ ...team, members: updatedMembers });
    };

    const handleRoleChange = (team: Team, memberId: string, newRole: 'admin' | 'member') => {
        const updatedMembers = team.members.map(m => 
            m.user.id === memberId ? { ...m, role: newRole } : m
        );
        onUpdateTeam({ ...team, members: updatedMembers });
    };

    const isCurrentUserAdmin = (team: Team) => {
        return team.members.find(m => m.user.id === currentUser.id)?.role === 'admin';
    };
    
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

    const teamProjects = selectedTeam ? selectedTeam.projectIds?.map(id => allProjects[id]).filter(Boolean) : [];
    const adminCount = selectedTeam ? selectedTeam.members.filter(m => m.role === 'admin').length : 0;
    const pendingRequestCount = selectedTeam?.joinRequests.length || 0;

    return (
        <div className="flex h-full relative">
            {/* Teams List Sidebar */}
            <div 
                className={`bg-white dark:bg-gray-800/50 border-r dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0`}
                style={{ width: isTeamListCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
            >
                 {isTeamListCollapsed ? (
                    <div className="p-2 pt-6 flex flex-col items-center gap-2 overflow-y-auto w-full">
                        <button 
                            onClick={() => {
                                setCreateTeamModalOpen(true);
                                setTeamListCollapsed(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold mb-4 flex-shrink-0"
                            title="New Team"
                        >
                            <Plus size={24} />
                        </button>
                        {userTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeam(team)}
                                className={`w-10 h-10 rounded-lg ${team.icon} flex-shrink-0 ring-2 ring-offset-2 dark:ring-offset-gray-800  ${selectedTeam?.id === team.id ? 'ring-brand-500' : 'ring-transparent'}`}
                                title={team.name}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-4 h-full w-full flex flex-col overflow-hidden" style={{width: sidebarWidth}}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Teams</h2>
                        </div>
                        
                        <button onClick={() => setCreateTeamModalOpen(true)} className="w-full flex items-center justify-center gap-2 p-2 mb-4 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold flex-shrink-0">
                            <Plus size={20} />
                            New Team
                        </button>
                        
                        <div className="flex-1 overflow-y-auto -mx-4 px-4">
                            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">My Teams</h3>
                            <div className="mt-2 space-y-1">
                                {userTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeam(team)}
                                        className={`w-full text-left flex items-center gap-3 p-2 rounded-lg text-gray-900 dark:text-gray-100 ${selectedTeam?.id === team.id ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${team.icon} flex-shrink-0`}></div>
                                        <div>
                                            <p className="font-semibold text-sm">{team.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {otherTeams.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discover Teams</h3>
                                    <div className="mt-2 space-y-1">
                                        {otherTeams.map(team => {
                                            const hasRequested = team.joinRequests?.includes(currentUser.id);
                                            return (
                                                <div key={team.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg ${team.icon} flex-shrink-0`}></div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{team.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{team.members.length} members</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => onRequestToJoin(team.id)}
                                                        disabled={hasRequested}
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-md disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/50 dark:text-brand-200 dark:hover:bg-brand-900"
                                                    >
                                                        {hasRequested ? 'Requested' : 'Join'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                 {!isTeamListCollapsed && (
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group"
                    >
                        <div className="w-full h-full bg-transparent group-hover:bg-brand-500/50 transition-colors duration-200"></div>
                    </div>
                 )}
            </div>

            {/* Selected Team Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {selectedTeam ? (
                    <div>
                        <div className="mb-6 flex items-start gap-4">
                            <div className="relative group">
                                <div className={`w-20 h-20 rounded-xl ${selectedTeam.icon} flex-shrink-0`}></div>
                                {isCurrentUserAdmin(selectedTeam) && (
                                     <button onClick={() => setIconPickerOpen(prev => !prev)} className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ImageIcon size={24} />
                                    </button>
                                )}
                                {isIconPickerOpen && (
                                    <div ref={iconPickerRef} className="absolute top-full mt-2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 grid grid-cols-[2rem_2rem_2rem]  gap-2">
                                        {TEAM_ICONS.map(iconClass => (
                                            <button key={iconClass} onClick={() => handleIconChange(iconClass)} className={`w-8 h-8 rounded-md ${iconClass}`}></button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                {isEditingName && isCurrentUserAdmin(selectedTeam) ? (
                                    <input 
                                        type="text"
                                        value={editingTeamName}
                                        onChange={(e) => setEditingTeamName(e.target.value)}
                                        onBlur={handleSaveTeamName}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTeamName(); if (e.key === 'Escape') setIsEditingName(false); }}
                                        autoFocus
                                        className="text-3xl font-bold bg-transparent border-b-2 border-brand-500 focus:outline-none text-gray-800 dark:text-white"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        {selectedTeam.name}
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button onClick={() => setIsEditingName(true)} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full">
                                                <Edit2 size={18} />
                                            </button>
                                        )}
                                    </h1>
                                )}
                                 {isEditingDescription && isCurrentUserAdmin(selectedTeam) ? (
                                    <textarea
                                        value={editingTeamDescription}
                                        onChange={(e) => setEditingTeamDescription(e.target.value)}
                                        onBlur={handleSaveTeamDescription}
                                        onKeyDown={(e) => { if (e.key === 'Escape') { setIsEditingDescription(false); setEditingTeamDescription(selectedTeam.description); } }}
                                        autoFocus
                                        rows={2}
                                        className="text-sm bg-gray-50 dark:bg-gray-700 border border-brand-500 focus:outline-none text-gray-800 dark:text-white w-full rounded-md p-1 mt-1"
                                    />
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                        {selectedTeam.description || "No description provided."}
                                        {isCurrentUserAdmin(selectedTeam) && (
                                            <button onClick={() => setIsEditingDescription(true)} className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full flex-shrink-0">
                                                <Edit2 size={14} />
                                            </button>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button onClick={() => setActiveTab('projects')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'projects' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
                                    Projects ({teamProjects.length})
                                </button>
                                <button onClick={() => setActiveTab('members')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'members' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
                                    Members ({selectedTeam.members.length})
                                </button>
                                 {isCurrentUserAdmin(selectedTeam) && (
                                     <button onClick={() => setActiveTab('requests')} className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'requests' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'}`}>
                                        Requests {pendingRequestCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{pendingRequestCount}</span>}
                                    </button>
                                 )}
                            </nav>
                        </div>

                        {/* Content based on tab */}
                        {activeTab === 'projects' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Team Projects</h3>
                                    {isCurrentUserAdmin(selectedTeam) && (
                                        <button onClick={() => setCreateProjectModalOpen(true)} className="flex items-center bg-brand-600 text-white font-semibold px-3 py-1.5 text-sm rounded-lg shadow-sm hover:bg-brand-700">
                                            <Plus size={16} className="mr-2" />
                                            New Project
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {teamProjects.map(project => (
                                        <div key={project.id} onClick={() => onSelectProject(project.id)} className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-5 flex flex-col">
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{project.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">{project.description}</p>
                                            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                 <div className="flex items-center"><Users size={16} className="mr-2"/>{selectedTeam.members.length} Members</div>
                                                 <div className="flex items-center"><Briefcase size={16} className="mr-2"/>{Object.keys(project.tasks).length} Tasks</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'members' && (
                           <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Team Members</h3>
                                    {isCurrentUserAdmin(selectedTeam) && (
                                        <button onClick={() => setInviteModalOpen(true)} className="flex items-center bg-brand-600 text-white font-semibold px-3 py-1.5 text-sm rounded-lg shadow-sm hover:bg-brand-700">
                                            <Plus size={16} className="mr-2" />
                                            Invite Member
                                        </button>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md">
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {selectedTeam.members.map((member) => {
                                            const { user, role } = member;
                                            const isLastAdmin = role === 'admin' && adminCount === 1;

                                            return (
                                                <li key={user.id} className="flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar user={user} className="h-10 w-10" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name || 'New User'}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${role === 'admin' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{role}</span>
                                                        {isCurrentUserAdmin(selectedTeam) && currentUser.id !== user.id && (
                                                            <MemberActionsDropdown 
                                                                member={member}
                                                                onKick={() => handleKickMember(selectedTeam, user.id)} 
                                                                onMessage={() => onStartConversation(user.id)}
                                                                onViewProfile={() => setViewingMember(member)}
                                                                onRoleChange={(newRole) => handleRoleChange(selectedTeam, user.id, newRole)}
                                                                isLastAdmin={isLastAdmin}
                                                            />
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                           </div>
                        )}
                         {activeTab === 'requests' && isCurrentUserAdmin(selectedTeam) && (
                            <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md">
                                <h3 className="p-4 text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-700">Pending Join Requests</h3>
                                {pendingRequestCount > 0 ? (
                                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {selectedTeam.joinRequests?.map(userId => {
                                            const user = allUsers[userId];
                                            if (!user) return null;
                                            return (
                                                <li key={userId} className="flex justify-between items-center p-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar user={user} className="h-10 w-10" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => onManageJoinRequest(selectedTeam.id, userId, 'deny')} className="p-2 text-red-600 bg-red-100 dark:bg-red-900/50 rounded-full hover:bg-red-200">
                                                          <XIcon size={16} />
                                                        </button>
                                                        <button onClick={() => onManageJoinRequest(selectedTeam.id, userId, 'approve')} className="p-2 text-green-600 bg-green-100 dark:bg-green-900/50 rounded-full hover:bg-green-200">
                                                          <Check size={16} />
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Users size={48} className="text-gray-400 dark:text-gray-500" />
                        <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">You're not on a team yet</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm">
                           Create your own team to start collaborating on projects, or join an existing one from the "Discover Teams" section in the sidebar.
                        </p>
                        <button onClick={() => setCreateTeamModalOpen(true)} className="mt-6 flex items-center bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-brand-700">
                            <Plus size={20} className="mr-2" />
                            Create a Team
                        </button>
                    </div>
                )}
            </div>
            
             <button 
                onClick={() => setTeamListCollapsed(p => !p)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-16 w-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md`}
                style={{ left: `${isTeamListCollapsed ? COLLAPSED_WIDTH : sidebarWidth}px` }}
                aria-label={isTeamListCollapsed ? "Expand teams list" : "Collapse teams list"}
            >
                {isTeamListCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
            
            {isCreateTeamModalOpen && (
                <CreateTeamModal onClose={() => setCreateTeamModalOpen(false)} onCreate={onCreateTeam} />
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
            {isCreateProjectModalOpen && selectedTeam && (
                <CreateProjectModal 
                    onClose={() => setCreateProjectModalOpen(false)}
                    onCreate={onCreateProject}
                    teams={[selectedTeam]}
                    defaultTeamId={selectedTeam.id}
                />
            )}
            {viewingMember && selectedTeam && (
                <MemberProfileModal
                    member={viewingMember}
                    teamProjects={teamProjects}
                    onClose={() => setViewingMember(null)}
                />
            )}
        </div>
    );
};

const MemberActionsDropdown: React.FC<{
    member: TeamMember;
    onKick: () => void;
    onMessage: () => void;
    onViewProfile: () => void;
    onRoleChange: (newRole: 'admin' | 'member') => void;
    isLastAdmin: boolean;
}> = ({ member, onKick, onMessage, onViewProfile, onRoleChange, isLastAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <MoreVertical size={20} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button onClick={() => { onViewProfile(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><Users size={16} /> View Profile</button>
                        <button onClick={() => { onMessage(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><MessageSquare size={16}/> Message</button>
                        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                        {member.role === 'member' ? (
                            <button onClick={() => { onRoleChange('admin'); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"><UserCheck size={16}/> Promote to Admin</button>
                        ) : (
                            <button 
                                onClick={() => { onRoleChange('member'); setIsOpen(false); }} 
                                disabled={isLastAdmin}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isLastAdmin ? "Cannot demote the last admin" : ""}
                            >
                                <UserX size={16}/> Demote to Member
                            </button>
                        )}
                        <button onClick={() => { onKick(); setIsOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                           <Trash2 size={16} /> Kick from Team
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPage;
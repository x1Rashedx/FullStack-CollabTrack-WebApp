import React from 'react';
import type { User, Team } from '@/types';
import { X, Mail, Phone, User as UserIcon, Plus } from 'lucide-react';
import Avatar from '@components/common/Avatar';

interface UserProfileModalProps {
    userToView: User;
    currentUser: User;
    allTeams: Team[];
    onInviteMember: (teamId: string, email: string) => void;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userToView, currentUser, allTeams, onInviteMember, onClose }) => {
    const adminTeams = allTeams.filter(team => 
        team.members.some(m => m.user.id === currentUser.id && m.role === 'admin')
    );

    const handleAddToTeam = (teamId: string) => {
        if (userToView.email) {
            onInviteMember(teamId, userToView.email);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-start p-6 border-b dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <Avatar user={userToView} className="h-16 w-16 ring-4 ring-brand-500/50" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{userToView.name || 'New User'}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{userToView.name?.toLowerCase().replace(/\s/g, '') || 'newuser'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </header>

                <main className="flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Contact Information</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                <span>{userToView.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <span>{userToView.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <UserIcon size={16} className="text-gray-400" />
                                <span className="capitalize">{userToView.gender?.replace('-', ' ') || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Add to Team */}
                    {adminTeams.length > 0 && userToView.id !== currentUser.id && (
                        <div className="space-y-4 pt-6 border-t dark:border-gray-700">
                             <h3 className="font-semibold text-gray-700 dark:text-gray-200">Add to Team</h3>
                             <div className="space-y-2">
                                {adminTeams.map(team => {
                                    const isMember = team.members.some(m => m.user.id === userToView.id);
                                    return (
                                        <div key={team.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded ${team.icon}`}></div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{team.name}</p>
                                            </div>
                                            {isMember ? (
                                                <span className="text-xs font-semibold text-gray-500">Already a member</span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAddToTeam(team.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/50 dark:text-brand-200 dark:hover:bg-brand-900"
                                                >
                                                    <Plus size={12}/>
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserProfileModal;
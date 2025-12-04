

import React, { useState, useMemo } from 'react';
import { X, Search, Plus, MessageSquare } from 'lucide-react';
import type { User, Team } from '@/types';
import Avatar from '@components/common/Avatar';

interface NewChatModalProps {
    currentUser: User;
    allUsers: { [key: string]: User };
    allTeams: { [key: string]: Team };
    onStartConversation: (partnerId: string) => void;
    onClose: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ currentUser, allUsers, allTeams, onStartConversation, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const usersArray = useMemo(() => Object.values(allUsers), [allUsers]);
    const teamsArray = useMemo(() => Object.values(allTeams), [allTeams]);

    const filteredUsers = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase();
        return usersArray.filter(
            user =>
                user.id !== currentUser.id && // Exclude current user
                (user.name.toLowerCase().includes(lowerQuery) || user.email?.toLowerCase().includes(lowerQuery))
        );
    }, [usersArray, currentUser.id, searchQuery]);

    const { mutualUsers, otherUsers } = useMemo(() => {
        const currentUserTeams = teamsArray.filter(team => team.members.some(m => m.user.id === currentUser.id));
        const currentUserTeamIds = new Set(currentUserTeams.map(t => t.id));

        const mutuals: User[] = [];
        const others: User[] = [];

        filteredUsers.forEach(user => {
            const userTeamIds = new Set(
                teamsArray.filter(team => team.members.some(m => m.user.id === user.id)).map(t => t.id)
            );
            const hasMutualTeam = Array.from(userTeamIds).some(teamId => currentUserTeamIds.has(teamId));

            if (hasMutualTeam) {
                mutuals.push(user);
            } else {
                others.push(user);
            }
        });

        // Sort alphabetically
        mutuals.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        others.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return { mutualUsers: mutuals, otherUsers: others };
    }, [filteredUsers, teamsArray, currentUser.id]);

    const getMutualTeams = (user: User) => {
        const userTeams = teamsArray.filter(team => team.members.some(m => m.user.id === user.id));
        const currentUserTeams = teamsArray.filter(team => team.members.some(m => m.user.id === currentUser.id));
        const mutualTeamNames = currentUserTeams
            .filter(ct => userTeams.some(ut => ut.id === ct.id))
            .map(t => t.name);
        return mutualTeamNames;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <MessageSquare size={24} className="text-brand-500" /> Start New Chat
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </header>

                <main className="flex-1 p-4 flex flex-col overflow-y-auto">
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                        {mutualUsers.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mutual Team Members</h3>
                                <div className="space-y-2">
                                    {mutualUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => onStartConversation(user.id)}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Avatar user={user} className="h-9 w-9" />
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email} 
                                                    {getMutualTeams(user).length > 0 && (
                                                        <span className="ml-1 text-xs text-brand-600 dark:text-brand-400">({getMutualTeams(user).join(', ')})</span>
                                                    )}
                                                </p>
                                            </div>
                                            <MessageSquare size={16} className="text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {otherUsers.length > 0 && (
                            <section>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Other Users</h3>
                                <div className="space-y-2">
                                    {otherUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => onStartConversation(user.id)}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <Avatar user={user} className="h-9 w-9" />
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <MessageSquare size={16} className="text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {mutualUsers.length === 0 && otherUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <Plus size={32} className="mx-auto mb-3" />
                                <p>No users found matching "{searchQuery}".</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default NewChatModal;
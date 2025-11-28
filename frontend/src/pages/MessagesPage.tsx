import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageSquare, PanelLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';
import type { User, DirectMessage } from '@/types';
import Avatar from '@components/common/Avatar';

interface MessagesPageProps {
    currentUser: User;
    users: { [key: string]: User };
    directMessages: DirectMessage[];
    onSendMessage: (receiverId: string, content: string) => void;
    initialPartnerId: string | null;
    onNavigateToUser: (userId: string) => void;
    onViewUser: (user: User) => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;
const COLLAPSED_WIDTH = 80;

const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, users, directMessages, onSendMessage, initialPartnerId, onNavigateToUser, onViewUser }) => {
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isUserListCollapsed, setUserListCollapsed] = useState(false);

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem("messagesSidebarWidth");
        return saved ? parseInt(saved, 10) : 320;
    });

    useEffect(() => {
        localStorage.setItem("messagesSidebarWidth", sidebarWidth.toString());
    }, [sidebarWidth]);    const [isResizing, setIsResizing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherUsers = Object.values(users).filter(u => u.id !== currentUser.id);

    useEffect(() => {
        if (initialPartnerId) {
            setSelectedPartnerId(initialPartnerId);
        } else if (otherUsers.length > 0 && !selectedPartnerId) {
            setSelectedPartnerId(otherUsers[0].id);
        }
    }, [initialPartnerId, otherUsers, selectedPartnerId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [directMessages, selectedPartnerId]);

    const handleSendMessage = () => {
        if (newMessage.trim() && selectedPartnerId) {
            onSendMessage(selectedPartnerId, newMessage.trim());
            setNewMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
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
    
    const conversationMessages = directMessages.filter(
        dm => (dm.senderId === currentUser.id && dm.receiverId === selectedPartnerId) ||
              (dm.senderId === selectedPartnerId && dm.receiverId === currentUser.id)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const selectedPartner = selectedPartnerId ? users[selectedPartnerId] : null;

    return (
        <div className="flex h-full relative">
            {/* User List Sidebar */}
            <div 
                className={`bg-white dark:bg-gray-800/50 border-r dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0`}
                style={{ width: isUserListCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
            >
                {isUserListCollapsed ? (
                    <div className="p-2 pt-6 flex flex-col items-center gap-2 overflow-y-auto w-full">
                        {otherUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => onNavigateToUser(user.id)}
                                title={user.name}
                                className="flex-shrink-0"
                            >
                                <Avatar user={user} className={`h-10 w-10 ring-2 ring-offset-2 dark:ring-offset-gray-800 ${selectedPartnerId === user.id ? 'ring-brand-500' : 'ring-transparent'}`} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 h-full w-full flex flex-col overflow-hidden" style={{width: sidebarWidth}}>
                        <div className="border-b dark:border-gray-700 flex justify-between items-center pb-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Messages</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto -mx-4">
                            {otherUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onNavigateToUser(user.id)}
                                    className={`w-full text-left flex items-center gap-3 p-3 ${selectedPartnerId === user.id ? 'bg-brand-100 dark:bg-brand-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <Avatar user={user} className="h-10 w-10" />
                                    <div>
                                        <p className={`font-semibold text-sm ${selectedPartnerId === user.id ? 'text-brand-800 dark:text-brand-200' : 'text-gray-800 dark:text-gray-200'}`}>{user.name || 'New User'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 {!isUserListCollapsed && (
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize group"
                    >
                        <div className="w-full h-full bg-transparent group-hover:bg-brand-500/50 transition-colors duration-200"></div>
                    </div>
                )}
            </div>

            {/* Chat Pane */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                {selectedPartner ? (
                    <>
                        <div className="h-16 border-b dark:border-gray-700 flex items-center px-6 flex-shrink-0 bg-white dark:bg-gray-800">
                             <button onClick={() => onViewUser(selectedPartner)} className="flex items-center gap-3 group">
                                <Avatar user={selectedPartner} className="h-9 w-9 group-hover:ring-2 group-hover:ring-brand-500 transition-shadow" />
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{selectedPartner.name || 'New User'}</h2>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                             {conversationMessages.map(msg => (
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                     <Avatar user={users[msg.senderId]} className="h-8 w-8" />
                                     <div className={`p-3 rounded-lg max-w-md ${msg.senderId === currentUser.id ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className={`text-xs mt-1 opacity-70 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                     </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Message ${selectedPartner.name || 'user'}`}
                                    className="w-full pl-4 pr-12 py-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                                />
                                <button onClick={handleSendMessage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 rounded-full bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <div>
                            <MessageSquare size={48} className="mx-auto" />
                            <p className="mt-2">Select a conversation to start messaging.</p>
                        </div>
                    </div>
                )}
            </div>
             <button 
                onClick={() => setUserListCollapsed(p => !p)}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-16 w-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md`}
                style={{ left: `${isUserListCollapsed ? COLLAPSED_WIDTH : sidebarWidth}px` }}
                aria-label={isUserListCollapsed ? "Expand user list" : "Collapse user list"}
            >
                {isUserListCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
        </div>
    );
};

export default MessagesPage;
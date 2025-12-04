
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Search, MessageSquare, Plus, Phone, Video, Info, Mail, Paperclip, Loader2, Check, CheckCheck, XCircle, CornerDownLeft, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { User, DirectMessage, Attachment, Team } from '@/types';
import Avatar from '@components/common/Avatar';
import NewChatModal from '@components/modals/NewChatModal'; // Import the new modal
import Spinner from '@components/common/Spinner';

interface MessagesPageProps {
    currentUser: User;
    users: { [key: string]: User };
    directMessages: DirectMessage[];
    onSendMessage: (receiverId: string, content: string, attachments: Attachment[], parentId?: string) => void;
    initialPartnerId: string | null;
    onNavigateToUser: (userId: string) => void;
    onViewUser: (user: User) => void;
    allUsers: { [key: string]: User }; // Added for NewChatModal
    allTeams: { [key: string]: Team }; // Added for NewChatModal
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 450;
const COLLAPSED_WIDTH = 80;


const fileToAttachment = (file: File): Attachment => ({
    id: `file-${Date.now()}-${file.name}`,
    name: file.name,
    url: URL.createObjectURL(file), // Create a blob URL for preview
    createdAt: new Date().toISOString(),
});

// Helper to format relative time (e.g., "10:30 AM", "Yesterday", "Mon")
const formatMessageTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

// Helper to check if two dates are different days
const isDifferentDay = (d1: string, d2: string) => {
    return new Date(d1).toDateString() !== new Date(d2).toDateString();
};

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, users, directMessages, onSendMessage, initialPartnerId, onNavigateToUser, onViewUser, allUsers, allTeams }) => {
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [replyingToMessage, setReplyingToMessage] = useState<DirectMessage | null>(null);
    const [isUserListCollapsed, setUserListCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Email Assistant Modal State
    const [isEmailAssistantOpen, setIsEmailAssistantOpen] = useState(false);
    // New Chat Modal State
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);


    // --- Derived Data: Sorted Contacts with Last Message ---
    const contacts = useMemo(() => {
        // Fix: Explicitly type 'otherUsers' to avoid 'unknown' inference in map
        const otherUsers = (Object.values(users) as User[]).filter((u: User) => u.id !== currentUser.id);
        
        return otherUsers.map(user => {
            const msgs = directMessages.filter(
                m => (m.senderId === currentUser.id && m.receiverId === user.id) ||
                     (m.senderId === user.id && m.receiverId === currentUser.id)
            );
            // Sort to find last message
            const sortedMsgs = msgs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const lastMsg = sortedMsgs[0];
            
            return {
                user,
                lastMessage: lastMsg,
                timestamp: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0
            };
        }).sort((a, b) => {
            // Sort contacts by most recent message, then alphabetical
            if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
            return a.user.name.localeCompare(b.user.name);
        }).filter(contact => 
            contact.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            contact.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, directMessages, currentUser.id, searchQuery]);

    useEffect(() => {
        if (initialPartnerId) {
            setSelectedPartnerId(initialPartnerId);
            onNavigateToUser(initialPartnerId); // Ensure sidebar highlights
        } else if (contacts.length > 0 && !selectedPartnerId) {
            // Optional: Auto-select first contact if none selected
            // setSelectedPartnerId(contacts[0].user.id);
        }
    }, [initialPartnerId, selectedPartnerId, onNavigateToUser]); // Removed contacts from deps to prevent auto-switching on search
    
    // Scroll to bottom
    useEffect(() => {
        if (selectedPartnerId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [directMessages, selectedPartnerId]);

    const handleSendMessage = () => {
        if (!newMessage.trim() && selectedFiles.length === 0 || !selectedPartnerId) return;

        const attachments = selectedFiles.map(fileToAttachment);
        const parentId = replyingToMessage?.id;

        onSendMessage(selectedPartnerId!, newMessage.trim(), attachments, parentId);
        setNewMessage('');
        setSelectedFiles([]);
        setReplyingToMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Sidebar resizing logic
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
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
        if (fileInputRef.current && selectedFiles.length === 1 && selectedFiles[0].name === fileName) {
            fileInputRef.current.value = '';
        }
    };

    const getParentMessageSnippet = (parentId: string | undefined): DirectMessage | undefined => {
        if (!parentId) return undefined;
        return directMessages.find(msg => msg.id === parentId);
    };

    const conversationMessages = useMemo(() => {
        if (!selectedPartnerId) return [];
        return directMessages.filter(
            dm => (dm.senderId === currentUser.id && dm.receiverId === selectedPartnerId) ||
                  (dm.senderId === selectedPartnerId && dm.receiverId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [directMessages, currentUser.id, selectedPartnerId]);

    const selectedPartner = selectedPartnerId ? (users[selectedPartnerId] as User) : null;

    const handleStartNewConversation = (partnerId: string) => {
        setIsNewChatModalOpen(false);
        setSelectedPartnerId(partnerId);
        onNavigateToUser(partnerId);
        // If a conversation already exists, it will load. If not, the chat area will be empty.
    }

    return (
        <div className="flex h-full relative bg-white dark:bg-gray-900 overflow-hidden">
            {/* --- Contacts Sidebar --- */}
            <div 
                className={`bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl border-r dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0 z-20`}
                style={{ width: isUserListCollapsed ? COLLAPSED_WIDTH : sidebarWidth }}
            >
                {/* Sidebar Header & Search */}
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className={`flex items-center ${isUserListCollapsed ? 'justify-center p-1' : 'justify-between mb-4'}`}>
                        <h2 className={`text-xl font-bold text-gray-800 dark:text-white ${isUserListCollapsed ? 'hidden' : 'block'}`}>Messages</h2>
                        {isUserListCollapsed && <MessageSquare size={24} className="text-brand-600" />}
                        {!isUserListCollapsed && (
                            <button 
                                onClick={() => setIsNewChatModalOpen(true)} // Open NewChatModal
                                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
                                title="New Chat"
                            >
                                <Plus size={18} />
                            </button>
                        )}
                    </div>
                    {!isUserListCollapsed && (
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search messages..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:text-gray-100"
                            />
                        </div>
                    )}
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {contacts.map(({ user, lastMessage }) => (
                        <button
                            key={user.id}
                            onClick={() => { setSelectedPartnerId(user.id); onNavigateToUser(user.id); }}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                                selectedPartnerId === user.id 
                                    ? 'bg-brand-50 dark:bg-brand-900/30 shadow-sm border border-brand-100 dark:border-brand-800/30' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent'
                            } ${isUserListCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className="relative flex-shrink-0">
                                <Avatar user={user} className={`h-10 w-10 ring-2 ${selectedPartnerId === user.id ? 'ring-brand-200 dark:ring-brand-800' : 'ring-transparent'}`} />
                                {user.id === 'user-2' && ( // Mock online status for demo
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                                )}
                            </div>
                            {!isUserListCollapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={`font-semibold text-sm truncate ${selectedPartnerId === user.id ? 'text-brand-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {user.name}
                                        </h3>
                                        {lastMessage && (
                                            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                                                {formatMessageTime(lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${selectedPartnerId === user.id ? 'text-brand-600/80 dark:text-brand-300/70' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                                        {lastMessage ? (
                                            <>
                                                {lastMessage.senderId === currentUser.id && <span className="font-medium mr-1">You:</span>}
                                                {lastMessage.content}
                                            </>
                                        ) : (
                                            <span className="italic opacity-70">No messages yet</span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Sidebar Collapse/Resize Controls */}
                <button 
                    onClick={() => setUserListCollapsed(p => !p)}
                    className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 h-16 w-5 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md"                >
                    {isUserListCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
                </button>
                {!isUserListCollapsed && (
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-brand-500/50 transition-colors z-20"
                    />
                )}
            </div>

            {/* --- Chat Area --- */}
            <div className="flex-1 flex flex-col h-full relative">
                {selectedPartner ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-16 px-6 flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewUser(selectedPartner)}>
                                <Avatar user={selectedPartner} className="h-9 w-9" />
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white group-hover:underline decoration-brand-500 underline-offset-2">{selectedPartner.name}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Start Call (Mock)">
                                    <Phone size={18} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Video Call (Mock)">
                                    <Video size={18} />
                                </button>
                                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                <button
                                    onClick={() => setIsEmailAssistantOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors border border-brand-100 dark:border-brand-800"
                                >
                                    <Mail size={14} />
                                    Email Assistant
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
                                    <Info size={18} />
                                </button>
                            </div>
                        </header>

                        {/* Messages Feed */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-brand-100/25 dark:bg-gray-900/50">
                            {conversationMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                    <Avatar user={selectedPartner} className="h-20 w-20 mb-4 ring-8 ring-gray-100 dark:ring-gray-800" />
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Say hello to {selectedPartner.name}!</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mt-1">This is the start of your conversation. Messages are secured and private.</p>
                                </div>
                            ) : (
                                conversationMessages.map((msg, index) => {
                                    const isCurrentUser = msg.senderId === currentUser.id;
                                    const parentMessage = getParentMessageSnippet(msg.parentId);
                                    const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    
                                    // Date Separator Logic
                                    const prevMsg = conversationMessages[index - 1];
                                    const showDateSeparator = !prevMsg || isDifferentDay(prevMsg.timestamp, msg.timestamp);
                                    const dateLabel = new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                                    return (
                                        <React.Fragment key={msg.id}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-4">
                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {dateLabel}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className={`flex group ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                                <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                    {/* Reply snippet */}
                                                    {parentMessage && (
                                                        <div 
                                                            className={`mb-1 text-xs px-3 py-1.5 rounded-lg border opacity-80 cursor-pointer ${
                                                                isCurrentUser 
                                                                    ? 'bg-brand-50 border-brand-100 text-brand-800 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-300 mr-1' 
                                                                    : 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 ml-1'
                                                            }`}
                                                        >
                                                            <span className="font-bold mr-1">{users[parentMessage.senderId]?.name}:</span>
                                                            <span className="line-clamp-1">{parentMessage.content}</span>
                                                        </div>
                                                    )}

                                                    {/* Message Bubble */}
                                                    <div className="relative">
                                                        <div 
                                                            className={`px-4 py-2.5 shadow-sm text-sm relative ${
                                                                isCurrentUser 
                                                                    ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl rounded-tr-none' 
                                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none'
                                                            }`}
                                                        >
                                                            <p className="whitespace-pre-wrap break-all leading-relaxed">{msg.content}</p>
                                                            
                                                            {/* Attachments */}
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="mt-2 space-y-1.5">
                                                                    {msg.attachments.map(att => (
                                                                        <a 
                                                                            key={att.id} 
                                                                            href={att.url} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer" 
                                                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                                                                                isCurrentUser 
                                                                                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                                                                                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                                                                            }`}
                                                                        >
                                                                            <div className={`p-1.5 rounded ${isCurrentUser ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                                                <Paperclip size={12} />
                                                                            </div>
                                                                            <span className="truncate max-w-[150px]">{att.name}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isCurrentUser ? 'text-brand-100' : 'text-gray-400'}`}>
                                                                <span>{formattedTime}</span>
                                                            </div>
                                                        </div>

                                                        {/* Hover Actions */}
                                                        <button 
                                                            onClick={() => setReplyingToMessage(msg)}
                                                            className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-brand-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                                                                isCurrentUser ? '-left-10' : '-right-10'
                                                            }`}
                                                            title="Reply"
                                                        >
                                                            <CornerDownLeft size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-2 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 relative z-20">
                            {replyingToMessage && (
                                <div className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-brand-500 shadow-sm animate-slide-up">
                                    <div className="flex flex-col text-sm overflow-hidden">
                                        <span className="font-bold text-brand-600 dark:text-brand-400 text-xs mb-0.5">Replying to {users[replyingToMessage.senderId]?.name}</span>
                                        <span className="text-gray-600 dark:text-gray-300 line-clamp-1">{replyingToMessage.content}</span>
                                    </div>
                                    <button onClick={() => setReplyingToMessage(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 opacity-0 animate-slide-up">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium border border-brand-100 dark:border-brand-800">
                                            <Paperclip size={12} />
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <button onClick={() => handleRemoveFile(file.name)} className="hover:text-red-500 ml-1"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative flex items-center gap-2 m-2 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-brand-500/50 transition-shadow">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 rounded-xl transition-colors flex-shrink-0"
                                    title="Attach files"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="flex-1 max-h-32 py-2.5 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none custom-scrollbar"
                                    style={{ minHeight: '44px' }}
                                />
                                
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                                    className={`p-2.5 mr-0.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                                        !newMessage.trim() && selectedFiles.length === 0
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    <Send size={18} className={newMessage.trim() ? "ml-0.5" : ""} />
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">Press Enter to send, Shift + Enter for new line</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center mb-6 animate-float">
                            <MessageSquare size={40} className="text-brand-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to Messages</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            Select a conversation from the sidebar or start a new one to collaborate with your team.
                        </p>
                    </div>
                )}
            </div>

            {isNewChatModalOpen && (
                <NewChatModal
                    currentUser={currentUser}
                    allUsers={allUsers}
                    allTeams={allTeams}
                    onStartConversation={handleStartNewConversation}
                    onClose={() => setIsNewChatModalOpen(false)}
                />
            )}
        </div>
    );
}

export default MessagesPage;
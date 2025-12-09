
import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronsRight, MessageSquare, ChevronsLeft, Paperclip, Loader2, Check, XCircle, CornerDownLeft, X, CheckCheck } from 'lucide-react';
import type { ChatMessage, User, Attachment } from '@/types';
import Avatar from '@components/common/Avatar';
import Spinner from '@components/common/Spinner'; // Re-use Spinner for loading

interface ChatProps {
    messages: ChatMessage[];
    currentUser: User;
    // FIX: Updated onSendMessage to return Promise<void>
    onSendMessage: (content: string, attachments: Attachment[], parentId?: string) => Promise<void>; 
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    width: number;
    onResize: (width: number) => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;

// Utility to convert File to Attachment for mock API
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


const Chat: React.FC<ChatProps> = ({ messages, currentUser, onSendMessage, isCollapsed, onToggleCollapse, width, onResize }) => {
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [replyingToMessage, setReplyingToMessage] = useState<ChatMessage | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSendingMessage, setIsSendingMessage] = useState(false); // New: to disable send button
    const [isResizing, setIsResizing] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior: behavior });
    };

    // Scroll to bottom when new messages arrive, but instantly for initial load
    useEffect(() => {
        scrollToBottom(messages.length === 0 ? "auto" : "smooth");
    }, [messages]);

    const handleSend = async () => {
        if ((!newMessage.trim() && selectedFiles.length === 0) || isSendingMessage) return;

        setIsSendingMessage(true);
        const attachments = selectedFiles.map(fileToAttachment);
        const parentId = replyingToMessage?.id;

        await onSendMessage(newMessage.trim(), attachments, parentId); // Await the send operation
        setNewMessage('');
        setSelectedFiles([]);
        setReplyingToMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input
        }
        setIsSendingMessage(false); // Re-enable send button
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth - (moveEvent.clientX - startX);
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                onResize(newWidth);
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
        // Clear value of file input if all files removed
        if (fileInputRef.current && selectedFiles.length === 1 && selectedFiles[0].name === fileName) {
            fileInputRef.current.value = '';
        }
    };

    const getParentMessageSnippet = (parentId: string | undefined): ChatMessage | undefined => {
        if (!parentId) return undefined;
        return messages.find(msg => msg.id === parentId);
    };

    return (
        <div 
            className={`bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0`}
            style={{ width: isCollapsed ? 64 : width }}
        >
            <button 
                onClick={onToggleCollapse} 
                className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 h-16 w-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm hover:shadow-md"
                aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
            >
                {isCollapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
            </button>

            {!isCollapsed ? (
                <>
                    <div className="h-14 border-b dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Project Chat</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white/50 dark:bg-gray-900/50">
                        {messages.length === 0 && (
                             <p className="text-center text-gray-500 dark:text-gray-400 italic">No messages yet. Start the conversation!</p>
                        )}
                        {messages.map((msg, index) => {
                            const isCurrentUser = msg.author.id === currentUser.id;
                            const parentMessage = getParentMessageSnippet(msg.parentId);
                            const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            
                            // Date Separator Logic
                            const prevMsg = messages[index - 1];
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
                                        {!isCurrentUser && (<Avatar user={msg.author} className="h-8 w-8 flex-shrink-0 mr-2" />)}
                                        <div className={`flex flex-col max-w-[95%] sm:max-w-[90%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                            {/* Reply snippet */}
                                            {parentMessage && (
                                                <div 
                                                    className={`mb-1 text-xs px-3 py-1.5 rounded-lg border opacity-80 cursor-pointer ${
                                                        isCurrentUser 
                                                            ? 'bg-primary-50 border-primary-100 text-primary-800 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300 mr-1' 
                                                            : 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 ml-1'
                                                    }`}
                                                >
                                                    <span className="font-bold mr-1">{parentMessage.author.name}:</span>
                                                    <span className="line-clamp-1">{parentMessage.content}</span>
                                                </div>
                                            )}

                                            {/* Message Bubble */}
                                            <div className="relative">
                                                <div 
                                                    className={`px-3 py-0.5 pt-2 shadow-sm text-sm relative ${
                                                        isCurrentUser 
                                                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-tr-none' 
                                                            : 'pl-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none'
                                                    }`}
                                                >
                                                    {!isCurrentUser && (msg.author.name && (
                                                        <span className="block text-xs font-semibold mb-0.5 text-gray-600 dark:text-gray-300">{msg.author.name}</span>
                                                    ))}
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

                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isCurrentUser ? 'text-primary-100' : 'text-gray-400'}`}>
                                                        <span>{formattedTime}</span>
                                                    </div>
                                                </div>

                                                {/* Hover Actions */}
                                                <button 
                                                    onClick={() => setReplyingToMessage(msg)}
                                                    className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 ${
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
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-1 sm:p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 relative z-20">
                        {replyingToMessage && (
                            <div className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-primary-500 shadow-sm animate-slide-up">
                                <div className="flex flex-col text-sm overflow-hidden">
                                    <span className="font-bold text-primary-600 dark:text-primary-400 text-xs mb-0.5">Replying to {replyingToMessage.author.name}</span>
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
                                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium border border-primary-100 dark:border-primary-800">
                                        <Paperclip size={12} />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => handleRemoveFile(file.name)} className="hover:text-error-status-500 ml-1"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="relative flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-primary-500/50 transition-shadow">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-xl transition-colors flex-shrink-0"
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
                                onClick={handleSend} 
                                className={`p-2 mr-1.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
                                    (!newMessage.trim() && selectedFiles.length === 0) || isSendingMessage
                                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                                disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSendingMessage}
                            >
                                {isSendingMessage ? <Spinner className="w-4 h-4" /> : <Send size={18} className={newMessage.trim() ? "ml-0.5" : ""} />}
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Press Enter to send, Shift + Enter for new line</p>
                        </div>
                    </div>
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 left-0 h-full w-1.5 cursor-col-resize group"
                    >
                         <div className="w-full h-full bg-transparent group-hover:bg-primary-500/50 transition-colors duration-200"></div>
                    </div>
                </>
            ) : (
                 <div className="flex flex-col items-center p-2 pt-6">
                     <MessageSquare size={24} />
                 </div>
            )}
        </div>
    );
};

export default Chat;
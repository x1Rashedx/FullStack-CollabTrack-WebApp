import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronsRight, MessageSquare, ChevronsLeft } from 'lucide-react';
import type { ChatMessage, User } from '../types';
import Avatar from './Avatar';

interface ChatProps {
    messages: ChatMessage[];
    currentUser: User;
    onSendMessage: (content: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    width: number;
    onResize: (width: number) => void;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 500;

const Chat: React.FC<ChatProps> = ({ messages, currentUser, onSendMessage, isCollapsed, onToggleCollapse, width, onResize }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
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

    return (
        <div 
            className={`bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} relative flex-shrink-0`}
            style={{ width: isCollapsed ? 64 : width }}
        >
            <button 
                onClick={onToggleCollapse} 
                className={`absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 h-16 w-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 z-30 ${isResizing ? '' : 'transition-all duration-300 ease-in-out'} focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm hover:shadow-md`}
                aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
            >
                {isCollapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
            </button>

            {!isCollapsed ? (
                <>
                    <div className="h-16 border-b dark:border-gray-700 flex items-center justify-start px-4 gap-2 flex-shrink-0 text-gray-600 dark:text-gray-300">
                        <MessageSquare size={24} />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Project Chat</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === currentUser.id ? 'flex-row-reverse' : ''}`}>
                                 <Avatar user={msg.author} className="h-8 w-8" />
                                 <div className={`p-3 rounded-lg max-w-xs ${msg.author.id === currentUser.id ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 opacity-70 ${msg.author.id === currentUser.id ? 'text-right' : 'text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString('en-US', { month: 'short', day: 'numeric',hour: '2-digit', minute: '2-digit' })}</p>
                                 </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t dark:border-gray-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="w-full pl-4 pr-10 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                            />
                            <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <div 
                        onMouseDown={handleMouseDown}
                        className="absolute top-0 left-0 h-full w-1.5 cursor-col-resize group"
                    >
                         <div className="w-full h-full bg-transparent group-hover:bg-brand-500/50 transition-colors duration-200"></div>
                    </div>
                </>
            ) : (
                 <div className="flex flex-col items-center p-2 pt-6 text-gray-600 dark:text-gray-300">
                     <MessageSquare size={24} />
                 </div>
            )}
        </div>
    );
};

export default Chat;

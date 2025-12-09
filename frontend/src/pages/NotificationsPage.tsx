import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock, User, Briefcase, Users, Trash2 } from 'lucide-react';
import { notificationService } from '@/services';
import { Avatar } from '@/components/common';
import type { User as UserType } from '@/types';

interface NotificationsPageProps {
    currentUser: UserType;
    allUsers: { [key: string]: UserType };
    notifications: any[];
    onNotificationsUpdate: (notifications: any[]) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
    currentUser, 
    allUsers,
    notifications: initialNotifications,
    onNotificationsUpdate
}) => {
    const [notifications, setNotifications] = useState<any[]>(initialNotifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setNotifications(initialNotifications);
    }, [initialNotifications]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markRead(notificationId);
            const updated = notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            );
            setNotifications(updated);
            onNotificationsUpdate(updated);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(n => notificationService.markRead(n.id))
            );
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
            onNotificationsUpdate(updated);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getNotificationIcon = (verb: string) => {
        const verbLower = (verb || '').toLowerCase();
        if (verbLower.includes('task')) return <Briefcase className="w-5 h-5" />;
        if (verbLower.includes('project')) return <Briefcase className="w-5 h-5" />;
        if (verbLower.includes('team') || verbLower.includes('join')) return <Users className="w-5 h-5" />;
        if (verbLower.includes('message')) return <Bell className="w-5 h-5" />;
        return <Bell className="w-5 h-5" />;
    };

    const getNotificationColor = (verb: string) => {
        const verbLower = (verb || '').toLowerCase();
        if (verbLower.includes('task')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        if (verbLower.includes('project')) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
        if (verbLower.includes('team') || verbLower.includes('join')) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        if (verbLower.includes('message')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    };

    const formatNotificationTitle = (notification: any) => {
        // Use verb to generate title if not in data
        const data = notification.data || {};
        if (data.title) return data.title;
        
        const actorName = notification.actor ? (notification.actor.name || 'Someone') : 'Someone';
        const verb = notification.verb || '';
        
        // Verb-specific titles
        if (verb === 'task_assigned') {
            return `You've been assigned to a task by ${actorName}`;
        }
        
        // Default: actor + verb
        return `${actorName} ${verb.replace(/_/g, ' ')}`;
    };

    const formatNotificationBody = (notification: any) => {
        const data = notification.data || {};
        
        // If message provided, use it
        if (data.message) return data.message;
        
        // For task_assigned, format nicely
        if (notification.verb === 'task_assigned') {
            const actorName = notification.actor ? (notification.actor.name || 'Someone') : 'Someone';
            const taskTitle = data.taskTitle || 'task';
            const projectName = data.projectName || '';
            
            if (projectName) {
                return `${actorName} assigned you to the task [ ${taskTitle} ] in ${projectName}`;
            }
            return `${actorName} assigned you to the task [ ${taskTitle} ]`;
        }
        
        // Fallback
        const parts = [];
        if (data.taskTitle) parts.push(data.taskTitle);
        if (data.projectName) parts.push(`in ${data.projectName}`);
        return parts.length > 0 ? parts.join(' ') : JSON.stringify(data);
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                            <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={isLoading}
                            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span>Mark all as read</span>
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            filter === 'unread'
                                ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                        <Bell className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No notifications</p>
                        <p className="text-sm">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotifications.map((notification) => {
                            const actor = notification.actor ? allUsers[notification.actor] : null;
                            
                            return (
                                <div
                                    key={notification.id}
                                    className={`group relative bg-white dark:bg-gray-800 rounded-lg border transition-all hover:shadow-md ${
                                        notification.read
                                            ? 'border-gray-200 dark:border-gray-700'
                                            : 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10'
                                    }`}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start space-x-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.verb)}`}>
                                                {getNotificationIcon(notification.verb)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {formatNotificationTitle(notification)}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                            {formatNotificationBody(notification)}
                                                        </p>
                                                        <div className="flex items-center space-x-3 mt-2">
                                                            {actor && (
                                                                <div className="flex items-center space-x-2">
                                                                    <Avatar user={actor} className="w-5 h-5" />
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {actor.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatTimestamp(notification.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mark as read button */}
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="ml-4 p-2 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Read indicator */}
                                    {!notification.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-brand-600 rounded-full"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

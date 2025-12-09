import React, { useEffect, useState } from 'react';
import type { User } from '@/types';
import { API_URL } from '@/utils/constants';

interface AvatarProps {
    user: User | null | undefined;
    className?: string;
    title?: string;
}

const getInitials = (name: string = '') => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
        return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ user, className = 'h-8 w-8', title }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user]);
    
    if (!user) {
        return <div className={`${className} rounded-full bg-gray-300 dark:bg-gray-600`} />;
    }
    
    const finalTitle = title || user.name || 'User';
    
    if (user.avatarUrl && !imageError) {
        
        if (user.avatarUrl.includes('avatars/')) {
            return (
                <img
                    src={`${API_URL}/database/media/${user.avatarUrl}`}
                    alt={user.name || 'User avatar'}
                    title={finalTitle}
                    className={`${className} rounded-full object-cover`}
                    onError={() => setImageError(true)}
                />
            );
        } else {
            return (
                <img
                    src={user.avatarUrl}
                    alt={user.name || 'User avatar'}
                    title={finalTitle}
                    className={`${className} rounded-full object-cover`}
                    onError={() => setImageError(true)}
                />
            );
        }
    }
    
    const initials = getInitials(user.name);
    
    // Simple hash function for consistent background colors based on user ID
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
           hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
        'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
    ];
    
    const colorIndex = Math.abs(hashCode(user.id)) % colors.length;
    const bgColor = colors[colorIndex];

    const sizeNumber = parseInt(className.match(/\d+/)?.[0] || '8', 10);

    return (
        <div
            title={finalTitle}
            className={`${className} rounded-full flex items-center justify-center text-white font-bold ${bgColor}`}
            style={{ fontSize: `${Math.max(8, sizeNumber / 2.2)}px` }}
        >
            {initials}
        </div>
    );
};

export default Avatar;

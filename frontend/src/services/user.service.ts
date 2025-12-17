/**
 * User Service
 */

import type { Project, Team, User } from '@/types';
import { apiRequest, getAuthToken } from './http';
import { API_BASE_URL } from '@/utils/constants';

export const userService = {
    updateUser: async (updatedUser: User, avatarFile?: File): Promise<User> => {
        if (avatarFile) {
            const formData = new FormData();
            formData.append('name', updatedUser.name);
            formData.append('email', updatedUser.email || '');
            formData.append('phone', updatedUser.phone || '');
            formData.append('gender', updatedUser.gender || '');
            formData.append('avatar', avatarFile);

            const token = getAuthToken();
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/users/${updatedUser.id}/`, {
                method: 'PUT',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
                throw new Error(errorData.detail || errorData.message || `API request failed with status ${response.status}`);
            }

            return response.json() as Promise<User>;
        }

        return apiRequest<User>(`/users/${updatedUser.id}/`, {
            method: 'PUT',
            body: JSON.stringify(updatedUser),
        });
    },

    fetchAllUserData: (): Promise<{
        users: { [key: string]: any };
        teams: { [key: string]: Team };
        projects: { [key: string]: Project };
        directMessages: { [key: string]: any };
        notifications: any[];
        folders?: { [key: string]: any };
    }> => {
        return apiRequest('/data/');
    },
};

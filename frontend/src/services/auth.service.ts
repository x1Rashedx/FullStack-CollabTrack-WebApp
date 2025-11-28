/**
 * Authentication Service
 */

import type { User } from '@/types';
import { apiRequest, getAuthToken, setAuthToken, clearAuthToken as clearTokenFromStorage } from './http';

export const authService = {
    register: async (userData: { name: string; email: string; password: string }): Promise<User> => {
        return apiRequest<User>('/users/register/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    login: async (email: string, password: string): Promise<void> => {
        const { access } = await apiRequest<{ access: string }>('/token/', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        setAuthToken(access);
    },

    logout: (): void => {
        clearTokenFromStorage();
    },

    getCurrentUser: (): Promise<User> => {
        return apiRequest<User>('/users/me/');
    },

    getAuthToken: (): string | null => {
        return getAuthToken();
    },
};

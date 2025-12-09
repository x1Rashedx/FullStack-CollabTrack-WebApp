import { apiRequest } from './http';

export const notificationService = {
    list: (params?: any) => {
        let url = '/notifications/';
        if (params && params.userId) url += `?user=${params.userId}`;
        return apiRequest(url);
    },
    markRead: (notificationId: string) => {
        return apiRequest(`/notifications/${notificationId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ read: true }),
        });
    }
};

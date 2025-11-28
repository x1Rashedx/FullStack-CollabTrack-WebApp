/**
 * Message Service
 */

import type { DirectMessage } from '@/types';
import { apiRequest, getAuthToken } from './http';

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const messageService = {
    sendDirectMessage: (receiverId: string, content: string): Promise<DirectMessage> => {
        return apiRequest<DirectMessage>('/messages/', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content }),
        });
    },

    sendChatMessage: async (projectId: string, content: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chatmessages/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            throw new Error("Failed to send message");
        }

        return response.json();
    },
};

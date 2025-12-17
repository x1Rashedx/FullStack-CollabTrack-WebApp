/**
 * Message Service
 */

import type { DirectMessage } from '@/types';
import { apiRequest, getAuthToken } from './http';

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const messageService = {
    sendDirectMessage: async (receiverId: string, content: string, attachments?: File[], parentId?: string): Promise<DirectMessage> => {
        const formData = new FormData();

        formData.append('receiverId', receiverId);
        formData.append('content', content);

        if (parentId) {
            formData.append('replyToId', parentId);
        }

        if (attachments) {
            attachments.forEach(file => {
                formData.append('files', file);
            });
        }

        const response = await fetch(`${API_BASE_URL}/messages/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to send message");
        }

        return response.json();
    },

    sendChatMessage: async (projectId: string, content: string, attachments?: File[], parentId?: string): Promise<any> => {
        const formData = new FormData();

        formData.append('content', content);

        if (parentId) {
            formData.append('replyToId', parentId);
        }

        if (attachments) {
            attachments.forEach(file => {
                formData.append('files', file);
            });
        }

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chatmessages/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to send message");
        }

        return response.json();
    },
};

/**
 * Task Service
 */

import type { Task, Column } from '@/types';
import { apiRequest, uploadFile } from './http';

export const taskService = {
    create: (projectId: string, columnId: string, taskData: Omit<Task, 'id'>): Promise<Task> => {
        const payload = {
            ...taskData,
            projectId,
            columnId,
            attachmentIds: taskData.attachments.map(a => a.id),
            assigneeIds: taskData.assignees.map(c => c.id)
        };

        return apiRequest<Task>('/tasks/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    update: (projectId: string, taskId: string, updatedTask: Task): Promise<Task> => {
        return apiRequest<Task>(`/tasks/${taskId}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...updatedTask, projectId }),
        });
    },

    move: (taskId: string, toColumnId: string, position: number): Promise<{ columns: { [key: string]: Column } }> => {
        return apiRequest<{ columns: { [key: string]: Column } }>(`/tasks/${taskId}/move/`, {
            method: 'PATCH',
            body: JSON.stringify({
                toColumnId,
                position
            }),
        });
    },

    delete: (taskId: string): Promise<void> => {
        return apiRequest<void>(`/tasks/${taskId}/`, {
            method: 'DELETE',
        });
    },

    addComment: (taskId: string, content: string): Promise<{ id: string; author: any; content: string; timestamp: string }> => {
        return apiRequest(`/tasks/${taskId}/comments/`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },

    uploadAttachment: (taskId: string, file: File): Promise<any> => {
        return uploadFile(`/tasks/${taskId}/attachments/`, file);
    },

    deleteAttachment: (attachmentId: string): Promise<void> => {
        return apiRequest<void>(`/attachments/${attachmentId}/`, {
            method: 'DELETE',
        });
    },
};

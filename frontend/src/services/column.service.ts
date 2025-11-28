/**
 * Column Service
 */

import type { Column, Project } from '@/types';
import { apiRequest } from './http';

export const columnService = {
    create: (projectId: string, title: string): Promise<Project> => {
        return apiRequest<Project>(`/columns/`, {
            method: 'POST',
            body: JSON.stringify({ title, projectId }),
        });
    },

    update: (columnId: string, newTitle: string): Promise<Column> => {
        return apiRequest<Column>(`/columns/${columnId}/`, {
            method: "PUT",
            body: JSON.stringify({ newTitle }),
        });
    },

    move: (projectId: string, newOrder: string[]): Promise<string[]> => {
        return apiRequest<string[]>(`/columns/move/`, {
            method: "PUT",
            body: JSON.stringify({ projectId, newOrder }),
        });
    },

    delete: (columnId: string): Promise<void> => {
        return apiRequest<void>(`/columns/${columnId}/`, {
            method: 'DELETE',
        });
    },
};

/**
 * Folder Service
 */

import type { Folder } from '@/types';
import { apiRequest } from './http';

export const folderService = {

    create: (name: string): Promise<Folder> => {
        return apiRequest<Folder>('/folders/', {
            method: 'POST',
            body: JSON.stringify({ name, projectIds: [] }),
        });
    },

    update: (folder: Folder): Promise<Folder> => {
        return apiRequest<Folder>(`/folders/${folder.id}/`, {
            method: 'PUT',
            body: JSON.stringify({ name: folder.name, projectIds: folder.projectIds }),
        });
    },

    delete: (folderId: string): Promise<void> => {
        return apiRequest<void>(`/folders/${folderId}/`, {
            method: 'DELETE',
        });
    },

    moveProject: (folderId: string, projectId: string, action: 'add' | 'remove'): Promise<Folder> => {
        return apiRequest<Folder>(`/folders/${folderId}/move-project/`, {
            method: 'POST',
            body: JSON.stringify({ projectId, action }),
        });
    },

    reorder: (folderIds: string[]): Promise<Folder[]> => {
        return apiRequest<Folder[]>('/folders/reorder/', {
            method: 'POST',
            body: JSON.stringify({ folderIds }),
        });
    },
};

/**
 * Team Service
 */

import type { Team } from '@/types';
import { apiRequest, getAuthToken } from './http';

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const teamService = {
    create: (name: string, description: string, icon: string): Promise<Team> => {
        return apiRequest<Team>('/teams/', {
            method: 'POST',
            body: JSON.stringify({ name, description, icon }),
        });
    },

    update: (updatedTeam: Team): Promise<Team> => {
        return apiRequest<Team>(`/teams/${updatedTeam.id}/`, {
            method: 'PUT',
            body: JSON.stringify(updatedTeam),
        });
    },

    delete: (teamId: string): Promise<void> => {
        return apiRequest<void>(`/teams/${teamId}/`, {
            method: 'DELETE',
        });
    },

    invite: (teamId: string, email: string): Promise<Team> => {
        return apiRequest<Team>(`/teams/${teamId}/invite/`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    requestToJoin: (teamId: string): Promise<Team> => {
        return apiRequest<Team>(`/teams/${teamId}/join/`, {
            method: 'POST',
        });
    },

    manageJoinRequest: (teamId: string, userId: string, action: 'approve' | 'deny'): Promise<{ message: string; team: Team }> => {
        return apiRequest<{ message: string; team: Team }>(`/teams/${teamId}/requests/${userId}/`, {
            method: 'POST',
            body: JSON.stringify({ action }),
        });
    },
};

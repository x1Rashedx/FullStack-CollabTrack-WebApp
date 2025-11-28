/**
 * Project Service
 */

import type { Project, Team } from '@/types';
import { apiRequest } from './http';

export const projectService = {

    create: (name: string, description: string, teamId: string): Promise<{ newProject: Project, updatedTeam: Team }> => {
        return apiRequest<{ newProject: Project, updatedTeam: Team }>('/projects/', {
            method: 'POST',
            body: JSON.stringify({ name, description, team: teamId }),
        });
    },

    update: (updatedProject: Project): Promise<Project> => {
        return apiRequest<Project>(`/projects/${updatedProject.id}/`, {
            method: 'PUT',
            body: JSON.stringify({ ...updatedProject, team: updatedProject.teamId }),
        });
    },

    delete: (projectId: string): Promise<void> => {
        return apiRequest<void>(`/projects/${projectId}/`, {
            method: 'DELETE',
        });
    },
};

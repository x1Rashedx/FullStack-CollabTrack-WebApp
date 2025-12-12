import { apiRequest } from './http';
import { Subtask } from '@/types';

export const subtaskService = {

    /**
     * Create a new subtask for a task
     */
    create: (taskId: string, title: string, completed: boolean = false): Promise<void> => {
        return apiRequest<void>(`/tasks/${taskId}/subtasks/`, {
            method: 'POST',
            body: JSON.stringify({ title, completed })
        });
    },

    /**
     * Update a subtask
     */
    update: (taskId: string, subtaskId: string, data: Partial<Subtask>): Promise<void> => {
        return apiRequest<void>(`/tasks/${taskId}/subtasks/${subtaskId}/`, {
            method: 'PATCH', 
            body: JSON.stringify(data)
        });
    },

    /**
     * Delete a subtask
     */
    delete: (taskId: string, subtaskId: string): Promise<void> => {
        return apiRequest<void>(`/tasks/${taskId}/subtasks/${subtaskId}/`, { 
            method: 'DELETE' 
        });
    },

    /**
     * Toggle subtask completion status
     */
    toggleComplete: (taskId: string, subtaskId: string, completed: boolean): Promise<Subtask> => {
        return apiRequest<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ completed })
        });
    }
};

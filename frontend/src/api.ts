// This file contains the API service layer.
// These functions are now set up to make real network requests to a backend.
// The Django backend should expose endpoints that match these calls.

import type { Project, Team, Column, User, Task, DirectMessage } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api"; // API base URL

let authToken: string | null = null;

export const getAuthToken = (): string | null => {
    if (authToken) return authToken;
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            authToken = token;
            return token;
        }
    } catch (e) {
        console.error("Could not read auth token from localStorage", e);
    }
    return null;
};

export const setAuthToken = (token: string): void => {
    try {
        localStorage.setItem('authToken', token);
        authToken = token;
    } catch (e) {
        console.error("Could not set auth token in localStorage", e);
    }
};

export const clearAuthToken = (): void => {
    try {
        localStorage.removeItem('authToken');
        authToken = null;
    } catch (e) {
        console.error("Could not clear auth token from localStorage", e);
    }
};

export let fetchVersion = 0;

// A helper function to handle API requests and responses
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        fetchVersion++;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
        
        if (response.status === 401) {
            // Unauthorized, likely an expired token
            clearAuthToken();
            // Reload the page to force user to the login screen
            window.location.reload();
            throw new Error("Session expired. Please log in again.");
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.detail || errorData.message || `API request failed with status ${response.status}`);
        }
        
        if (response.status === 204) {
            return null as T;
        }


        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// --- Authentication ---
export const registerUser = async (userData: { name: string; email: string; password: string }): Promise<User> => {
    // Calls the backend endpoint to create a new user
    return apiRequest<User>('/users/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

export const login = async (email, password) => {
    const { access } = await apiRequest<{ access: string }>('/token/', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    setAuthToken(access);
};

export const logout = () => {
    // In a stateless JWT setup, logout is client-side.
    // If using refresh tokens, you'd call a '/token/blacklist/' endpoint here.
    clearAuthToken();
};

export const fetchCurrentUser = () => {
    return apiRequest<User>('/users/me/');
};

export const updateUser = async (updatedUser: User, avatarFile?: File) => {
    // Note: The backend should handle updating related models.
    if (avatarFile) {
        // Handle file upload with FormData
        const formData = new FormData();
        formData.append('name', updatedUser.name);
        formData.append('email', updatedUser.email || '');
        formData.append('phone', updatedUser.phone || '');
        formData.append('gender', updatedUser.gender || '');
        formData.append('avatar', avatarFile);

        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/users/${updatedUser.id}/`, {
            method: 'PUT',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
            throw new Error(errorData.detail || errorData.message || `API request failed with status ${response.status}`);
        }

        return response.json() as Promise<User>;
    }
    
    return apiRequest<User>(`/users/${updatedUser.id}/`, {
        method: 'PUT',
        body: JSON.stringify(updatedUser),
    });
};

// --- Data Fetching & Mutations ---
export const fetchAllData = () => {
    return apiRequest<{
        projects: { [key: string]: Project };
        teams: { [key: string]: Team };
        directMessages: { [key: string]: DirectMessage };
        users: { [key: string]: User };
    }>('/data/');
};

export const createProject = (name: string, description: string, teamId: string) => {
    return apiRequest<{ newProject: Project, updatedTeam: Team }>('/projects/', {
        method: 'POST',
        body: JSON.stringify({ name, description, team: teamId }),
    });
};

export const updateProject = (updatedProject: Project) => {
    return apiRequest<Project>(`/projects/${updatedProject.id}/`, {
        method: 'PUT',
        body: JSON.stringify({ ...updatedProject,  team: updatedProject.teamId}),
    });
};

export const deleteProject = (projectId: string) => {

};

export const createColumn = (projectId: string, title: string) => {
    return apiRequest<Project>(`/columns/`, {
        method: 'POST',
        body: JSON.stringify({ title, projectId}),
    });
};

export const updateColumn = async (columnId: string, newTitle: string) => {
    return apiRequest<Column>(`/columns/${columnId}/`, {
        method: "PUT",
        body: JSON.stringify({ newTitle }),
    });
};

export const moveColumn = async (projectId: string, newOrder: string[]) => {
    return apiRequest<string[]>(`/columns/move/`, {
        method: "PUT",
        body: JSON.stringify({ projectId, newOrder }),
    });
};

export const deleteColumn = (columnId: string) => {
    return apiRequest<void>(`/columns/${columnId}/`, {
        method: 'DELETE',
    });
};

// --- Task APIs ---

// Create a new task
export const createTask = async (projectId: string, columnId: string, taskData: Omit<Task, 'id'>) => {
    const payload = {
        ...taskData,
        projectId: projectId,
        columnId: columnId, // tells backend which column to insert task into
        attachmentIds: taskData.attachments.map(a => a.id),
        assigneeIds: taskData.assignees.map(c => c.id)
    };

    return apiRequest<Task>('/tasks/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

// Update an existing task
export const updateTask = async (projectId: string, taskId: string, updatedTask: Task) => {
    return apiRequest<Task>(`/tasks/${taskId}/`, {
        method: 'PUT',
        body: JSON.stringify({ ...updatedTask, projectId }),
    });
};

// Move/reorder a task (drag-and-drop)
export const moveTask = async (taskId: string, toColumnId: string, position: number) => {
    return apiRequest<{ columns: {[key: string]: Column} }>(`/tasks/${taskId}/move/`, {
        method: 'PUT',
        body: JSON.stringify({
            toColumnId: toColumnId,
            position: position
        }),
    });
};

// Delete a task
export const deleteTask = async (taskId: string) => {
    return apiRequest<void>(`/tasks/${taskId}/`, {
        method: 'DELETE',
    });
};

// Create a comment for a task
export const createTaskComment = async (taskId: string, content: string) => {
    return apiRequest< { id: string, author: any, content: string, timestamp: string }>(`/tasks/${taskId}/comments/`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
};

// Upload an attachment for a task (multipart/form-data). Accepts a single File.
export const uploadTaskAttachment = async (taskId: string, file: File) => {
    const formData = new FormData();
    // backend accepts `files` (array) or single `file`
    formData.append('files', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/attachments/`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.detail || errorData.message || 'Attachment upload failed');
    }

    return response.json();
};

// Delete an attachment
export const deleteAttachment = async (attachmentId: string) => {
    return apiRequest<void>(`/attachments/${attachmentId}/`, {
        method: 'DELETE',
    });
};



export const createTeam = (name: string, description: string, icon: string) => {
    return apiRequest<Team>('/teams/', {
        method: 'POST',
        body: JSON.stringify({ name, description, icon }),
    });
};

export const updateTeam = (updatedTeam: Team) => {
    return apiRequest<Team>(`/teams/${updatedTeam.id}/`, {
        method: 'PUT',
        body: JSON.stringify(updatedTeam),
    });
};

export const deleteTeam = (teamId: string) => {

};

export const sendDirectMessage = (receiverId: string, content: string) => {
    return apiRequest<DirectMessage>('/messages/', {
        method: 'POST',
        body: JSON.stringify({ receiverId, content }),
    });
};

export const sendChatMessage = async (projectId: string, content: string) => {
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
};


export const inviteMember = (teamId: string, email: string) => {
    return apiRequest<Team>(`/teams/${teamId}/invite/`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

export const requestToJoinTeam = (teamId: string) => {
    return apiRequest<Team>(`/teams/${teamId}/join/`, {
        method: 'POST',
    });
};

export const manageJoinRequest = (teamId: string, userId: string, action: 'approve' | 'deny') => {
    return apiRequest<{ message: string, team: Team }>(`/teams/${teamId}/requests/${userId}/`, {
        method: 'POST',
        body: JSON.stringify({ action }),
    });
};

/**
 * HTTP Client - Base HTTP utility for all API calls
 */

import { add } from "@dnd-kit/utilities";

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

let authToken: string | null = null;

export let fetchVersion = 0;

export const getAuthToken = (): string | null => {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            if (!authToken) {
                authToken = token;
                return token;
            }
            
            if (token === authToken) {
                return token;
            }
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

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        
        if (response.status === 401 && endpoint !== '/push-tokens/' && endpoint !== '/token/') {
            window.location.reload();
            throw new Error("Session expired. Please log in again.");
        }

        if (!response.ok && endpoint === '/users/register/') {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }))
            const messages = errorData.email?.join(" ") || errorData.password?.join(" ") || "Unknown error"
            const capitalized = messages.charAt(0).toUpperCase() + messages.slice(1);
            throw new Error(capitalized)
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

export async function uploadFile(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('files', file);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.detail || errorData.message || 'Upload failed');
    }

    return response.json();
}
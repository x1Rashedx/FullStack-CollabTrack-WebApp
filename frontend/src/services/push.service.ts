// Minimal push service stub: frontend should obtain FCM token and POST to /api/push-tokens/
import { apiRequest } from './http';

export const pushService = {
    registerToken: (token: string, platform: string = 'web') => {
        return apiRequest('/push-tokens/', {
            method: 'POST',
            body: JSON.stringify({ token, platform }),
        });
    },
    unregisterToken: (token: string) => {
        return apiRequest('/push-tokens/unregister/', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }
};

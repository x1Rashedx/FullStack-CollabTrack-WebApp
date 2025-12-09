import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { pushService } from './push.service';

let _messaging: any = null;

function _initFirebase(): any {
    if (_messaging) return _messaging;
    // Expect firebase config as JSON string in Vite env var VITE_FIREBASE_CONFIG
    try {
        const raw = import.meta.env.VITE_FIREBASE_CONFIG as string;
        if (!raw) return null;
        let config = null;
        try {
            config = JSON.parse(raw);
        } catch (e) {
            // If not JSON, assume it's a path or absent
            console.warn('VITE_FIREBASE_CONFIG is not valid JSON');
            return null;
        }

        if (!getApps().length) {
            initializeApp(config);
        }
        const messaging = getMessaging();
        _messaging = messaging;
        return messaging;
    } catch (e) {
        console.warn('Failed to init firebase messaging', e);
        return null;
    }
}

export async function registerForPush(): Promise<string | null> {
    const messaging = _initFirebase();
    if (!messaging) return null;

    // Ask permission
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

        // Register the service worker explicitly so it is served from '/firebase-messaging-sw.js'
        let swRegistration: ServiceWorkerRegistration | null = null;
        try {
            swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (err) {
            console.warn('Service worker registration failed', err);
        }

        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
        if (token) {
            await pushService.registerToken(token, 'web');
            return token;
        }
    } catch (e) {
        console.error('Push registration failed', e);
    }
    return null;
}

export async function unregisterPush(token: string): Promise<boolean> {
    const messaging = _initFirebase();
    try {
        if (messaging && token) {
            await deleteToken(messaging);
        }
    } catch (e) {
        console.warn('Failed to delete local token', e);
    }
    try {
        await pushService.unregisterToken(token);
        return true;
    } catch (e) {
        return false;
    }
}

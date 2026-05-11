import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../lib/firebase';
import notificationService from './notification.service';

// The VAPID key from Firebase Console → Project Settings → Cloud Messaging
// Replace this with your actual Web Push certificate key pair (VAPID key)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

/**
 * Request notification permission and get an FCM token.
 * Registers the token with the backend so the server can send push messages.
 * Returns the token string, or null if permission was denied.
 */
export async function requestFcmToken(): Promise<string | null> {
    try {
        if (typeof Notification === 'undefined') {
            return null;
        }
        // Avoid repeated requestPermission() when the user has blocked prompts (Chrome logs warnings).
        if (Notification.permission === 'denied') {
            return null;
        }
        const permission =
            Notification.permission === 'granted'
                ? 'granted'
                : await Notification.requestPermission();
        if (permission !== 'granted') {
            return null;
        }

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: await registerServiceWorker(),
        });

        if (token) {
            // Register token with our backend (NOTIF-103)
            await notificationService.registerDeviceToken(token, 'fcm');
            console.info('[FCM] Token registered with backend.');
        }

        return token || null;
    } catch (error) {
        console.warn('[FCM] Failed to get token:', error);
        return null;
    }
}

/**
 * Register the Firebase Messaging service worker.
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/' },
        );
        return registration;
    }
    throw new Error('Service workers are not supported in this browser.');
}

/**
 * Listen for foreground FCM messages (app is open).
 * Background messages are handled by the service worker.
 *
 * @param callback Called with the notification payload when a message arrives.
 */
export function onForegroundMessage(
    callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void,
) {
    return onMessage(messaging, (payload) => {
        callback(payload as Parameters<typeof callback>[0]);
    });
}

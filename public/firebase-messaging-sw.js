// firebase-messaging-sw.js
// Service worker for Firebase Cloud Messaging (background push notifications)
// This file MUST be served from the root (/firebase-messaging-sw.js).
// Vite serves files in the /public folder at the root automatically.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyCLY4MEq7SLuL3HfS-b3f-m-GHv0Zf6p8c',
    authDomain: 'notification-bf9f1.firebaseapp.com',
    projectId: 'notification-bf9f1',
    storageBucket: 'notification-bf9f1.firebasestorage.app',
    messagingSenderId: '950192175034',
    appId: '1:950192175034:web:f9fd02cc1dd26142fecf83',
});

const messaging = firebase.messaging();

// Handle background push messages (app tab not open / tab in background)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const { title = 'Arena Chain', body = '' } = payload.notification || {};
    const link = payload.data?.link || '/';

    self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png', // replace with your actual icon path
        badge: '/badge-72.png',
        data: { link },
        // Clicking the notification opens / focuses the relevant page
        requireInteraction: false,
    });
});

// When user clicks the notification → open the app at the linked page
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = event.notification.data?.link || '/';
    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Try to focus an existing tab first
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(link);
                        return client.focus();
                    }
                }
                // Otherwise open a new tab
                if (clients.openWindow) return clients.openWindow(link);
            }),
    );
});

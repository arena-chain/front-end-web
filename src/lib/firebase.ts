import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: 'AIzaSyCLY4MEq7SLuL3HfS-b3f-m-GHv0Zf6p8c',
    authDomain: 'notification-bf9f1.firebaseapp.com',
    projectId: 'notification-bf9f1',
    storageBucket: 'notification-bf9f1.firebasestorage.app',
    messagingSenderId: '950192175034',
    appId: '1:950192175034:web:f9fd02cc1dd26142fecf83',
};

// Initialize Firebase app (singleton)
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
// messaging() is only available in browser environments (not SSR)
export const messaging = getMessaging(firebaseApp);

export { firebaseConfig };

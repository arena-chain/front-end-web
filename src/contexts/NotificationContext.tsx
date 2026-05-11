import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import notificationService from '../services/notification.service';
import type { AppNotification } from '../services/notification.service';
import { requestFcmToken, onForegroundMessage } from '../services/fcm.service';
import { getSocketIoOrigin } from '../lib/apiBase';
import { toast } from 'sonner';

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteOne: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef<Socket | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.isRead).length);
        } catch {
            // not authenticated yet — silently skip
        }
    }, []);

    useEffect(() => {
        load();

        const token = localStorage.getItem('token');
        if (!token) return;

        const socket: Socket = io(`${getSocketIoOrigin()}/notifications`, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('notification:new', (notif: AppNotification) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadCount((c) => c + 1);

            // Show real-time toast
            toast(notif.title, {
                description: notif.message,
                action: notif.link ? {
                    label: 'Voir',
                    onClick: () => window.location.href = notif.link!
                } : undefined
            });
        });

        // Setup FCM (Push Notifications)
        const setupFcm = async () => {
            try {
                await requestFcmToken();
                onForegroundMessage((payload) => {
                    console.log('[FCM] Foreground message:', payload);
                    if (payload.notification) {
                        toast(payload.notification.title || 'New Notification', {
                            description: payload.notification.body,
                            action: payload.data?.link ? {
                                label: 'View',
                                onClick: () => window.location.href = payload.data!.link!
                            } : undefined
                        });
                    }
                    // Refresh unread count or list if needed
                    load();
                });
            } catch (err) {
                console.warn('[FCM] Error setting up FCM:', err);
            }
        };

        setupFcm();

        return () => {
            socket.disconnect();
        };
    }, [load]);

    const markRead = useCallback(async (id: string) => {
        await notificationService.markRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await notificationService.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    const deleteOne = useCallback(async (id: string) => {
        await notificationService.deleteOne(id);
        setNotifications((prev) => {
            const removed = prev.find((n) => n._id === id);
            if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
            return prev.filter((n) => n._id !== id);
        });
    }, []);

    const clearAll = useCallback(async () => {
        await notificationService.clearAll();
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markRead, markAllRead, deleteOne, clearAll }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
}

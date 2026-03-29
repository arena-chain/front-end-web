import { io, type Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const fallbackIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

let rtcConfigPromise: Promise<RTCIceServer[]> | null = null;

export async function getIceServers(): Promise<RTCIceServer[]> {
    if (!rtcConfigPromise) {
        rtcConfigPromise = fetch(`${API_URL}/stream/rtc-config`, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    return fallbackIceServers;
                }

                const data = await response.json() as { iceServers?: RTCIceServer[] };
                return data.iceServers?.length ? data.iceServers : fallbackIceServers;
            })
            .catch(() => fallbackIceServers);
    }

    return rtcConfigPromise;
}

export function createLiveSocket(): Socket {
    const token = localStorage.getItem('token');

    return io(API_URL, {
        auth: {
            token,
        },
        transports: ['websocket', 'polling'],
    });
}

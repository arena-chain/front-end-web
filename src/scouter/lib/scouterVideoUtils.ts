import type { VideoRecord } from '../../services/video.service';

export function sortEpicHighlights(videos: VideoRecord[]): VideoRecord[] {
    return [...videos].sort((a, b) => {
        const va = a.views ?? 0;
        const vb = b.views ?? 0;
        if (vb !== va) return vb - va;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function uploaderNickname(u: VideoRecord['uploader']): string {
    if (typeof u === 'object' && u) {
        return u.nickname ?? u.username ?? u.email ?? 'Player';
    }
    return 'Player';
}

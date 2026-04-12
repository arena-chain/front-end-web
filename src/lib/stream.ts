export interface StreamEmbed {
    type: 'iframe' | 'video' | 'link';
    src: string;
}

function isDirectVideoUrl(url: URL) {
    return url.pathname.endsWith('.m3u8') || url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm');
}

function toYouTubeEmbed(url: URL) {
    if (url.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`;
    }

    const liveParts = url.pathname.split('/').filter(Boolean);
    if (liveParts[0] === 'live' && liveParts[1]) {
        return `https://www.youtube.com/embed/${liveParts[1]}`;
    }

    const videoId = url.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function toTwitchEmbed(url: URL) {
    const parts = url.pathname.split('/').filter(Boolean);
    const channel = parts[0];

    if (!channel) {
        return null;
    }

    return `https://player.twitch.tv/?channel=${channel}&parent=localhost&parent=127.0.0.1`;
}

export function getStreamEmbed(urlValue?: string | null): StreamEmbed | null {
    if (!urlValue) {
        return null;
    }

    try {
        const url = new URL(urlValue);

        if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
            const src = toYouTubeEmbed(url);
            return src ? { type: 'iframe', src } : null;
        }

        if (url.hostname.includes('twitch.tv')) {
            const src = toTwitchEmbed(url);
            return src ? { type: 'iframe', src } : null;
        }

        if (isDirectVideoUrl(url)) {
            return { type: 'video', src: url.toString() };
        }

        return { type: 'link', src: url.toString() };
    } catch {
        return null;
    }
}

export function pickPreferredStreamUrl(...values: Array<string | null | undefined>) {
    const candidates = values.map((value) => value?.trim()).filter(Boolean) as string[];

    for (const candidate of candidates) {
        try {
            const url = new URL(candidate);
            if (isDirectVideoUrl(url)) {
                return candidate;
            }
        } catch {
            continue;
        }
    }

    return candidates[0] || null;
}

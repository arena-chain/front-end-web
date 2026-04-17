/** SVG data URLs — no external host (avoids via.placeholder.com DNS / blocking). */
export function placeholderImage(width: number, height: number, label = 'No image'): string {
    const fs = Math.max(11, Math.min(width, height) / 12);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect fill="#1a1a1a" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="system-ui,sans-serif" font-size="${fs}">${escapeXml(label)}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

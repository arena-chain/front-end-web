import { Video, Film, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ScouterHighlights() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Video className="w-8 h-8 text-primary" />
                    Videos & highlights
                </h1>
                <p className="text-white/50 text-sm mt-1">Past games, performance reels, and highlight clips. Link your video source or embed playlists.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                        <Film className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Full match VODs</h3>
                    <p className="text-sm text-white/50 mb-4">Replay old games by season, round, or player. Integrate with your streaming or storage.</p>
                    <span className="text-xs font-bold text-primary/80">Coming soon</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <Youtube className="w-8 h-8 text-white/60" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Highlight clips</h3>
                    <p className="text-sm text-white/50 mb-4">Curated clips and top plays. Connect YouTube or your CDN.</p>
                    <span className="text-xs font-bold text-white/50">Coming soon</span>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <p className="text-white/60 text-sm">
                    As a scouter you can consult player profiles and match history from the <Link to="/scouter/players" className="text-primary hover:text-primary font-bold">Players</Link> page.
                    Videos and highlights can be added here once your backend or external services (e.g. Twitch, YouTube) are integrated.
                </p>
            </div>
        </div>
    );
}

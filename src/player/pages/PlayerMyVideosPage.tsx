import { Link } from 'react-router-dom';
import { Film, Sparkles } from 'lucide-react';
import { MyVideosManager } from '../components/MyVideosManager';

export default function PlayerMyVideosPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/15 border border-primary/25">
                        <Film className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">
                            Public
                        </p>
                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic">
                            My videos
                        </h1>
                        <p className="text-sm text-white/50 mt-2 max-w-xl leading-relaxed">
                            Bibliothèque personnelle : modifiez titre et description, réglez la visibilité{' '}
                            <strong className="text-white/70">chaîne</strong> (public = visible sur votre page chaîne) et ouvrez{' '}
                            <Link to="/player/highlights" className="text-primary hover:underline inline-flex items-center gap-1">
                                <Sparkles size={14} className="inline" /> Highlights
                            </Link>{' '}
                            pour décrire ou supprimer des clips.
                        </p>
                    </div>
                </div>
            </div>

            <MyVideosManager />
        </div>
    );
}

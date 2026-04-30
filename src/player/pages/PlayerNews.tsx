import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Newspaper, Globe,
    Calendar, ExternalLink,
    Zap, Trophy, Shield
} from 'lucide-react';
import { newsService } from '../../services/newsService';
import type { NewsItem } from '../../models/news.model';
import { cn } from '../../lib/utils';

export default function PlayerNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<{ game?: string; category?: string }>({});

    useEffect(() => {
        fetchNews();
    }, [filter]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const response = await newsService.getNews({
                game: filter.game,
                category: filter.category,
                limit: 12
            });
            setNews(response.items);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'patch_notes', label: 'Patch Notes', icon: <Zap size={14} /> },
        { id: 'esports', label: 'Esports', icon: <Trophy size={14} /> },
        { id: 'community', label: 'Community', icon: <Globe size={14} /> },
        { id: 'general', label: 'General', icon: <Newspaper size={14} /> },
    ];

    const games = [
        { id: 'valorant', label: 'Valorant' },
        { id: 'lol', label: 'League of Legends' },
        { id: 'cs2', label: 'CS2' },
        { id: 'fortnite', label: 'Fortnite' },
    ];

    return (
        <div className="flex flex-col gap-6 h-full animate-fade-in-up overflow-hidden pr-2">

            {/* ── Header Section ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/10 border border-green-500/20">
                            <Newspaper size={18} className="text-green-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/70">Intelligence Hub</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                        Arena <span className="text-green-400">News</span>
                    </h1>
                    <p className="text-sm text-white/40 font-medium mt-1">Get the latest patch notes, meta shifts, and esports coverage.</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/10">
                        <button
                            onClick={() => setFilter({ ...filter, game: undefined })}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                !filter.game ? "bg-green-400 text-black" : "text-white/40 hover:text-white"
                            )}
                        >
                            All
                        </button>
                        {games.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setFilter({ ...filter, game: g.id })}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter.game === g.id ? "bg-green-400 text-black" : "text-white/40 hover:text-white"
                                )}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Featured & Grid ────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-12">

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setFilter({ ...filter, category: undefined })}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                            !filter.category
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white"
                        )}
                    >
                        All Categories
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter({ ...filter, category: cat.id })}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                                filter.category === cat.id
                                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                                    : "bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white"
                            )}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-white/[0.03] border border-white/5" />
                        ))}
                    </div>
                ) : news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((item) => (
                            <NewsCard key={item._id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 mb-4">
                            <Shield size={32} className="text-white/20" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">No transmissions found</h3>
                        <p className="text-sm text-white/40 max-w-xs mt-2">Adjust your frequency (filters) to scan for other signals.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function NewsCard({ item }: { item: NewsItem }) {
    const navigate = useNavigate();
    const isPatch = item.category === 'patch_notes';

    return (
        <div
            onClick={() => navigate(`/player/news/${item._id}`)}
            className="group relative flex flex-col rounded-3xl overflow-hidden bg-[#0d0d0d] border border-white/5 hover:border-green-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            style={{ boxShadow: '0 4px 24px -1px rgba(0,0,0,0.4)' }}
        >
            {/* Image / Header */}
            <div className="relative h-40 shrink-0 overflow-hidden bg-white/5">
                {item.coverImageUrl && !item.coverImageUrl.startsWith('data:image') ? (
                    <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] to-black opacity-40">
                        <span className="text-4xl">{item.game === 'valorant' ? '🎯' : item.game === 'lol' ? '⚔️' : item.game === 'cs2' ? '🔫' : '🎮'}</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg",
                        isPatch ? "bg-amber-400 text-black" : "bg-green-500 text-black"
                    )}>
                        {item.category.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white/80 border border-white/5">
                        {item.game}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    <Calendar size={10} />
                    {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{item.sourceName}</span>
                </div>

                <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight line-clamp-2 group-hover:text-green-400 transition-colors">
                    {item.title}
                </h3>

                <p className="text-xs text-white/40 leading-relaxed line-clamp-3">
                    {item.summary}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-green-400 transition-colors">
                        View Details <Zap size={10} className="fill-current" />
                    </span>
                    <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                        title="Original Source"
                    >
                        <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Gloss overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-transparent to-white/[0.02] transform translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
        </div>
    );
}

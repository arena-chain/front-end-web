import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/core';
import { Calendar, ArrowLeft, ExternalLink, Globe, Shield } from 'lucide-react';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { newsService } from '../../services/newsService';
import type { NewsItem } from '../../models/news.model';
import { cn } from '../../lib/utils';

export default function NewsArticlePage() {
    const { id } = useParams();
    const { pathname } = useLocation();
    const [article, setArticle] = useState<NewsItem | null>(null);
    const [loading, setLoading] = useState(true);
    const isPlayerView = pathname.startsWith('/player');

    useEffect(() => {
        if (id) {
            fetchArticle(id);
        }
        window.scrollTo(0, 0);
    }, [id]);

    const fetchArticle = async (articleId: string) => {
        setLoading(true);
        try {
            const data = await newsService.getNewsItem(articleId);
            setArticle(data);
        } catch (error) {
            console.error('Failed to fetch article:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={cn("min-h-screen bg-background text-white flex flex-col", !isPlayerView && "pt-0")}>
                {!isPlayerView && <TopNavbar />}
                <div className="grow flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-primary font-black uppercase tracking-widest text-xs">Decrypting Signal...</p>
                    </div>
                </div>
                {!isPlayerView && <BottomNavbar />}
            </div>
        );
    }

    if (!article) {
        return (
            <div className={cn("min-h-screen bg-background text-white flex flex-col", !isPlayerView && "pt-0")}>
                {!isPlayerView && <TopNavbar />}
                <div className="grow flex items-center justify-center">
                    <div className="text-center p-12 bg-white/5 rounded-[3rem] border border-dashed border-white/10 max-w-lg">
                        <Shield className="w-16 h-16 text-white/10 mx-auto mb-6" />
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Transmission Lost</h1>
                        <p className="text-white/40 mb-8 font-medium">This article has been archived or the signal has been corrupted.</p>
                        <Link to={isPlayerView ? "/player/news" : "/news"}>
                            <Button className="bg-primary text-black hover:bg-primary/90">Back to News</Button>
                        </Link>
                    </div>
                </div>
                {!isPlayerView && <BottomNavbar />}
            </div>
        );
    }

    return (
        <div className={cn("min-h-screen bg-background text-white flex flex-col selection:bg-primary selection:text-black", !isPlayerView && "pt-0")}>
            {!isPlayerView && <TopNavbar />}

            <main className={cn("grow pb-24", isPlayerView ? "pt-4" : "pt-32")}>
                <div className="container mx-auto px-6 max-w-4xl">
                    <button
                        onClick={() => window.history.back()}
                        className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-primary mb-12 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Intelligence Hub
                    </button>

                    <div className="relative h-[400px] md:h-[550px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl border border-white/5 group">
                        {article.coverImageUrl && !article.coverImageUrl.startsWith('data:image') ? (
                            <img
                                src={article.coverImageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#0a1a0a] to-black flex items-center justify-center text-8xl opacity-40">
                                {article.game === 'valorant' ? '🎯' : article.game === 'lol' ? '⚔️' : article.game === 'cs2' ? '🔫' : '🎮'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 md:p-14 w-full">
                            <div className="flex gap-2 mb-6">
                                <span className="px-4 py-1.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                                    {article.category.replace('_', ' ')}
                                </span>
                                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/5">
                                    {article.game}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none drop-shadow-2xl">
                                {article.title}
                            </h1>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-widest text-white/30 mb-12 border-b border-white/5 pb-8">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <span>{article.sourceName}</span>
                                </div>
                            </div>

                            <div className="prose prose-invert prose-lg max-w-none prose-p:text-white/60 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-a:text-primary">
                                {article.content ? (
                                    article.content.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-8">
                                            {paragraph}
                                        </p>
                                    ))
                                ) : (
                                    <p className="italic text-white/20">No additional content available for this transmission.</p>
                                )}
                            </div>

                            <div className="mt-16 pt-12 border-t border-white/5">
                                <a
                                    href={article.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest transition-all group"
                                >
                                    View Original Source <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">Article Metadata</h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Source</div>
                                        <div className="text-sm font-bold text-white/80">{article.sourceName}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Language</div>
                                        <div className="text-sm font-bold text-white/80 uppercase">{article.language}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Status</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-bold text-white/80 uppercase">Verified Transmission</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <BottomNavbar />
        </div>
    );
}

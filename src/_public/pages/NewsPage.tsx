import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/core';
import { Calendar, Clock, ArrowRight, Globe, Search } from 'lucide-react';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { newsService } from '../../services/newsService';
import type { NewsItem } from '../../models/news.model';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await newsService.getNews({ limit: 50 });
            setNews(res.items);
        } catch (error) {
            console.error('Failed to fetch news:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredNews = news.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col">
            <TopNavbar />

            {/* Hero Header */}
            <div className="pt-40 pb-20 relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 animate-fade-in">
                        Intelligence Hub
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10">
                        Stay ahead of the game with real-time transmissions from the global gaming nexus.
                    </p>

                    {/* Search & Filter */}
                    <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search the nexus..."
                                className="w-full bg-transparent border-none py-3 pl-12 pr-4 focus:ring-0 text-white placeholder:text-text-muted"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 p-2">
                             {['all', 'patch_notes', 'esports', 'community'].map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                                        categoryFilter === cat
                                            ? "bg-primary text-black shadow-[0_0_15px_rgba(59,245,39,0.3)]"
                                            : "hover:bg-white/5 text-text-muted"
                                    )}
                                 >
                                    {cat.replace('_', ' ')}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-grow pb-24">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="space-y-8">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5" />
                            ))
                        ) : filteredNews.length === 0 ? (
                            <div className="py-20 text-center text-text-muted space-y-4">
                                <Search className="w-16 h-16 mx-auto opacity-10" />
                                <p className="text-xl">No transmissions found on this frequency.</p>
                                <Button onClick={() => {setSearchQuery(''); setCategoryFilter('all');}}>Clear Filters</Button>
                            </div>
                        ) : (
                            filteredNews.map((article) => (
                                <Link
                                    to={`/news/${article._id}`}
                                    key={article._id}
                                    className="group flex flex-col md:flex-row gap-8 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/[0.07] transition-all duration-500 shadow-lg hover:shadow-primary/5"
                                >
                                    <div className="w-full md:w-80 h-56 md:h-auto shrink-0 rounded-2xl overflow-hidden relative shadow-2xl">
                                        <img
                                            src={article.coverImageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'}
                                            alt={article.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-black/80 text-primary text-[10px] font-black uppercase rounded-lg border border-primary/20 backdrop-blur-md shadow-lg">
                                                {article.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between py-4 flex-grow space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                                    <Calendar className="w-3 h-3 text-primary" />
                                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md border border-white/5">
                                                    <Clock className="w-3 h-3 text-primary" />
                                                    <span>5 Min Read</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-md border border-primary/20">
                                                    <Globe className="w-3 h-3" />
                                                    <span>{article.sourceName}</span>
                                                </div>
                                            </div>

                                            <h2 className="text-3xl font-black text-white leading-tight group-hover:text-primary transition-colors duration-300">
                                                {article.title}
                                            </h2>

                                            <p className="text-text-muted text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
                                                {article.summary}
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <div className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs group-hover:gap-4 transition-all">
                                                Read Full Article
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <BottomNavbar />
        </div>
    );
}

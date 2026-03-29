import { useState, useEffect } from 'react';
import {
    Search, Trash2, ExternalLink, RefreshCw,
    Filter, Newspaper, Calendar, Hash,
    CheckCircle2, AlertCircle, PlayCircle, Plus,
    X, Image as ImageIcon, Type, Gamepad2
} from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { newsService } from '../../services/newsService';
import type { NewsItem } from '../../models/news.model';
import { cn } from '../../lib/utils';
import axios from 'axios';

export default function NewsManagement() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [gameFilter, setGameFilter] = useState('all');
    const [isFetching, setIsFetching] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newArticle, setNewArticle] = useState({
        title: '',
        summary: '',
        content: '',
        game: 'General',
        category: 'general',
        coverImageUrl: '',
        sourceName: 'ArenaChain Admin',
        sourceUrl: '',
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await newsService.getNews({ limit: 100 });
            setNews(res.items);
        } catch (error) {
            console.error('Failed to fetch news:', error);
            if (!silent) alert('Failed to refresh signal.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleManualFetch = async () => {
        setIsFetching(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            await axios.post(`${API_URL}/news/fetch`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('News fetch cycle triggered successfully!');
            fetchNews();
        } catch (error) {
            console.error('Manual fetch failed:', error);
            alert('Failed to trigger news fetch. Make sure you are an admin.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return;
        try {
            await newsService.deleteNews(id);
            setNews(news.filter(n => n._id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete news article.');
        }
    };

    const handleCreateNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const cleanArticle: Record<string, unknown> = { ...newArticle };
            if (!cleanArticle.sourceUrl) delete cleanArticle.sourceUrl;
            if (!cleanArticle.coverImageUrl) delete cleanArticle.coverImageUrl;

            const articleToCreate = {
                ...cleanArticle,
                publishedAt: new Date().toISOString(),
                language: 'en',
                status: 'published' as const,
                tags: [newArticle.game, newArticle.category]
            };
            const created = await newsService.createNews(articleToCreate);
            setIsCreateModalOpen(false);
            setNewArticle({
                title: '',
                summary: '',
                content: '',
                game: 'General',
                category: 'general',
                coverImageUrl: '',
                sourceName: 'ArenaChain Admin',
                sourceUrl: '',
            });
            await fetchNews(true);
            alert(`Article "${created.title}" successfully published!`);
        } catch (error: unknown) {
            console.error('Creation failed:', error);
            const e = error as { response?: { data?: { message?: string } }; message?: string };
            alert(`Failed to create article: ${e.response?.data?.message || e.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const filteredNews = news.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesGame = gameFilter === 'all'
            ? true
            : (gameFilter === 'games_only' ? item.game !== 'other' : item.game === gameFilter);

        return matchesSearch && matchesCategory && matchesGame;
    });

    return (
        <>
            <div className="space-y-6 animate-fade-in-up">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Nexus Feed Management</h1>
                        <p className="text-text-muted">Monitor and manage automated news collection and publishing.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="gap-2 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                        >
                            <Plus className="w-4 h-4" />
                            New Article
                        </Button>
                        <Button
                            onClick={handleManualFetch}
                            disabled={isFetching}
                            className="gap-2 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                        >
                            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Trigger Agent Fetch
                        </Button>
                        <Button onClick={() => fetchNews()} variant="outline" className="gap-2 border-white/10">
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Articles"
                        value={news.length}
                        icon={<Newspaper className="text-blue-400" />}
                    />
                    <StatCard
                        label="Recent (24h)"
                        value={news.filter(n => new Date(n.publishedAt) > new Date(Date.now() - 86400000)).length}
                        icon={<CheckCircle2 className="text-green-400" />}
                    />
                    <StatCard
                        label="Active Sources"
                        value={new Set(news.map(n => n.sourceName)).size}
                        icon={<Hash className="text-purple-400" />}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 bg-surface border border-white/5 p-4 rounded-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <Input
                            className="pl-10 bg-black/20 border-white/5 w-full"
                            placeholder="Search by title or source..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-text-muted" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Categories</option>
                            <option value="patch_notes">Patch Notes</option>
                            <option value="esports">Esports</option>
                            <option value="community">Community</option>
                            <option value="tech">Tech</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-text-muted" />
                        <select
                            value={gameFilter}
                            onChange={(e) => setGameFilter(e.target.value)}
                            className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Items</option>
                            <option value="games_only">Only Games</option>
                            <option value="lol">League of Legends</option>
                            <option value="valorant">Valorant</option>
                            <option value="cs2">CS2</option>
                            <option value="fortnite">Fortnite</option>
                            <option value="dota-2">Dota 2</option>
                            <option value="other">Other / General</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Article</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Game / Category</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Source</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted">Published</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-text-muted text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && news.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-text-muted">
                                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                                            Scanning Nexus frequencies...
                                        </td>
                                    </tr>
                                ) : filteredNews.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-text-muted">
                                            No articles found matching filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredNews.map((item) => (
                                        <tr key={item._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 max-w-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/5 flex-shrink-0 overflow-hidden">
                                                        {item.coverImageUrl ? (
                                                            <img src={item.coverImageUrl} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm opacity-20">📰</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-white truncate text-sm" title={item.title}>
                                                            {item.title}
                                                        </div>
                                                        <div className="text-[10px] text-text-muted uppercase tracking-wider mt-1 flex items-center gap-2">
                                                            <AlertCircle size={10} className="text-primary/50" />
                                                            {item.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-white/50 w-fit uppercase font-bold">
                                                        {item.game}
                                                    </span>
                                                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                                                        {item.category.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">{item.sourceName}</span>
                                                    {item.sourceUrl && (
                                                        <a
                                                            href={item.sourceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                                                        >
                                                            Source <ExternalLink size={8} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-text-muted">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={12} />
                                                    {new Date(item.publishedAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        onClick={() => window.open(`/player/news/${item._id}`, '_blank')}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                                        title="View Details"
                                                    >
                                                        <Search size={14} />
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleDelete(item._id)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-opacity duration-300">
                    <div className="bg-[#1a1b23] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col scale-100 opacity-100 transition-all">
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                                    <Plus size={20} />
                                </div>
                                <h3 className="text-xl font-black uppercase text-white tracking-widest">Create News</h3>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateNews} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Article Title</label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                    <Input
                                        required
                                        className="pl-10 bg-black/40 border-white/5 focus:border-primary/50"
                                        placeholder="Headline here..."
                                        value={newArticle.title}
                                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Game</label>
                                    <div className="relative">
                                        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                        <select
                                            className="w-full pl-10 h-10 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:border-primary/50 focus:outline-none appearance-none"
                                            value={newArticle.game}
                                            onChange={(e) => setNewArticle({ ...newArticle, game: e.target.value })}
                                        >
                                            <option value="General">General</option>
                                            <option value="League of Legends">League of Legends</option>
                                            <option value="Valorant">Valorant</option>
                                            <option value="CS2">Counter-Strike 2</option>
                                            <option value="Dota 2">Dota 2</option>
                                            <option value="Fortnite">Fortnite</option>
                                            <option value="Apex Legends">Apex Legends</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Category</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                        <select
                                            className="w-full pl-10 h-10 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:border-primary/50 focus:outline-none appearance-none"
                                            value={newArticle.category}
                                            onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                                        >
                                            <option value="general">General News</option>
                                            <option value="patch_notes">Patch Notes</option>
                                            <option value="esports">Esports Coverage</option>
                                            <option value="community">Community Highlights</option>
                                            <option value="tech">Tech & Hardware</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Source Name</label>
                                    <Input
                                        className="bg-black/40 border-white/5 focus:border-primary/50"
                                        placeholder="e.g. ArenaChain Admin"
                                        value={newArticle.sourceName}
                                        onChange={(e) => setNewArticle({ ...newArticle, sourceName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Source URL (Optional)</label>
                                    <Input
                                        className="bg-black/40 border-white/5 focus:border-primary/50"
                                        placeholder="https://..."
                                        value={newArticle.sourceUrl}
                                        onChange={(e) => setNewArticle({ ...newArticle, sourceUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Cover Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                    <Input
                                        className="pl-10 bg-black/40 border-white/5 focus:border-primary/50"
                                        placeholder="https://..."
                                        value={newArticle.coverImageUrl}
                                        onChange={(e) => setNewArticle({ ...newArticle, coverImageUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Summary (Short Excerpt)</label>
                                <textarea
                                    className="w-full p-3 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:border-primary/50 focus:outline-none h-20 resize-none"
                                    placeholder="Brief summary for cards..."
                                    value={newArticle.summary}
                                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-text-muted tracking-widest pl-1">Main Content (Markdown supported)</label>
                                <textarea
                                    className="w-full p-4 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:border-primary/50 focus:outline-none h-40 resize-none font-mono"
                                    placeholder="The full story starts here..."
                                    value={newArticle.content}
                                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-2 bg-primary text-black font-black uppercase tracking-widest"
                                >
                                    {isCreating ? 'Publishing...' : 'Publish to Nexus'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function StatCard({ label, value, icon }: { label: string, value: number | string, icon: React.ReactNode }) {
    return (
        <div className="p-6 rounded-2xl bg-surface border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                {icon}
            </div>
            <div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</div>
            </div>
        </div>
    );
}

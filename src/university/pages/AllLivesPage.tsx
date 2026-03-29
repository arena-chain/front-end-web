import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import {
    channelAvatarFromStream,
    channelIdFromStream,
    channelNameFromStream,
    getStreamCategory,
    sortLiveStreams,
    streamerDisplayName,
    streamerIdFromStream,
    uniqueStreamCategories,
    type LiveSortMode,
} from '../../lib/streamBrowse';
import { getStoredUser } from '../../lib/session';
import { streamService, type StreamRecord } from '../../services/stream.service';

const SORT_OPTIONS: { value: LiveSortMode; label: string }[] = [
    { value: 'date-desc', label: 'Date — plus récent' },
    { value: 'date-asc', label: 'Date — plus ancien' },
    { value: 'category-asc', label: 'Catégorie — A → Z' },
    { value: 'category-desc', label: 'Catégorie — Z → A' },
];

function formatLiveDuration(startedAt?: string, createdAt?: string): string {
    const raw = startedAt || createdAt;
    if (!raw) {
        return '';
    }
    const start = new Date(raw).getTime();
    if (Number.isNaN(start)) {
        return '';
    }
    const mins = Math.max(0, Math.floor((Date.now() - start) / 60_000));
    if (mins < 1) {
        return "À l'instant";
    }
    if (mins < 60) {
        return `En direct depuis ${mins} min`;
    }
    const h = Math.floor(mins / 60);
    return `En direct depuis ${h} h`;
}

export default function AllLivesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || 'all';

    const [streams, setStreams] = useState<StreamRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortMode, setSortMode] = useState<LiveSortMode>('date-desc');
    const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory);
    const [visibleCount, setVisibleCount] = useState(10);

    // Sync filter when URL changes
    useEffect(() => {
        const cat = searchParams.get('category') || 'all';
        setCategoryFilter(cat);
    }, [searchParams]);

    // Update URL when filter changes
    const handleCategoryChange = (cat: string) => {
        setCategoryFilter(cat);
        if (cat === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    const load = useCallback(async (isManual = false) => {
        if (isManual) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        try {
            const list = await streamService.getLiveStreams();
            setStreams(Array.isArray(list) ? list : []);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Impossible de charger les directs');
            setStreams([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void load(false);
        const id = window.setInterval(() => void load(false), 45_000);
        return () => window.clearInterval(id);
    }, [load]);

    const myId = getStoredUser()?.id;

    const categories = useMemo(() => uniqueStreamCategories(streams), [streams]);

    const filtered = useMemo(() => {
        if (categoryFilter === 'all') {
            return streams;
        }
        return streams.filter((s) => getStreamCategory(s) === categoryFilter);
    }, [streams, categoryFilter]);

    const sorted = useMemo(() => sortLiveStreams(filtered, sortMode), [filtered, sortMode]);

    const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

    useEffect(() => {
        setVisibleCount(10);
    }, [categoryFilter, sortMode, streams.length]);

    const selectClass =
        'appearance-none pl-3 pr-9 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white font-semibold focus:outline-none focus:border-primary/50 cursor-pointer min-w-[200px]';

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Découvrir</p>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mt-1">
                        Lives en cours
                    </h1>
                    <p className="text-text-muted mt-2 max-w-xl">
                        Parcours des directs comme sur une vitrine : tri par date ou par catégorie (premier tag du
                        stream).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="success" className="uppercase tracking-widest text-[10px] px-3 py-1">
                        {sorted.length} en direct
                    </Badge>
                    <Button type="button" variant="outline" isLoading={refreshing} onClick={() => void load(true)} disabled={loading}>
                        Actualiser
                    </Button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 rounded-2xl border border-white/10 bg-[#0c0e11] px-4 py-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-white/35">Filtrer</span>
                    <div className="relative inline-block">
                        <select
                            value={categoryFilter}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className={selectClass}
                            aria-label="Filtrer par catégorie"
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-white/35">Trier</span>
                    <div className="relative inline-block">
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as LiveSortMode)}
                            className={selectClass}
                            aria-label="Trier les directs"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-white/10 bg-surface p-16 text-center text-text-muted">
                    Chargement des directs…
                </div>
            ) : sorted.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-16 text-center space-y-4">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-primary">
                        <Radio className="w-7 h-7" />
                    </div>
                    <p className="text-lg font-black text-white">Aucun direct pour le moment</p>
                    <p className="text-sm text-text-muted max-w-md mx-auto">
                        Lance un stream depuis{' '}
                        <Link to="/player/go-live" className="text-primary font-bold hover:underline">
                            Go Live
                        </Link>{' '}
                        ou élargis le filtre de catégorie.
                    </p>
                </div>
            ) : (
                <>
                    <div
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                        role="list"
                    >
                        {visible.map((stream) => {
                            const cid = channelIdFromStream(stream);
                            const watchUrl = cid ? `/watch/${cid}` : '';
                            const category = getStreamCategory(stream);
                            const chName = channelNameFromStream(stream);
                            const avatar = channelAvatarFromStream(stream);
                            const isMine = Boolean(myId && streamerIdFromStream(stream) === myId);

                            return (
                                <Link
                                    key={stream._id}
                                    to={watchUrl || '#'}
                                    role="listitem"
                                    className={cn(
                                        'group flex flex-col rounded-xl overflow-hidden bg-[#0f1114] border border-white/[0.08] transition-all duration-200',
                                        watchUrl
                                            ? 'hover:border-primary/35 hover:shadow-[0_12px_40px_rgba(0,255,135,0.08)] hover:-translate-y-0.5'
                                            : 'opacity-60 pointer-events-none',
                                    )}
                                >
                                    <div className="relative aspect-video bg-gradient-to-br from-[#1a1d24] to-black overflow-hidden">
                                        {stream.thumbnailUrl ? (
                                            <img
                                                src={stream.thumbnailUrl}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-transparent to-black">
                                                <span className="text-3xl font-black text-white/15">{chName.slice(0, 1).toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                        <div className="absolute top-2 left-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#e91916] text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                                                Live
                                            </span>
                                        </div>
                                        {isMine && (
                                            <div className="absolute top-2 right-2">
                                                <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/90 text-black">
                                                    Vous
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded bg-black/75 text-[11px] font-bold text-white border border-white/10">
                                                {stream.viewerCount} spectateur{stream.viewerCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 flex gap-3 flex-1">
                                        <div className="shrink-0">
                                            <div
                                                className="w-10 h-10 rounded-full border-2 border-white/10 bg-[#1a1d21] bg-cover bg-center"
                                                style={{
                                                    backgroundImage: avatar ? `url(${avatar})` : undefined,
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <h2 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                                {stream.title}
                                            </h2>
                                            <p className="text-[13px] text-white/55 font-medium truncate">{category}</p>
                                            <p className="text-[12px] text-white/40 truncate">{streamerDisplayName(stream)}</p>
                                            <p className="text-[11px] text-white/30">{formatLiveDuration(stream.startedAt, stream.createdAt)}</p>
                                        </div>
                                    </div>

                                    {(stream.tags || []).length > 0 && (
                                        <div className="px-3 pb-3 flex flex-wrap gap-1">
                                            {(stream.tags || []).slice(0, 4).map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleCategoryChange(tag);
                                                    }}
                                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 hover:border-primary/40 hover:text-primary transition-colors z-20"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {visibleCount < sorted.length && (
                        <div className="flex justify-center pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={() => setVisibleCount((c) => c + 10)}
                                className="text-sm font-bold text-primary hover:text-primary/80 transition-colors py-2 px-6 rounded-xl hover:bg-white/5"
                            >
                                Afficher plus ({sorted.length - visibleCount} restants)
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

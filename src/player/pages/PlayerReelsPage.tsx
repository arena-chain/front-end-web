import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Loader2, MessageCircle, Send, Volume2, VolumeX, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { useAuth } from '../../contexts/AuthContext';
import {
    highlightService,
    type HighlightCommentNode,
    type HighlightEngagementSummary,
    type HighlightRecord,
} from '../../services/highlight.service';

function creatorLabel(c: HighlightRecord['creator']): string {
    if (typeof c === 'object' && c) {
        return String(c.nickname ?? c.username ?? c.email ?? 'Player').trim();
    }
    return 'Player';
}

/** Shorts-style @handle: shorten emails to `@localpart`. */
function shortsHandle(displayName: string): string {
    const t = displayName.trim() || 'player';
    if (t.includes('@') && /\.[a-z]{2,}$/i.test(t.split('@')[1] ?? '')) {
        const local = t.split('@')[0];
        return `@${local}`;
    }
    return t.startsWith('@') ? t : `@${t}`;
}

function initialsFromName(name: string): string {
    const clean = name.replace(/^@/, '').trim();
    if (!clean) return '?';
    const parts = clean.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    return clean.slice(0, 2).toUpperCase();
}

function sortHighlightsNewestFirst(highlights: HighlightRecord[]): HighlightRecord[] {
    return [...highlights].sort((a, b) => {
        const tb = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
        const ta = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
        return tb - ta;
    });
}

export type ReelItem = {
    id: string;
    src: string;
    title: string;
    creator: string;
    description?: string;
    likes: number;
    comments: number;
    shares: number;
    likedByMe: boolean;
};

async function highlightToReel(h: HighlightRecord): Promise<ReelItem> {
    let engagement: HighlightEngagementSummary = {
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
    };
    try {
        engagement = await highlightService.getEngagement(h._id);
    } catch {
        /* ignore */
    }
    return {
        id: h._id,
        src: resolveBackendAssetUrl(h.clipUrl),
        title: h.title,
        creator: creatorLabel(h.creator),
        description: h.description,
        likes: engagement.likeCount ?? 0,
        comments: engagement.commentCount ?? 0,
        shares: 0,
        likedByMe: engagement.likedByMe ?? false,
    };
}

const MAX_REELS = 80;

type DrawerState = { highlightId: string; tab: 'likes' | 'comments' } | null;

export default function PlayerReelsPage() {
    const navigate = useNavigate();
    const [muted, setMuted] = useState(true);
    const [reels, setReels] = useState<ReelItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [drawer, setDrawer] = useState<DrawerState>(null);

    const onBecomeActive = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    const patchReelEngagement = useCallback((highlightId: string, patch: Partial<Pick<ReelItem, 'likes' | 'likedByMe' | 'comments'>>) => {
        setReels((prev) => prev.map((r) => (r.id === highlightId ? { ...r, ...patch } : r)));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        (async () => {
            try {
                const publicList = await highlightService.listPublic();
                const allPublic = publicList.filter((h) => h.visibility === 'public');
                const sorted = sortHighlightsNewestFirst(allPublic).slice(0, MAX_REELS);
                const mapped = await Promise.all(sorted.map((h) => highlightToReel(h)));
                if (!cancelled) {
                    setReels(mapped);
                    setActiveId(mapped[0]?.id ?? null);
                }
            } catch (e) {
                if (!cancelled) {
                    toast.error(e instanceof Error ? e.message : 'Could not load reels');
                    setReels([]);
                    setActiveId(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-white/70">
                <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
                <p className="text-sm text-white/45">Loading Shorts…</p>
            </div>
        );
    }

    if (reels.length === 0) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-20 text-center text-white/80">
                <p className="text-sm uppercase tracking-widest text-white/40">No reels yet</p>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/55">
                    There are no <strong className="text-white/80">public</strong> highlights from the community yet.
                    When players publish clips as public, they show up here for everyone.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/player/highlights')}
                    className="mt-6 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm hover:bg-white/10"
                >
                    Open highlights hub
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/player/dashboard')}
                    className="mt-4 text-sm text-white/40 hover:text-white/70"
                >
                    ← Back to dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-0 rounded-xl bg-[#0f0f0f] ring-1 ring-white/[0.06]">
            <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-2 py-2 md:px-3">
                <button
                    type="button"
                    onClick={() => navigate('/player/dashboard')}
                    aria-label="Back"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                >
                    <ArrowLeft size={20} strokeWidth={2} />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[15px] font-semibold tracking-tight text-white">Shorts</h1>
                    <p className="truncate text-[11px] text-white/45">Public highlights from the community</p>
                </div>
                <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/10"
                >
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col bg-black md:flex-row md:overflow-hidden">
                <div
                    className={cn(
                        'mx-auto min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain snap-y snap-mandatory px-1 md:px-2',
                        'h-[min(calc(100dvh-10rem),860px)] md:h-[min(calc(100dvh-9rem),900px)]',
                        drawer && 'md:max-w-none',
                    )}
                >
                    {reels.map((reel) => (
                        <ReelTile
                            key={reel.id}
                            reel={reel}
                            muted={muted}
                            active={activeId === reel.id}
                            onBecomeActive={onBecomeActive}
                            onOpenLikes={() => setDrawer({ highlightId: reel.id, tab: 'likes' })}
                            onOpenComments={() => setDrawer({ highlightId: reel.id, tab: 'comments' })}
                        />
                    ))}
                </div>

                {drawer ? (
                    <ReelEngagementDrawer
                        key={`${drawer.highlightId}-${drawer.tab}`}
                        highlightId={drawer.highlightId}
                        initialTab={drawer.tab}
                        onClose={() => setDrawer(null)}
                        onEngagementUpdate={patchReelEngagement}
                    />
                ) : null}
            </div>
        </div>
    );
}

type ReelTileProps = {
    reel: ReelItem;
    muted: boolean;
    active: boolean;
    onBecomeActive: (id: string) => void;
    onOpenLikes: () => void;
    onOpenComments: () => void;
};

function ReelTile({ reel, muted, active, onBecomeActive, onOpenLikes, onOpenComments }: ReelTileProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [likes, setLikes] = useState(reel.likes);
    const [comments, setComments] = useState(reel.comments);
    const [likedByMe, setLikedByMe] = useState(reel.likedByMe);
    const [subscribed, setSubscribed] = useState(false);
    const handle = shortsHandle(reel.creator);
    const initials = initialsFromName(reel.creator);

    useEffect(() => {
        setLikes(reel.likes);
        setComments(reel.comments);
        setLikedByMe(reel.likedByMe);
    }, [reel.id, reel.likes, reel.comments, reel.likedByMe]);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        const id = reel.id;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.55) {
                        onBecomeActive(id);
                    }
                }
            },
            { threshold: [0.55] },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [reel.id, onBecomeActive]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (active) {
            v.muted = muted;
            void v.play().catch(() => {
                /* autoplay blocked */
            });
        } else {
            v.pause();
            v.currentTime = 0;
        }
    }, [active, muted]);

    return (
        <div
            ref={rootRef}
            className="relative flex min-h-[min(calc(100dvh-10rem),860px)] snap-start flex-col items-stretch justify-center px-2 py-3 md:min-h-[min(calc(100dvh-9rem),900px)] md:px-3"
            data-reel-id={reel.id}
        >
            <div className="mx-auto flex w-full max-w-[520px] flex-row flex-wrap items-end justify-center gap-x-3 gap-y-2 md:max-w-[560px] md:gap-x-5 md:gap-y-0">
                <div className="relative aspect-[9/16] min-h-0 w-full max-w-[420px] overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-white/[0.08]">
                    <video
                        ref={videoRef}
                        src={reel.src}
                        className="h-full w-full bg-black object-cover object-center"
                        playsInline
                        loop
                        preload="metadata"
                        onClick={() => {
                            const v = videoRef.current;
                            if (!v) return;
                            if (v.paused) void v.play();
                            else v.pause();
                        }}
                    />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] px-3 pb-4 pt-16 md:px-4 md:pb-5">
                        <div className="pointer-events-auto flex items-end gap-3">
                            <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white ring-2 ring-white/25"
                                aria-hidden
                            >
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1 pb-0.5">
                                <p className="truncate text-[13px] font-medium text-white">{handle}</p>
                                <h3 className="mt-0.5 line-clamp-2 text-[13px] font-normal leading-snug text-white/95">{reel.title}</h3>
                                {reel.description ? (
                                    <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-white/65">{reel.description}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSubscribed((s) => !s)}
                                className={cn(
                                    'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition',
                                    subscribed
                                        ? 'bg-white/15 text-white ring-1 ring-white/20'
                                        : 'bg-white text-[#0f0f0f] hover:bg-white/90',
                                )}
                            >
                                {subscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Beside the reel (YouTube Shorts desktop pattern) */}
                <div className="flex shrink-0 flex-col-reverse items-center justify-end gap-5 pb-[4.5rem] md:gap-6 md:pb-[5.25rem]">
                    <ShortsActionButton
                        variant="beside"
                        icon={
                            <Heart
                                size={22}
                                strokeWidth={2}
                                className={likedByMe ? 'fill-primary text-primary' : 'text-primary'}
                                fill={likedByMe ? 'currentColor' : 'none'}
                            />
                        }
                        label={formatCount(likes)}
                        onClick={onOpenLikes}
                        ariaLabel="Likes"
                    />
                    <ShortsActionButton
                        variant="beside"
                        icon={<MessageCircle size={22} strokeWidth={2} className="text-primary" />}
                        label={formatCount(comments)}
                        onClick={onOpenComments}
                        ariaLabel="Comments"
                    />
                </div>
            </div>
        </div>
    );
}

type ShortsActionButtonProps = {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    /** Next to reel column — crisp circles, no blur */
    variant?: 'overlay' | 'beside';
};

function ShortsActionButton({ icon, label, onClick, disabled, ariaLabel, variant = 'overlay' }: ShortsActionButtonProps) {
    const beside = variant === 'beside';
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
                'group flex flex-col items-center gap-1 transition-transform active:scale-95',
                disabled && 'pointer-events-none opacity-50',
            )}
        >
            <span
                className={cn(
                    'flex items-center justify-center rounded-full transition-colors',
                    beside
                        ? 'h-11 w-11 bg-[#272727] text-primary shadow-sm ring-1 ring-primary/25 hover:bg-[#3f3f3f] hover:ring-primary/40 md:h-12 md:w-12'
                        : 'h-11 w-11 bg-black/40 text-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-black/55 md:h-12 md:w-12',
                )}
            >
                {icon}
            </span>
            <span
                className={cn(
                    'max-w-[52px] truncate text-[11px] font-medium tabular-nums',
                    beside ? 'text-primary/80' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
                )}
            >
                {label}
            </span>
        </button>
    );
}

function formatCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`.replace('.0K', 'K');
    return `${(n / 1_000_000).toFixed(1)}M`;
}

function normalizeHighlightComments(data: unknown): HighlightCommentNode[] {
    if (Array.isArray(data)) return data as HighlightCommentNode[];
    if (data && typeof data === 'object') {
        const c = (data as { comments?: unknown }).comments;
        if (Array.isArray(c)) return c as HighlightCommentNode[];
        const items = (data as { items?: unknown }).items;
        if (Array.isArray(items)) return items as HighlightCommentNode[];
    }
    return [];
}

/** Backend may return nested threads or a flat list with parentComment — normalize for display. */
function buildCommentThreads(nodes: HighlightCommentNode[]): HighlightCommentNode[] {
    if (!nodes.length) return [];
    const hasNestedChildren = nodes.some((n) => Array.isArray(n.replies) && n.replies.length > 0);
    if (hasNestedChildren) {
        return nodes.filter((n) => n.parentComment == null || n.parentComment === '');
    }
    const map = new Map<string, HighlightCommentNode & { replies: HighlightCommentNode[] }>();
    for (const n of nodes) {
        map.set(n._id, { ...n, replies: Array.isArray(n.replies) ? n.replies : [] });
    }
    const roots: HighlightCommentNode[] = [];
    for (const n of nodes) {
        const node = map.get(n._id);
        if (!node) continue;
        const pid = n.parentComment;
        if (pid == null || pid === '') {
            roots.push(node);
            continue;
        }
        const parent = map.get(pid);
        if (parent) parent.replies.push(node);
        else roots.push(node);
    }
    return roots;
}

function commentAuthorLabel(a: HighlightCommentNode['author']): string {
    if (a && typeof a === 'object') {
        return (a.nickname?.trim() || a.email?.split('@')[0] || 'User').trim();
    }
    if (typeof a === 'string' && a.trim()) return a.trim();
    return 'User';
}

function ReelCommentThread({
    node,
    depth,
}: {
    node: HighlightCommentNode;
    depth: number;
}) {
    return (
        <div
            className={cn(
                'rounded-lg border border-[#3f3f3f] bg-[#272727]/50 p-3',
                depth > 0 && 'ml-3 mt-2 border-[#3f3f3f]/70 bg-[#272727]/30',
            )}
        >
            <p className="text-[13px] font-medium text-[#f2f2f2]">{commentAuthorLabel(node.author)}</p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-snug text-[#e6e6e6]">{node.body}</p>
            {node.replies?.length ? (
                <div className="mt-2 space-y-2 border-t border-[#3f3f3f]/80 pt-2">
                    {node.replies.map((r) => (
                        <ReelCommentThread key={r._id} node={r} depth={depth + 1} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function ReelEngagementDrawer({
    highlightId,
    initialTab,
    onClose,
    onEngagementUpdate,
}: {
    highlightId: string;
    initialTab: 'likes' | 'comments';
    onClose: () => void;
    onEngagementUpdate: (
        id: string,
        patch: Partial<Pick<ReelItem, 'likes' | 'likedByMe' | 'comments'>>,
    ) => void;
}) {
    const { user } = useAuth();
    const [tab, setTab] = useState<'likes' | 'comments'>(initialTab);
    const [engagement, setEngagement] = useState<HighlightEngagementSummary | null>(null);
    const [comments, setComments] = useState<HighlightCommentNode[]>([]);
    const [loadingEngagement, setLoadingEngagement] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [likeBusy, setLikeBusy] = useState(false);
    const [commentBody, setCommentBody] = useState('');
    const [posting, setPosting] = useState(false);

    const patchParent = useCallback(
        (patch: Partial<Pick<ReelItem, 'likes' | 'likedByMe' | 'comments'>>) => {
            onEngagementUpdate(highlightId, patch);
        },
        [highlightId, onEngagementUpdate],
    );

    const refreshAll = useCallback(async () => {
        setLoadingEngagement(true);
        setLoadingComments(true);

        const [engResult, comResult] = await Promise.all([
            highlightService
                .getEngagement(highlightId)
                .then((value) => ({ ok: true as const, value }))
                .catch(() => ({ ok: false as const })),
            highlightService
                .listComments(highlightId)
                .then((value) => ({ ok: true as const, value }))
                .catch(() => ({ ok: false as const })),
        ]);

        if (engResult.ok) {
            const e = engResult.value;
            setEngagement(e);
            patchParent({
                likes: e.likeCount ?? 0,
                likedByMe: e.likedByMe ?? false,
                comments: e.commentCount ?? 0,
            });
        } else {
            toast.error('Could not load likes');
            setEngagement(null);
        }
        setLoadingEngagement(false);

        if (comResult.ok) {
            const flat = normalizeHighlightComments(comResult.value);
            setComments(buildCommentThreads(flat));
        } else {
            toast.error('Could not load comments');
            setComments([]);
        }
        setLoadingComments(false);
    }, [highlightId, patchParent]);

    useEffect(() => {
        setTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        void refreshAll();
    }, [refreshAll]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function toggleLike() {
        if (!user?.id) {
            toast.message('Sign in to like highlights.');
            return;
        }
        if (likeBusy || !engagement) return;
        setLikeBusy(true);
        const was = engagement.likedByMe;
        try {
            if (was) await highlightService.unlike(highlightId);
            else await highlightService.like(highlightId);
            const e = await highlightService.getEngagement(highlightId);
            setEngagement(e);
            patchParent({
                likes: e.likeCount ?? 0,
                likedByMe: e.likedByMe ?? false,
                comments: e.commentCount ?? 0,
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not update like');
        } finally {
            setLikeBusy(false);
        }
    }

    async function submitComment(e: FormEvent) {
        e.preventDefault();
        const text = commentBody.trim();
        if (!text || !user?.id) {
            if (!user?.id) toast.message('Sign in to comment.');
            return;
        }
        setPosting(true);
        try {
            await highlightService.addComment(highlightId, text);
            setCommentBody('');
            await refreshAll();
            toast.success('Comment posted');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not post comment');
        } finally {
            setPosting(false);
        }
    }

    const liked = engagement?.likedByMe ?? false;
    const likeCount = engagement?.likeCount ?? 0;

    return (
        <div
            className={cn(
                'relative z-[120] flex w-full flex-col border-[#272727] bg-[#212121] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] md:z-auto md:w-[380px] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none',
                'fixed bottom-0 left-0 right-0 max-h-[min(72vh,calc(100dvh-9rem))] rounded-t-2xl border-t md:static md:max-h-[min(calc(100dvh-9rem),900px)] md:h-[min(calc(100dvh-9rem),900px)]',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reel-drawer-title"
        >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#3f3f3f] px-4 py-3">
                    <div className="flex flex-1 rounded-full bg-[#272727] p-1">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'likes'}
                            onClick={() => setTab('likes')}
                            className={cn(
                                'flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition',
                                tab === 'likes' ? 'bg-[#3f3f3f] text-white' : 'text-[#aaa] hover:text-white',
                            )}
                        >
                            Likes
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={tab === 'comments'}
                            onClick={() => setTab('comments')}
                            className={cn(
                                'flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition',
                                tab === 'comments' ? 'bg-[#3f3f3f] text-white' : 'text-[#aaa] hover:text-white',
                            )}
                        >
                            Comments
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#f2f2f2] hover:bg-[#3f3f3f]"
                        aria-label="Close panel"
                    >
                        <X size={18} />
                    </button>
                </div>

                <h2 id="reel-drawer-title" className="sr-only">
                    {tab === 'likes' ? 'Likes' : 'Comments'}
                </h2>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4">
                    {tab === 'likes' ? (
                        loadingEngagement ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/80" aria-label="Loading likes" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 py-8 text-center">
                                <p className="text-4xl font-semibold tabular-nums text-[#f2f2f2]">{likeCount}</p>
                                <p className="max-w-xs text-sm text-[#aaa]">
                                    Players who liked this clip. Individual profiles may appear here when the API supports it.
                                </p>
                                <button
                                    type="button"
                                    disabled={likeBusy}
                                    onClick={() => void toggleLike()}
                                    className={cn(
                                        'flex h-16 w-16 items-center justify-center rounded-full border-2 transition',
                                        liked ? 'border-red-500 bg-red-500/15 text-red-500' : 'border-white/20 bg-white/[0.06] text-white hover:border-white/35',
                                        likeBusy && 'opacity-50',
                                    )}
                                    aria-pressed={liked}
                                >
                                    <Heart size={32} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-red-500' : ''} />
                                </button>
                                <p className="text-xs font-medium text-[#717171]">{liked ? 'You liked this highlight' : 'Tap to like'}</p>
                            </div>
                        )
                    ) : loadingComments ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/80" aria-label="Loading comments" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 pb-4">
                            {comments.length === 0 ? (
                                <p className="py-10 text-center text-sm text-[#717171]">No comments yet — start the thread.</p>
                            ) : (
                                <div className="space-y-3">
                                    {comments.map((c) => (
                                        <ReelCommentThread key={c._id} node={c} depth={0} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {tab === 'comments' ? (
                    <form
                        onSubmit={(e) => void submitComment(e)}
                        className="shrink-0 border-t border-[#3f3f3f] bg-[#212121] p-3"
                    >
                        <div className="flex gap-2">
                            <input
                                value={commentBody}
                                onChange={(ev) => setCommentBody(ev.target.value)}
                                placeholder={user?.id ? 'Add a comment…' : 'Sign in to comment'}
                                disabled={!user?.id || posting}
                                className="min-h-[44px] flex-1 rounded-full border border-[#3f3f3f] bg-[#121212] px-4 text-sm text-[#f2f2f2] placeholder:text-[#717171] outline-none focus:border-[#717171] disabled:opacity-45"
                            />
                            <button
                                type="submit"
                                disabled={!user?.id || posting || !commentBody.trim()}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3ea6ff] text-[#0f0f0f] hover:bg-[#65b8ff] disabled:opacity-40"
                                aria-label="Send comment"
                            >
                                {posting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </form>
                ) : null}
        </div>
    );
}

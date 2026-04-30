import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Heart, MessageCircle, Trash2, ThumbsUp, CornerDownRight, Bookmark } from 'lucide-react';
import {
    highlightService,
    type HighlightCommentNode,
    type HighlightEngagementSummary,
} from '../../services/highlight.service';
import { videoService } from '../../services/video.service';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Textarea } from '../ui/core';

type EngagementApi = {
    getEngagement: (id: string) => Promise<HighlightEngagementSummary>;
    listComments: (id: string) => Promise<HighlightCommentNode[]>;
    addComment: (id: string, body: string, parentCommentId?: string) => Promise<HighlightCommentNode>;
    like: (id: string) => Promise<{ liked: boolean; likeCount: number }>;
    unlike: (id: string) => Promise<{ liked: boolean; likeCount: number }>;
    likeComment: (commentId: string) => Promise<{ liked: boolean; likeCount: number }>;
    unlikeComment: (commentId: string) => Promise<{ liked: boolean; likeCount: number }>;
    deleteComment: (commentId: string) => Promise<void>;
};

function apiForKind(kind: 'highlight' | 'video'): EngagementApi {
    return kind === 'highlight' ? highlightService : videoService;
}

function authorId(author: HighlightCommentNode['author']): string {
    if (!author || typeof author === 'string') return String(author ?? '');
    return String(author._id ?? '');
}

function authorLabel(author: HighlightCommentNode['author']): string {
    if (author && typeof author === 'object') {
        return author.nickname?.trim() || author.email?.split('@')[0] || 'User';
    }
    return 'User';
}

function axiosMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
        const m = data?.message;
        if (Array.isArray(m)) return m.join(', ');
        if (typeof m === 'string') return m;
    }
    return err instanceof Error ? err.message : 'Something went wrong';
}

function CommentBlock({
    node,
    entityId,
    svc,
    user,
    depth,
    replyingToId,
    setReplyingToId,
    replyBody,
    setReplyBody,
    replyBusy,
    setReplyBusy,
    commentLikeBusyId,
    setCommentLikeBusyId,
    deletingId,
    onDelete,
    onRefresh,
}: {
    node: HighlightCommentNode;
    entityId: string;
    svc: EngagementApi;
    user: { id: string } | null;
    depth: number;
    replyingToId: string | null;
    setReplyingToId: (id: string | null) => void;
    replyBody: string;
    setReplyBody: (s: string) => void;
    replyBusy: boolean;
    setReplyBusy: (b: boolean) => void;
    commentLikeBusyId: string | null;
    setCommentLikeBusyId: (id: string | null) => void;
    deletingId: string | null;
    onDelete: (id: string) => void;
    onRefresh: () => Promise<void>;
}) {
    const mine = Boolean(user?.id && authorId(node.author) === user.id);
    const isReplying = replyingToId === node._id;
    const canReply = Boolean(user?.id && depth === 0);

    async function toggleCommentLike() {
        if (!user?.id) {
            toast.message('Connectez-vous pour aimer ce commentaire.');
            return;
        }
        setCommentLikeBusyId(node._id);
        try {
            if (node.likedByMe) {
                await svc.unlikeComment(node._id);
            } else {
                await svc.likeComment(node._id);
            }
            await onRefresh();
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setCommentLikeBusyId(null);
        }
    }

    async function submitReply(e: FormEvent) {
        e.preventDefault();
        const text = replyBody.trim();
        if (!text || !user?.id || !replyingToId) return;
        setReplyBusy(true);
        try {
            await svc.addComment(entityId, text, replyingToId);
            setReplyBody('');
            setReplyingToId(null);
            await onRefresh();
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setReplyBusy(false);
        }
    }

    return (
        <div className={depth > 0 ? 'mt-2 ml-3 pl-3 border-l border-white/15' : ''}>
            <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary/90">
                            {authorLabel(node.author)}
                        </p>
                        <p className="text-white/85 whitespace-pre-wrap break-words">{node.body}</p>
                    </div>
                    {mine && (
                        <button
                            type="button"
                            aria-label="Supprimer le commentaire"
                            className="shrink-0 p-1 rounded-md text-white/35 hover:text-red-400 hover:bg-red-500/10"
                            disabled={deletingId === node._id}
                            onClick={() => void onDelete(node._id)}
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                        type="button"
                        disabled={commentLikeBusyId === node._id}
                        onClick={() => void toggleCommentLike()}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                            node.likedByMe
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-white/5 text-white/55 hover:bg-white/10'
                        }`}
                    >
                        <ThumbsUp size={13} className={node.likedByMe ? 'fill-current' : ''} />
                        {node.likeCount > 0 ? node.likeCount : "J'aime"}
                    </button>
                    {canReply && (
                        <button
                            type="button"
                            onClick={() => {
                                setReplyingToId(isReplying ? null : node._id);
                                if (!isReplying) setReplyBody('');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white/50 hover:text-primary"
                        >
                            <CornerDownRight size={13} />
                            Répondre
                        </button>
                    )}
                </div>
                {isReplying && (
                    <form onSubmit={(e) => void submitReply(e)} className="mt-2 space-y-2 pt-2 border-t border-white/5">
                        <Textarea
                            rows={2}
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder={`Réponse à ${authorLabel(node.author)}…`}
                            className="bg-white/5 border-white/10 text-sm"
                            maxLength={2000}
                        />
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={!replyBody.trim()} isLoading={replyBusy}>
                                Publier
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setReplyingToId(null);
                                    setReplyBody('');
                                }}
                            >
                                Annuler
                            </Button>
                        </div>
                    </form>
                )}
            </div>
            {node.replies?.length ? (
                <div className="space-y-1">
                    {node.replies.map((r) => (
                        <CommentBlock
                            key={r._id}
                            node={r}
                            entityId={entityId}
                            svc={svc}
                            user={user}
                            depth={depth + 1}
                            replyingToId={replyingToId}
                            setReplyingToId={setReplyingToId}
                            replyBody={replyBody}
                            setReplyBody={setReplyBody}
                            replyBusy={replyBusy}
                            setReplyBusy={setReplyBusy}
                            commentLikeBusyId={commentLikeBusyId}
                            setCommentLikeBusyId={setCommentLikeBusyId}
                            deletingId={deletingId}
                            onDelete={onDelete}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

type MediaKind = 'highlight' | 'video';

export type EngagementLayout = 'standard' | 'embedded';

type MediaEngagementProps = {
    kind: MediaKind;
    entityId: string;
    className?: string;
    /**
     * `standard` — default page layout (capped comment list height).
     * `embedded` — fills a flex parent; toolbar + form stay visible, only the comment list scrolls
     * (YouTube-style panel below video, or highlight side column).
     */
    layout?: EngagementLayout;
};

function MediaEngagement({ kind, entityId, className = '', layout = 'standard' }: MediaEngagementProps) {
    const embedded = layout === 'embedded';
    const { user } = useAuth();
    const [engagement, setEngagement] = useState<HighlightEngagementSummary | null>(null);
    const [threads, setThreads] = useState<HighlightCommentNode[]>([]);
    const [blocked, setBlocked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [likeBusy, setLikeBusy] = useState(false);
    const [saveBusy, setSaveBusy] = useState(false);
    const [commentBody, setCommentBody] = useState('');
    const [commentBusy, setCommentBusy] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState('');
    const [replyBusy, setReplyBusy] = useState(false);
    const [commentLikeBusyId, setCommentLikeBusyId] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        const svc = apiForKind(kind);
        setLoading(true);
        setBlocked(false);
        try {
            const [e, c] = await Promise.all([svc.getEngagement(entityId), svc.listComments(entityId)]);
            setEngagement(e);
            setThreads(c);
        } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 403 || status === 401) {
                setBlocked(true);
                setEngagement(null);
                setThreads([]);
            } else {
                toast.error(axiosMessage(err));
            }
        } finally {
            setLoading(false);
        }
    }, [entityId, kind]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    async function toggleMediaLike() {
        if (!user?.id) {
            toast.message(kind === 'video' ? 'Connectez-vous pour aimer cette vidéo.' : 'Connectez-vous pour aimer ce clip.');
            return;
        }
        if (!engagement) return;
        const svc = apiForKind(kind);
        setLikeBusy(true);
        try {
            const next = engagement.likedByMe ? await svc.unlike(entityId) : await svc.like(entityId);
            setEngagement((prev) =>
                prev
                    ? {
                          ...prev,
                          likedByMe: next.liked,
                          likeCount: next.likeCount,
                      }
                    : prev,
            );
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setLikeBusy(false);
        }
    }

    async function toggleSave() {
        if (kind !== 'highlight') return;
        if (!user?.id) {
            toast.message('Connectez-vous pour enregistrer ce clip.');
            return;
        }
        if (!engagement) return;
        setSaveBusy(true);
        try {
            const next = engagement.savedByMe
                ? await highlightService.unsaveHighlight(entityId)
                : await highlightService.saveHighlight(entityId);
            setEngagement(next);
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setSaveBusy(false);
        }
    }

    async function submitTopComment(e: FormEvent) {
        e.preventDefault();
        const text = commentBody.trim();
        if (!text || !user?.id) return;
        const svc = apiForKind(kind);
        setCommentBusy(true);
        try {
            await svc.addComment(entityId, text);
            setCommentBody('');
            await refresh();
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setCommentBusy(false);
        }
    }

    async function removeComment(id: string) {
        const svc = apiForKind(kind);
        setDeletingId(id);
        try {
            await svc.deleteComment(id);
            await refresh();
        } catch (err) {
            toast.error(axiosMessage(err));
        } finally {
            setDeletingId(null);
        }
    }

    if (loading && !engagement && !blocked) {
        return (
            <div className={`text-[11px] text-white/35 uppercase tracking-widest ${className}`}>
                Chargement des réactions…
            </div>
        );
    }

    if (blocked) {
        return (
            <p className={`text-xs text-white/45 ${className}`}>
                {kind === 'video'
                    ? 'Réactions visibles sur les VOD publiques sur votre chaîne, ou connecté comme propriétaire pour une vidéo privée.'
                    : 'Réactions et commentaires visibles sur les clips publics, ou une fois connecté comme créateur pour un clip privé.'}
            </p>
        );
    }

    const nComments = engagement?.commentCount ?? 0;
    const commentPlaceholder =
        kind === 'video' ? 'Partagez votre avis sur cette VOD…' : 'Partagez votre avis sur ce clip…';

    return (
        <div
            className={`${embedded ? 'space-y-2 border-t-0 pt-0 flex flex-col flex-1 min-h-0' : 'space-y-3 border-t border-white/10 pt-3'} ${className}`}
        >
            <div className={`flex flex-wrap items-center gap-1.5 ${embedded ? '' : 'sm:gap-3'} shrink-0`}>
                <button
                    type="button"
                    onClick={() => void toggleMediaLike()}
                    disabled={likeBusy}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                        engagement?.likedByMe
                            ? 'bg-primary/20 text-primary'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                >
                    <Heart size={16} className={engagement?.likedByMe ? 'fill-current' : ''} />
                    {engagement?.likeCount ?? 0}
                </button>
                {kind === 'highlight' && (
                    <button
                        type="button"
                        onClick={() => void toggleSave()}
                        disabled={saveBusy}
                        title="Saved highlights"
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                            engagement?.savedByMe
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                    >
                        <Bookmark size={16} className={engagement?.savedByMe ? 'fill-current' : ''} />
                        {engagement?.saveCount != null && engagement.saveCount > 0 ? engagement.saveCount : 'Sauver'}
                    </button>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
                    <MessageCircle size={16} />
                    {nComments} commentaire{nComments !== 1 ? 's' : ''}
                </span>
                {!user?.id && (
                    <Link to="/login" className="text-[10px] font-black uppercase tracking-wider text-primary ml-auto">
                        Se connecter pour participer
                    </Link>
                )}
            </div>

            {user?.id ? (
                <form
                    onSubmit={(e) => void submitTopComment(e)}
                    className={`shrink-0 ${embedded ? 'space-y-1.5' : 'space-y-2'}`}
                >
                    <label className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">
                        Commentaire
                    </label>
                    <Textarea
                        rows={embedded ? 2 : 2}
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                        placeholder={commentPlaceholder}
                        className={`resize-none text-sm ${embedded ? 'border-white/[0.08] bg-black/35 text-white/90 placeholder:text-white/25' : 'bg-white/5 border-white/10'}`}
                        maxLength={2000}
                    />
                    <div className={embedded ? 'flex justify-end' : ''}>
                        <Button type="submit" size="sm" disabled={!commentBody.trim()} isLoading={commentBusy}>
                            Publier
                        </Button>
                    </div>
                </form>
            ) : null}

            <ul
                className={
                    embedded
                        ? 'flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 overscroll-contain [scrollbar-gutter:stable]'
                        : 'max-h-[28rem] overflow-y-auto space-y-3 pr-1'
                }
            >
                {threads.length === 0 ? (
                    <li className="text-[11px] text-white/35">Aucun commentaire pour l&apos;instant.</li>
                ) : (
                    threads.map((c) => (
                        <li key={c._id}>
                            <CommentBlock
                                node={c}
                                entityId={entityId}
                                svc={apiForKind(kind)}
                                user={user}
                                depth={0}
                                replyingToId={replyingToId}
                                setReplyingToId={setReplyingToId}
                                replyBody={replyBody}
                                setReplyBody={setReplyBody}
                                replyBusy={replyBusy}
                                setReplyBusy={setReplyBusy}
                                commentLikeBusyId={commentLikeBusyId}
                                setCommentLikeBusyId={setCommentLikeBusyId}
                                deletingId={deletingId}
                                onDelete={removeComment}
                                onRefresh={refresh}
                            />
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

export function HighlightEngagement({
    highlightId,
    className,
    layout = 'standard',
}: {
    highlightId: string;
    className?: string;
    layout?: EngagementLayout;
}) {
    return (
        <MediaEngagement kind="highlight" entityId={highlightId} className={className} layout={layout} />
    );
}

export function VideoEngagement({
    videoId,
    className,
    layout = 'standard',
}: {
    videoId: string;
    className?: string;
    layout?: EngagementLayout;
}) {
    return <MediaEngagement kind="video" entityId={videoId} className={className} layout={layout} />;
}

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Share2,
    UserPlus,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SAMPLE_REELS, type SampleReel } from '../../assets/reels';

/**
 * PlayerReelsPage — vertical TikTok-style reels viewer.
 *
 * STATIC mode: reads from `SAMPLE_REELS` (compiled-in MP4s).
 * Layout: full-viewport snap scroll, top-left back, top-right mute, right
 * action rail, bottom metadata. Only the centered reel plays (IntersectionObserver).
 */
export default function PlayerReelsPage() {
    const navigate = useNavigate();
    const [muted, setMuted] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(SAMPLE_REELS[0]?.id ?? null);

    const onBecomeActive = useCallback((id: string) => {
        setActiveId(id);
    }, []);

    if (SAMPLE_REELS.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white/80">
                <div className="text-center">
                    <p className="text-sm uppercase tracking-widest text-white/40">No reels yet</p>
                    <p className="mt-2 text-base">
                        Drop a few MP4s into{' '}
                        <code className="rounded bg-white/10 px-1 py-0.5 text-xs">src/assets/reels/</code> and add
                        entries in <code className="rounded bg-white/10 px-1 py-0.5 text-xs">index.ts</code>.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/player/dashboard')}
                        className="mt-6 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm hover:bg-white/10"
                    >
                        ← Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <button
                type="button"
                onClick={() => navigate('/player/dashboard')}
                aria-label="Back to dashboard"
                className="fixed left-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:scale-105 hover:bg-black/80 active:scale-95"
            >
                <ArrowLeft size={20} />
            </button>

            <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="fixed right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80"
            >
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div className="h-full w-full snap-y snap-mandatory overflow-y-scroll scroll-smooth">
                {SAMPLE_REELS.map((reel) => (
                    <ReelTile
                        key={reel.id}
                        reel={reel}
                        muted={muted}
                        active={activeId === reel.id}
                        onBecomeActive={onBecomeActive}
                    />
                ))}
            </div>
        </div>
    );
}

type ReelTileProps = {
    reel: SampleReel;
    muted: boolean;
    active: boolean;
    onBecomeActive: (id: string) => void;
};

function ReelTile({ reel, muted, active, onBecomeActive }: ReelTileProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(reel.likes);
    const [comments, setComments] = useState(reel.comments);
    const [shares, setShares] = useState(reel.shares);
    const [invited, setInvited] = useState(false);

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        const id = reel.id;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.6) {
                        onBecomeActive(id);
                    }
                }
            },
            { threshold: [0.6] },
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

    function toggleLike() {
        setLiked((wasLiked) => {
            setLikes((n) => n + (wasLiked ? -1 : 1));
            return !wasLiked;
        });
    }

    function bumpShares() {
        setShares((n) => n + 1);
    }

    function toggleInvite() {
        setInvited((was) => !was);
    }

    function openComments() {
        setComments((c) => c + 1);
        console.log('[Reels] Open comments for', reel.id);
    }

    return (
        <div
            ref={rootRef}
            className="relative flex h-screen w-full snap-start items-center justify-center"
            data-reel-id={reel.id}
        >
            <video
                ref={videoRef}
                src={reel.src}
                className="h-full w-full bg-black object-contain"
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

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 pb-24">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">@{reel.creator}</p>
                <h3 className="mt-1 text-base font-bold leading-tight text-white">{reel.title}</h3>
                {reel.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-white/75">{reel.description}</p>
                ) : null}
            </div>

            <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
                <ActionButton
                    icon={
                        <Heart
                            size={26}
                            fill={liked ? '#ef4444' : 'none'}
                            className={liked ? 'text-red-500' : 'text-white'}
                        />
                    }
                    label={formatCount(likes)}
                    onClick={toggleLike}
                />
                <ActionButton
                    icon={<MessageCircle size={26} className="text-white" />}
                    label={formatCount(comments)}
                    onClick={openComments}
                />
                <ActionButton
                    icon={<Share2 size={26} className="text-white" />}
                    label={formatCount(shares)}
                    onClick={bumpShares}
                />
                <ActionButton
                    icon={<UserPlus size={26} className={invited ? 'text-primary' : 'text-white'} />}
                    label={invited ? 'Invited' : 'Invite'}
                    onClick={toggleInvite}
                />
            </div>
        </div>
    );
}

type ActionButtonProps = {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
};

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'group flex flex-col items-center gap-1 transition-all',
                'active:scale-90',
            )}
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition group-hover:bg-black/70">
                {icon}
            </span>
            <span className="text-[10px] font-bold text-white/90">{label}</span>
        </button>
    );
}

function formatCount(n: number): string {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`.replace('.0K', 'K');
    return `${(n / 1_000_000).toFixed(1)}M`;
}

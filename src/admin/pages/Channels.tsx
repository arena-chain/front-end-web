import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Users, RefreshCw, Tv2, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { channelService, type ChannelRecord } from '../../services/channel.service';
import { cn } from '../../lib/utils';

function ownerLabel(channel: ChannelRecord): string {
    const o = channel.ownerId;
    if (!o) return '—';
    return o.nickname || o.email || o._id || '—';
}

function formatCreatedAt(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '—';
    }
}

export default function Channels() {
    const navigate = useNavigate();
    const [channels, setChannels] = useState<ChannelRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sorted = useMemo(
        () =>
            [...channels].sort((a, b) => {
                const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tb - ta;
            }),
        [channels],
    );

    useEffect(() => {
        void fetchChannels();
    }, []);

    const fetchChannels = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await channelService.getAllChannels();
            setChannels(data);
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message || 'Failed to load channels');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary/80">Directory</p>
                    <h1 className="mb-2 text-3xl font-black uppercase tracking-tighter text-white">Channel management</h1>
                    <p className="max-w-xl text-sm text-text-muted">
                        Overview of all user-created channels. Select a row to open details.
                    </p>
                </div>
                <Button onClick={() => void fetchChannels()} variant="outline" className="shrink-0 gap-2 border-white/10" disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0d10] shadow-[0_0_0_1px_rgba(0,255,136,0.03),0_24px_48px_-24px_rgba(0,0,0,0.65)]">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[880px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                    {['Channel', 'Status', 'Description', 'Owner', 'Subscribers', 'Created', ''].map((h) => (
                                        <th key={h || 'a'} className="px-4 py-3.5">
                                            <div className="h-2.5 w-16 max-w-full rounded bg-white/[0.08] animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.04]">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.06] animate-pulse" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <div className="h-3 w-32 rounded bg-white/[0.08] animate-pulse" />
                                                    <div className="h-2 w-20 rounded bg-white/[0.05] animate-pulse" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-6 w-16 rounded-md bg-white/[0.06] animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-3 w-full max-w-[200px] rounded bg-white/[0.06] animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-3 w-28 rounded bg-white/[0.06] animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="ml-auto h-4 w-4 rounded bg-white/[0.06] animate-pulse" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
                            <Tv2 className="h-8 w-8 text-white/25" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">No channels yet</h3>
                        <p className="mt-2 max-w-sm text-sm text-text-muted">
                            No channels have been created by users yet. They will appear in this table once created.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                                    <th className="px-4 py-3.5 pl-5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Channel</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Status</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Description</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Owner</th>
                                    <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Subscribers</th>
                                    <th className="px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Created</th>
                                    <th className="w-10 px-2 py-3.5" aria-hidden />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.05]">
                                {sorted.map((channel) => (
                                    <tr
                                        key={channel._id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/channel/${channel._id}/detail`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                navigate(`/channel/${channel._id}/detail`);
                                            }
                                        }}
                                        className="group cursor-pointer transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                                    >
                                        <td className="px-4 py-3.5 pl-5 align-middle">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] ring-1 ring-white/[0.04] transition-[border-color,box-shadow] group-hover:border-primary/25 group-hover:shadow-[0_0_20px_rgba(0,255,136,0.12)]">
                                                    {channel.avatarUrl ? (
                                                        <img src={channel.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Hash className="h-4 w-4 text-white/35" strokeWidth={2} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-white group-hover:text-primary/95">{channel.name}</p>
                                                    <p className="truncate font-mono text-[10px] text-white/25">{channel._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                                                    channel.isActive
                                                        ? 'border-primary/25 bg-primary/10 text-primary shadow-[0_0_12px_rgba(0,255,136,0.12)]'
                                                        : 'border-white/10 bg-white/[0.04] text-white/40',
                                                )}
                                            >
                                                {channel.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="max-w-[280px] px-4 py-3.5 align-middle text-white/50">
                                            <p className="line-clamp-2 text-xs leading-relaxed">
                                                {channel.description?.trim() || (
                                                    <span className="italic text-white/25">No description</span>
                                                )}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                            <span className="text-xs font-semibold text-white/70">{ownerLabel(channel)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle text-right">
                                            <span className="inline-flex items-center justify-end gap-1.5 tabular-nums text-xs font-bold text-white/80">
                                                <Users className="h-3.5 w-3.5 text-white/30" aria-hidden />
                                                {(channel.subscriberCount ?? 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                            <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-white/45">
                                                <Calendar className="h-3.5 w-3.5 shrink-0 text-white/25" aria-hidden />
                                                {formatCreatedAt(channel.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3.5 align-middle text-white/20 transition-colors group-hover:text-primary/80">
                                            <ChevronRight className="mx-auto h-4 w-4" aria-hidden />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && sorted.length > 0 && (
                    <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-5 py-3 text-[11px] text-white/35">
                        <span>
                            <span className="font-bold text-white/55">{sorted.length}</span> channel{sorted.length === 1 ? '' : 's'}
                        </span>
                        <span className="hidden sm:inline">Sorted by newest first</span>
                    </div>
                )}
            </div>
        </div>
    );
}

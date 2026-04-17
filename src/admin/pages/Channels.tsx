import { useEffect, useState } from 'react';
import { Hash, Users, RefreshCw, Tv2, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { channelService, type ChannelRecord } from '../../services/channel.service';

export default function Channels() {
    const [channels, setChannels] = useState<ChannelRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchChannels();
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Channel Management</h1>
                    <p className="text-text-muted">Overview of all user-created channels on the platform.</p>
                </div>
                <Button onClick={fetchChannels} variant="outline" className="gap-2 border-white/10" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-44 rounded-xl bg-white/[0.03] border border-white/5" />
                    ))}
                </div>
            ) : channels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/5 mb-4">
                        <Tv2 className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">No channels yet</h3>
                    <p className="text-sm text-text-muted max-w-xs mt-2">No channels have been created by users yet. They will appear here once created.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {channels.map((channel) => (
                        <div key={channel._id} className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-lg text-white group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    {channel.avatarUrl ? (
                                        <img src={channel.avatarUrl} alt={channel.name} className="w-6 h-6 rounded-full object-cover" />
                                    ) : (
                                        <Hash className="w-6 h-6" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${channel.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                                    {channel.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 truncate">{channel.name}</h3>

                            {channel.description && (
                                <p className="text-xs text-text-muted line-clamp-2 mb-3">{channel.description}</p>
                            )}

                            <div className="text-xs text-text-muted mb-4">
                                Owner: <span className="text-white/60 font-semibold">
                                    {typeof channel.ownerId === 'object'
                                        ? (channel.ownerId.nickname || channel.ownerId.email || channel.ownerId._id)
                                        : (channel.ownerId || 'N/A')}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-text-muted pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {(channel.subscriberCount ?? 0).toLocaleString()} subscribers
                                </div>
                                {channel.createdAt && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(channel.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

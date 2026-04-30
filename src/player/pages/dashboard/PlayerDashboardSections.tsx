import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Globe, Monitor, Search, Smartphone, Swords, X } from 'lucide-react';
import type { FriendItem, FriendStatus } from '../../../services/friendshipPresence.service';

export interface OnlinePlayer {
    id: string;
    name: string;
    avatar: string;
    rank: string;
    rankEmoji: string;
    status: 'online' | 'in-game' | 'in-queue' | 'away' | 'offline';
    game?: string;
    details?: string;
    elo: number;
    region?: string;
}

export function OnlinePanel({ players, onOpenFriends }: { players: OnlinePlayer[]; onOpenFriends: () => void }) {
    const [filter, setFilter] = useState<'all' | 'in-game' | 'online' | 'offline'>('all');
    const [search, setSearch] = useState('');

    const inGameCount = players.filter((p) => p.status === 'in-game').length;
    const onlineCount = players.filter((p) => p.status !== 'offline').length;

    const visible = players.filter((p) => {
        const matchFilter =
            filter === 'all' ||
            p.status === filter ||
            (filter === 'online' && (p.status === 'online' || p.status === 'in-queue' || p.status === 'away'));
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const regionFlag: Record<string, string> = { EU: '🇪🇺', NA: '🇺🇸', AS: '🌏', AF: '🌍' };

    return (
        <div className="w-72 shrink-0 flex flex-col gap-3 h-full overflow-hidden hidden xl:flex">
            <div className="bg-[#080b10]/90 border border-white/10 rounded-[24px] flex-1 flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <div className="p-4 border-b border-white/10 space-y-4">
                    <button type="button" onClick={onOpenFriends} className="flex w-full items-center justify-between rounded-lg transition-colors hover:bg-white/[0.04] px-1 py-0.5" title="Open friends">
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-[#00ff87]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">OPERATORS</span>
                        </div>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,255,0,0.08)', color: '#00ff00', border: '1px solid rgba(0,255,0,0.15)' }}>
                            {inGameCount} live · {onlineCount} online
                        </span>
                    </button>

                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ENCRYPTED_ID..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-[#00ff87]/25 transition-all"
                        />
                    </div>

                    <div className="flex gap-1">
                        {(['all', 'in-game', 'online', 'offline'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                                style={{
                                    background: filter === f ? (f === 'in-game' ? 'rgba(168,85,247,0.2)' : 'rgba(0,255,0,0.12)') : 'rgba(255,255,255,0.03)',
                                    color: filter === f ? (f === 'in-game' ? '#a855f7' : '#00ff00') : 'rgba(255,255,255,0.25)',
                                    border: filter === f ? (f === 'in-game' ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(0,255,0,0.2)') : '1px solid transparent',
                                }}
                            >
                                {f === 'all' ? 'All' : f === 'in-game' ? '🎮' : '●'}
                                {f === 'all' ? '' : f === 'in-game' ? ' Game' : ' Online'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {visible.length === 0 ? (
                        <button type="button" onClick={onOpenFriends} className="flex w-full flex-col items-center justify-center py-10 gap-2 transition-colors hover:text-white/45" style={{ color: 'rgba(255,255,255,0.2)' }} title="Open friends">
                            <Search size={20} />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No players found</p>
                        </button>
                    ) : visible.map((p, i) => (
                        <div
                            key={p.id}
                            className="flex items-center gap-2.5 px-4 py-2.5 transition-colors cursor-pointer group"
                            style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`} className="w-full h-full bg-black" alt={p.name} />
                                </div>
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black"
                                    style={{
                                        background: p.status === 'in-game' ? '#a855f7' : '#00ff00',
                                        boxShadow: p.status === 'in-game' ? '0 0 5px rgba(168,85,247,0.8)' : '0 0 5px rgba(0,255,0,0.8)',
                                    }}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-[11px] font-black text-white truncate group-hover:text-primary transition-colors" style={{ '--tw-text-opacity': 1 } as React.CSSProperties}>
                                        {p.name}
                                    </span>
                                    <span className="text-[9px] shrink-0">{regionFlag[p.region ?? 'EU']}</span>
                                </div>
                                <div
                                    className="text-[9px] font-bold truncate"
                                    style={{
                                        color: p.status === 'in-game' ? 'rgba(168,85,247,0.8)' : p.status === 'offline' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.35)',
                                    }}
                                >
                                    {presenceLine(p)}
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-white/10 italic">#{p.elo}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function mapPresenceStatusToUi(status: FriendStatus): OnlinePlayer['status'] {
    if (status === 'in_game') return 'in-game';
    if (status === 'in_queue') return 'in-queue';
    return status;
}

export function rankEmojiFor(rankText: string): string {
    const value = rankText.toLowerCase();
    if (value.includes('immortal')) return '💀';
    if (value.includes('diamond')) return '💎';
    if (value.includes('platinum')) return '🏆';
    if (value.includes('gold')) return '⚡';
    return '🥈';
}

export function mapFriendToOnlinePlayer(
    friend: FriendItem,
    playerProfilesByUser: Record<string, { elo: number; rank: string }>,
): OnlinePlayer {
    const profile = playerProfilesByUser[friend.userId];
    const rank = profile?.rank || 'Unranked';
    return {
        id: friend.userId,
        name: friend.nickname || 'Player',
        avatar: friend.avatar || friend.nickname || friend.userId.slice(-6),
        rank,
        rankEmoji: rankEmojiFor(rank),
        status: mapPresenceStatusToUi(friend.status),
        game: friend.game,
        details: friend.details,
        elo: profile?.elo ?? 0,
    };
}

export function statusPriority(status: OnlinePlayer['status']): number {
    switch (status) {
        case 'in-game': return 0;
        case 'in-queue': return 1;
        case 'online': return 2;
        case 'away': return 3;
        case 'offline': return 4;
        default: return 5;
    }
}

export function presenceLine(player: OnlinePlayer): string {
    if (player.status === 'in-game') return `🎮 ${player.game || 'In game'}`;
    if (player.status === 'in-queue') return `⏳ ${player.details || 'In queue'}`;
    if (player.status === 'away') return `🌙 ${player.details || 'Away'}`;
    if (player.status === 'offline') return '○ Offline';
    return `${player.rankEmoji} ${player.rank}`;
}

export function HudStat({ icon, label, value, sub, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub: string;
    color: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-[14px] border border-white/10 p-3.5 group hover:border-white/20 transition-all duration-200 bg-[#080b10]/90 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="absolute left-0 right-0 top-0 h-[1px] opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: color, transform: 'translate(30%, -30%)' }} />
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/25">{label}</span>
            </div>
            <div className="text-4xl font-black text-white leading-none mb-1 tracking-tight" style={{ textShadow: `0 0 20px ${color}30` }}>{value}</div>
            <div className="text-[9px] font-bold text-white/35 uppercase tracking-wide">{sub}</div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        </div>
    );
}

export function AppRequiredModal({ type, onClose }: { type: 'match' | 'scrims'; onClose: () => void }) {
    const isScrims = type === 'scrims';
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
            <div className="relative w-full max-w-lg bg-[#060606] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '40px' }} />
                <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-all"><X size={24} /></button>
                <div className="p-12 text-center space-y-8">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-[32px] bg-[#00ff87]/5 border border-[#00ff87]/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,135,0.1)]">
                            {isScrims ? <Clock size={40} className="text-[#00ff87]" /> : <Swords size={40} className="text-[#00ff87]" />}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic">Protocol Upgrade Required</p>
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{isScrims ? 'SCRIM_V2 ACCESS' : 'MATCHMAKING_v4'}</h2>
                        <p className="text-sm text-white/30 font-bold uppercase tracking-widest leading-relaxed">
                            {isScrims
                                ? 'Advanced team coordination and competitive planning are restricted to the ArenaChain native desktop and mobile environments.'
                                : 'Low-latency real-time matchmaking requires a direct neural link via the ArenaChain mobile or desktop application.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pb-4">
                        <AppCard icon={<Smartphone size={24} />} title="MOBILE" desc="iOS / ANDROID" />
                        <AppCard icon={<Monitor size={24} />} title="DESKTOP" desc="WIN / MACOS" />
                    </div>
                    <button onClick={onClose} className="w-full h-20 bg-white/5 border border-white/10 rounded-3xl font-black italic uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all text-white/40 hover:text-white">
                        REVERT_TO_DASHBOARD
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function AppCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4 group hover:border-[#00ff87]/30 transition-all cursor-pointer">
            <div className="text-white/20 group-hover:text-[#00ff87] transition-colors">{icon}</div>
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white group-hover:text-white transition-all italic">{title}</p>
                <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest">{desc}</p>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ShieldCheck,
    Ticket as TicketIcon,
    Trophy
} from 'lucide-react';
import { Button } from '../../components/ui/core';
import ticketService from '../../services/ticketService';
import type { Ticket } from '../../models/ticket';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

export default function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refreshProfile().catch(() => undefined);
    }, [refreshProfile]);

    useEffect(() => {
        const fetchTicket = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await ticketService.getTicketById(id);
                setTicket(data);
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-[#00FF00] animate-spin" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-6 text-center text-zinc-300">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Ticket Not Found</h2>
                <p className="text-zinc-500 mb-6">No ticket data found for this identifier.</p>
                <Button onClick={() => navigate('/player/tickets')}>Back to My Tickets</Button>
            </div>
        );
    }

    const league = typeof ticket.league === 'string' ? null : ticket.league;
    const ticketUser = (typeof ticket.user === 'object' && ticket.user !== null ? ticket.user : null) as Record<string, any> | null;
    const holderName = String(
        user?.nickname ||
        ticketUser?.nickname ||
        ticketUser?.username ||
        'PLAYER'
    ).toUpperCase();
    const holderAvatarRaw =
        (typeof league?.logoUrl === 'string' ? league.logoUrl : '') ||
        user?.avatar ||
        (typeof ticketUser?.avatar === 'string' ? ticketUser.avatar : '');
    const holderAvatar = holderAvatarRaw ? resolveBackendAssetUrl(holderAvatarRaw) : '';
    const passType = (ticket.category || ticket.type || 'STANDARD').toUpperCase().replace(/\s+/g, '_');
    const shortId = ticket.ticketNumber || `#${ticket._id.slice(-8).toUpperCase()}`;
    const eventDate = league?.startDate ? new Date(league.startDate) : new Date(ticket.purchaseDate || ticket.createdAt);
    const eventDateLabel = eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const section = ticket.metadata?.section ? String(ticket.metadata.section).toUpperCase() : 'N/A';
    const location = (league?.regionId || 'ALPHA_SECTOR').toUpperCase().replace(/\s+/g, '_');
    const leagueName = (league?.name || 'LEAGUE').toUpperCase();

    const qrRawValue =
        typeof ticket.qrCode === 'string' && ticket.qrCode.trim().length > 0
            ? ticket.qrCode
            : '';
    const isQrImage =
        qrRawValue.startsWith('data:image') ||
        qrRawValue.startsWith('http://') ||
        qrRawValue.startsWith('https://');
    const fallbackQrPayload = JSON.stringify({
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        type: ticket.type,
        category: ticket.category,
        status: ticket.status,
        leagueId: typeof ticket.league === 'string' ? ticket.league : ticket.league?._id,
    });

    return (
        <div className="relative w-full rounded-3xl border border-white/5 bg-[#0b0d10]/70 p-4 sm:p-6 md:p-10">
            <div className="absolute -top-28 -left-16 w-72 h-72 bg-[#00FF00]/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-28 -right-16 w-80 h-80 bg-cyan-400/10 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background:radial-gradient(circle_at_20%_20%,rgba(0,255,0,0.16),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.12),transparent_35%)]" />
            <div className="relative mx-auto w-full max-w-md overflow-visible bg-zinc-900/40 backdrop-blur-xl border border-[#00FF00]/30 rounded-[2rem] shadow-[0_0_50px_rgba(0,255,0,0.1)] group hover:border-[#00FF00]/60 transition-all duration-500">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00FF00]/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00FF00]/10 blur-[100px] rounded-full" />

                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                            <h2 className="text-[#00FF00] text-[10px] font-black uppercase tracking-[0.3em]">Official Access</h2>
                            <div className="flex items-center gap-2">
                                <Trophy size={16} className="text-white" />
                                <span className="text-white font-black italic text-xl tracking-tighter uppercase">{leagueName}</span>
                            </div>
                        </div>
                        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-2 rounded-xl">
                            <TicketIcon className="text-[#00FF00]" size={20} />
                        </div>
                    </div>

                    <div className="relative aspect-square w-full mb-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                        {holderAvatar ? (
                            <img
                                src={holderAvatar}
                                alt={holderName}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00FF00]/20 to-transparent flex items-center justify-center">
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{holderName}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-white italic leading-none uppercase tracking-tighter">
                            E-SPORTS <br />
                            <span className="text-[#00FF00]">CHAMPIONSHIP</span>
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{eventDateLabel}</p>
                    </div>
                </div>

                <div className="relative h-px w-full my-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-[#050505] rounded-full border border-zinc-800" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-[#050505] rounded-full border border-zinc-800" />
                    <div className="w-full h-full border-t border-dashed border-zinc-800" />
                </div>

                <div className="p-6 pt-4 md:p-8 md:pt-4">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-4">
                        {/* Stub body — gate info + meta */}
                        <div className="flex min-h-0 flex-1 flex-col justify-between sm:pr-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-zinc-500">Gate Node</p>
                                    <p className="text-sm font-black italic text-white">{location}</p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-zinc-800">
                                            <ShieldCheck size={14} className="text-[#00FF00]" />
                                        </div>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 bg-zinc-800">
                                            <span className="text-[8px] font-black text-white">V1</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black italic uppercase text-[#00FF00]">{passType}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[8px] font-bold uppercase tracking-widest text-zinc-700 sm:mt-8">
                                <span className="break-all">ID: {shortId}</span>
                                <span className="shrink-0">Auth: 0x9f...ff88</span>
                            </div>
                        </div>

                        {/* QR rail — edge of ticket, larger target for scanners */}
                        <div className="flex w-full shrink-0 flex-col items-center justify-center gap-2 border-t border-zinc-800/80 pt-6 sm:w-auto sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 sm:hidden">
                                Scan
                            </p>
                            <div className="box-border rounded-2xl bg-white p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] ring-2 ring-white/30 sm:p-3">
                                {isQrImage ? (
                                    <img
                                        src={qrRawValue}
                                        alt={`QR ${ticket.ticketNumber}`}
                                        className="mx-auto block aspect-square w-[7.5rem] object-contain"
                                    />
                                ) : (
                                    <QRCodeSVG
                                        value={qrRawValue || fallbackQrPayload}
                                        size={120}
                                        className="mx-auto block text-black"
                                    />
                                )}
                            </div>
                            <p className="max-w-[11rem] text-center text-[8px] font-bold uppercase leading-snug tracking-widest text-zinc-600">
                                Present this side to scan
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

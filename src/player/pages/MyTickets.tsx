import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Ticket as TicketIcon, Calendar, ArrowRight, Download, Share2 } from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import ticketService from '../../services/ticketService';
import type { Ticket } from '../../models/ticket';
import { placeholderImage } from '../../lib/placeholderImage';

export default function MyTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await ticketService.getMyTickets();
            setTickets(data);
        } catch (err: unknown) {
            console.error('Failed to fetch tickets:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">My Tickets</h1>
                    <p className="text-text-muted">Manage your upcoming event tickets and bookings</p>
                </div>
                {/* Stats or Filter could go here */}
                <div className="flex gap-4">
                    <div className="bg-surface border border-white/10 px-4 py-2 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-primary">{tickets.length}</span>
                        <span className="text-xs text-text-muted uppercase font-bold">Total Tickets</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                    {error}
                </div>
            )}

            {tickets.length === 0 && !error ? (
                <div className="text-center py-20 bg-surface border border-white/5 rounded-2xl border-dashed">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TicketIcon className="w-10 h-10 text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Tickets Yet</h3>
                    <p className="text-text-muted max-w-md mx-auto mb-8">
                        You haven't booked any tickets yet. Explore upcoming tournaments to find events to attend.
                    </p>
                    <Button onClick={() => window.location.href = '/player/tournaments'}>
                        Browse Tournaments
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tickets.map((ticket) => (
                        <TicketCard key={ticket._id} ticket={ticket} />
                    ))}
                </div>
            )}
        </div>
    );
}

import { motion } from 'framer-motion';

function TicketCard({ ticket }: { ticket: Ticket }) {
    const isNFT = ticket.type.toUpperCase() === 'VIP NFT' || !!ticket.nftTokenId;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VALID': return 'success';
            case 'USED': return 'secondary';
            case 'CANCELLED': return 'danger';
            case 'EXPIRED': return 'warning';
            default: return 'primary';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "group relative bg-surface border rounded-2xl overflow-hidden transition-all duration-500",
                isNFT ? "border-primary/50 shadow-[0_0_20px_rgba(0,255,0,0.1)]" : "border-white/10 hover:border-primary/30"
            )}
        >
            {/* Holographic Shimmer for NFT */}
            {isNFT && (
                <motion.div 
                    animate={{ 
                        background: [
                            'linear-gradient(120deg, transparent 0%, rgba(0,255,0,0.05) 50%, transparent 100%)',
                            'linear-gradient(120deg, transparent 100%, rgba(0,255,0,0.05) 50%, transparent 0%)'
                        ],
                        x: ['-100%', '100%']
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 z-0 pointer-events-none"
                />
            )}

            {/* Ticket "Rip" Effect CSS */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full z-10 border-r border-white/10"></div>
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full z-10 border-l border-white/10"></div>

            <div className="flex flex-col md:flex-row h-full relative z-1">
                {/* Left Section: Info */}
                <div className="flex-1 p-6 md:pr-12 flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-2">
                                <Badge variant={getStatusColor(ticket.status) as any} className="uppercase tracking-wider text-[10px]">
                                    {ticket.status}
                                </Badge>
                                {isNFT && (
                                    <Badge variant="primary" className="bg-primary text-black border-none font-black text-[10px]">
                                        NFT VIP
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs font-mono text-white/30 truncate max-w-[100px]">
                                #{ticket.ticketNumber.split('-')[1]}
                            </span>
                        </div>

                        <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                            {typeof ticket.tournament === 'object' ? ticket.tournament?.name : 'Tournament Name'}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="space-y-1">
                                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Date</span>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-3 h-3 text-primary" />
                                    <span>{typeof ticket.tournament === 'object' && ticket.tournament?.startDate ? new Date(ticket.tournament.startDate).toLocaleDateString() : 'TBD'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Tier</span>
                                <div className="flex items-center gap-2 text-sm">
                                    <TicketIcon className="w-3 h-3 text-primary" />
                                    <span className="font-bold">{ticket.type}</span>
                                </div>
                            </div>
                        </div>

                        {isNFT && (
                            <div className="mt-4 p-2 bg-primary/5 rounded border border-primary/20">
                                <p className="text-[9px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                                    Blockchain Verified: {ticket.blockchain || 'Polygon'} #{ticket.nftTokenId}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="text-[10px] text-text-muted font-mono uppercase">
                            LOC: ARENA-HQ-SEC-01
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-white/5" onClick={() => window.location.href = `/player/tickets/${ticket._id}`}>
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Right Section: QR Code */}
                <div className="md:w-48 bg-black/40 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col items-center justify-center relative backdrop-blur-sm">
                    <div className="hidden md:block absolute left-0 top-6 bottom-6 border-l border-dashed border-white/20"></div>

                    <div className={clsx(
                        "p-2 rounded-xl shadow-2xl mb-3 transition-transform duration-500 group-hover:scale-105",
                        isNFT ? "bg-gradient-to-br from-primary to-blue-500 p-[2px]" : "bg-white/10"
                    )}>
                        <div className="bg-white p-2 rounded-[10px]">
                            <img src={ticket.qrCode || placeholderImage(150, 150, 'QR')} alt="Ticket QR" className="w-28 h-28 object-contain" />
                        </div>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">Entry Pass</span>

                    <div className="flex gap-2 mt-4">
                        <button className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all">
                            <Download className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

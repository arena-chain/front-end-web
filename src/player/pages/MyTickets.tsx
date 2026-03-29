import { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Calendar, ArrowRight, Download, Share2 } from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import ticketService from '../../services/ticketService';
import type { Ticket } from '../../models/ticket';

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
        } catch (err: any) {
            console.error('Failed to fetch tickets:', err);
            setError(err.message || 'Failed to load tickets');
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

function TicketCard({ ticket }: { ticket: Ticket }) {
    // Determine status color
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
        <div className="group relative bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
            {/* Ticket "Rip" Effect CSS */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full z-10"></div>
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full z-10"></div>

            <div className="flex flex-col md:flex-row h-full">
                {/* Left Section: Info */}
                <div className="flex-1 p-6 md:pr-12 flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <Badge variant={getStatusColor(ticket.status) as any} className="uppercase tracking-wider text-[10px]">
                                {ticket.status}
                            </Badge>
                            <span className="text-xs font-mono text-white/30 truncate max-w-[100px]">
                                #{ticket.ticketNumber.split('-')[1]}
                            </span>
                        </div>

                        <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                            {(ticket.tournament as any)?.name || 'Tournament Name'}
                        </h3>

                        <div className="space-y-3 mt-4">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Calendar className="w-4 h-4 text-primary opacity-70" />
                                <span>{(ticket.tournament as any)?.startDate ? new Date((ticket.tournament as any).startDate).toLocaleDateString() : 'Date TBD'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <TicketIcon className="w-4 h-4 text-primary opacity-70" />
                                <span className="font-bold">{ticket.type} Access</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="text-xs text-text-muted">
                            Purchased on {new Date(ticket.purchaseDate).toLocaleDateString()}
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-white/5">
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* Right Section: QR Code */}
                <div className="md:w-48 bg-black/40 border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col items-center justify-center relative">
                    {/* Dashed Separator for Mobile */}
                    <div className="md:hidden absolute top-0 left-6 right-6 border-t border-dashed border-white/20"></div>

                    {/* Vertical Dashed Separator for Desktop */}
                    <div className="hidden md:block absolute left-0 top-6 bottom-6 border-l border-dashed border-white/20"></div>

                    <div className="w-32 h-32 bg-white p-2 rounded-xl shadow-lg mb-3">
                        <img src={ticket.qrCode || 'https://via.placeholder.com/150'} alt="Ticket QR" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Scan for Entry</span>

                    <div className="flex gap-2 mt-4 w-full justify-center">
                        <button className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

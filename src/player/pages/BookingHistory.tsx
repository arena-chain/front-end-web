import { useState, useEffect } from 'react';
import { Search, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';
import { Input, Select, Button } from '../../components/ui/core';
import type { Ticket as TicketType } from '../../models/ticket';
import { TicketStatus } from '../../models/ticket';
import ticketService from '../../services/ticketService';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function BookingHistory() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const data = await ticketService.getMyTickets();
            setTickets(data);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.VALID: return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Valid For Entry' };
            case TicketStatus.USED: return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Already Used' };
            case TicketStatus.CANCELLED: return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Cancelled' };
            case TicketStatus.EXPIRED: return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Expired' };
            default: return { color: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10', label: status };
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const sortedTickets = [...tickets].sort((a, b) => {
        const dateA = a.tournament && typeof a.tournament !== 'string'
            ? new Date(a.tournament.startDate ?? a.createdAt).getTime()
            : new Date(a.createdAt).getTime();
        const dateB = b.tournament && typeof b.tournament !== 'string'
            ? new Date(b.tournament.startDate ?? b.createdAt).getTime()
            : new Date(b.createdAt).getTime();
        return dateB - dateA;
    });

    const filteredTickets = sortedTickets.filter(ticket => {
        const matchesStatus = filter === 'all' || ticket.status === filter;

        let tournamentName = '';
        if (ticket.tournament && typeof ticket.tournament !== 'string') {
            tournamentName = (typeof ticket.tournament !== 'string' ? ticket.tournament?.name : undefined) || '';
        }

        const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tournamentName.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1D21] to-black border border-white/10 p-8 md:p-12">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">
                                My Tickets
                            </h1>
                            <p className="text-text-muted max-w-xl text-lg">
                                Manage your passes, view QR codes, and access your event history.
                            </p>
                        </div>
                        <Button onClick={() => navigate('/player/market')} className="bg-primary text-background font-bold hover:bg-primary/90">
                            Book New Tickets <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 bg-surface p-4 rounded-xl border border-white/5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <Input
                            placeholder="Search by tournament or ticket ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 bg-background/50 border-white/10"
                        />
                    </div>
                    <Select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full md:w-48 bg-background/50 border-white/10"
                    >
                        <option value="all">All Tickets</option>
                        <option value={TicketStatus.VALID}>Valid / Upcoming</option>
                        <option value={TicketStatus.USED}>Past Events</option>
                        <option value={TicketStatus.CANCELLED}>Cancelled</option>
                    </Select>
                </div>

                {/* Tickets List */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-56 bg-surface border border-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredTickets.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredTickets.map((ticket) => {
                            const tournament = typeof ticket.tournament === 'string' ? null : ticket.tournament;
                            const status = getStatusConfig(ticket.status);

                            return (
                                <div
                                    key={ticket._id}
                                    onClick={() => navigate(`/player/tickets/${ticket._id}`)}
                                    className="group relative bg-[#1A1D21] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(0,255,136,0.3)] flex flex-col md:flex-row"
                                >
                                    {/* Left: QR Code Section */}
                                    <div className="md:w-48 bg-black/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="bg-white p-3 rounded-xl shadow-lg relative z-10 transform group-hover:scale-105 transition-transform duration-300">
                                            <QRCodeSVG
                                                value={ticket.ticketNumber}
                                                size={100}
                                                level="M"
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-text-muted mt-3 tracking-widest opacity-70">SCAN ME</span>
                                    </div>

                                    {/* Right: Details Section */}
                                    <div className="flex-1 p-6 flex flex-col justify-between relative">
                                        {/* Background Banner Blur */}
                                        {tournament?.bannerImageUrl && (
                                            <div
                                                className="absolute inset-0 opacity-[0.05] bg-cover bg-center pointer-events-none filter blur-sm group-hover:opacity-[0.08] transition-opacity"
                                                style={{ backgroundImage: `url(${tournament.bannerImageUrl})` }}
                                            />
                                        )}

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${status.bg} ${status.border} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                <span className="text-white font-bold">{formatPrice(ticket.price)}</span>
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                                {tournament?.name || 'Tournament Name'}
                                            </h3>
                                            <p className="text-sm text-text-muted mb-4 line-clamp-1">
                                                {ticket.ticketNumber} • {ticket.type} Ticket
                                            </p>

                                            <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{tournament ? formatDate(tournament.startDate) : 'Date TBD'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-surface/30 border border-white/5 rounded-3xl">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-text-muted opacity-50" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No Tickets Found</h3>
                        <p className="text-text-muted mb-8 max-w-sm mx-auto">
                            {searchQuery || filter !== 'all'
                                ? 'Try adjusting your filters to find your tickets.'
                                : 'You haven\'t booked any tickets yet. Browse the marketplace to find an event!'}
                        </p>
                        {filter === 'all' && !searchQuery && (
                            <Button size="lg" onClick={() => navigate('/player/market')}>
                                Browse Ticket Marketplace
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

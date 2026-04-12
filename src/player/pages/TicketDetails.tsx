import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, MapPin, User, Shield } from 'lucide-react';
import { Button } from '../../components/ui/core';
import type { Ticket } from '../../models/ticket';
import ticketService from '../../services/ticketService';
import { QRCodeSVG } from 'qrcode.react';

export default function TicketDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchTicket(id);
        }
    }, [id]);

    const fetchTicket = async (ticketId: string) => {
        setLoading(true);
        try {
            const data = await ticketService.getTicketById(ticketId);
            setTicket(data);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        // Implement download ticket as image
        console.log('Downloading ticket...');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-white text-lg">Loading ticket...</div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ticket Not Found</h2>
                    <Button onClick={() => navigate('/player/tickets')}>
                        Back to My Tickets
                    </Button>
                </div>
            </div>
        );
    }

    const tournament = typeof ticket.tournament === 'string' ? null : ticket.tournament;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VALID': return 'text-green-400 border-green-400/30 bg-green-400/10';
            case 'USED': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case 'CANCELLED': return 'text-red-400 border-red-400/30 bg-red-400/10';
            case 'EXPIRED': return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
            default: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const isVIP = ticket.type.toLowerCase().includes('vip');

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/player/tickets')}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                            Ticket Details
                        </h1>
                        <p className="text-text-muted">Ticket #{ticket.ticketNumber}</p>
                    </div>
                </div>

                {/* Main Ticket Card */}
                <div className="relative">
                    {/* Background Glow */}
                    <div className={`absolute inset-0 ${isVIP ? 'bg-[#FFD700]/10' : 'bg-primary/10'} blur-3xl -z-10`} />

                    <div className={`relative bg-gradient-to-br from-[#1A1D21] via-[#1A1D21] to-[#1A1D21]/80 border-2 rounded-3xl overflow-hidden ${isVIP ? 'border-[#FFD700]/30' : 'border-primary/30'
                        }`}>
                        {/* Top Section: Decorative Pattern */}
                        <div className="relative h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                                backgroundSize: '32px 32px'
                            }} />

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <div className={`px-4 py-2 rounded-full border-2 text-sm font-bold uppercase ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* QR Code Section */}
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* QR Code */}
                                <div className={`flex-shrink-0 p-6 bg-white rounded-2xl border-4 ${isVIP ? 'border-[#FFD700]/50' : 'border-primary/50'
                                    } shadow-2xl relative`}>
                                    {isVIP && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#FFD700] text-black text-xs font-black uppercase rounded-full">
                                            VIP
                                        </div>
                                    )}
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <QRCodeSVG
                                            value={ticket.ticketNumber}
                                            size={192}
                                            level="M"
                                        />
                                    </div>
                                </div>

                                {/* Event Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2">
                                            {tournament?.name || 'Tournament Name'}
                                        </h2>
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isVIP
                                            ? 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10'
                                            : 'text-primary border-primary/30 bg-primary/10'
                                            }`}>
                                            <Shield className="w-4 h-4" />
                                            <span className="font-bold">{ticket.type} Ticket</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-text-muted">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            <span>{tournament ? formatDate(tournament.startDate) : 'Date TBD'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-text-muted">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <span>Arena Championship Venue</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-text-muted">
                                            <User className="w-5 h-5 text-primary" />
                                            <span>1 Person</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-white">{formatPrice(ticket.price)}</span>
                                            <span className="text-text-muted">per person</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* VIP Perks */}
                            {ticket.perks && (
                                <div className="p-6 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-2xl">
                                    <h3 className="text-lg font-bold text-[#FFD700] mb-3 flex items-center gap-2">
                                        ✨ VIP Perks Included
                                    </h3>
                                    <p className="text-white">{ticket.perks}</p>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-text-muted mb-1">Purchase Date</p>
                                    <p className="text-sm font-bold text-white">
                                        {new Date(ticket.purchaseDate).toLocaleDateString()}
                                    </p>
                                </div>
                                {ticket.usedAt && (
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Used At</p>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(ticket.usedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {ticket.expiresAt && (
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">Expires</p>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(ticket.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button onClick={handleDownload} className="flex-1 gap-2">
                                    <Download className="w-4 h-4" />
                                    Download Ticket
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Notice */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2">Important Information</h3>
                    <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                        <li>Present this QR code at the venue entrance for scanning</li>
                        <li>Each ticket is valid for one person only</li>
                        <li>Please arrive 30 minutes before the event starts</li>
                        <li>No refunds or exchanges after purchase</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

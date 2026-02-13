import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Trophy, Shield, Check, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/core';
import tournamentService from '../../services/tournamentService';
import ticketService from '../../services/ticketService';
import type { Tournament, TicketType } from '../../models/tournament';

export default function TicketBooking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTournament();
        }
    }, [id]);

    const fetchTournament = async () => {
        try {
            const data = await tournamentService.fetchTournamentById(id!);
            setTournament(data);
            if (data.ticketTypes && data.ticketTypes.length > 0) {
                setSelectedTicket(data.ticketTypes[0]);
            }
        } catch (error) {
            console.error('Failed to fetch tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedTicket || !tournament) return;

        setBookingLoading(true);
        try {
            await ticketService.bookTicket(tournament._id, selectedTicket.name, quantity);
            // Navigate to My Tickets on success
            navigate('/player/my-tickets');
        } catch (error: any) {
            alert(`Booking failed: ${error.message}`);
        } finally {
            setBookingLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!selectedTicket) return 0;

        // Check for bundle pricing
        if (selectedTicket.bundles) {
            const bundle = selectedTicket.bundles.find(b => b.quantity === quantity);
            if (bundle) return bundle.price;
        }

        return selectedTicket.price * quantity;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-4">
                <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
                <Button onClick={() => navigate('/player/tournaments')}>Back to Tournaments</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white pb-20">
            {/* Header */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={tournament.bannerImageUrl || 'https://via.placeholder.com/1920x600'}
                        alt={tournament.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 w-full max-w-6xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 text-white/70 hover:text-white pl-0 hover:bg-transparent"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{tournament.name}</h1>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>Online / Venue TBD</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Ticket Selection */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Ticket className="w-6 h-6 text-primary" />
                                Select Tickets
                            </h2>

                            {!tournament.ticketTypes || tournament.ticketTypes.length === 0 ? (
                                <div className="p-8 bg-surface border border-white/10 rounded-xl text-center text-text-muted">
                                    <p>No tickets available for this tournament yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tournament.ticketTypes.map((ticket) => (
                                        <div
                                            key={ticket.name}
                                            className={`
                                                relative p-6 rounded-xl border-2 transition-all cursor-pointer hover:bg-white/5
                                                ${selectedTicket?.name === ticket.name
                                                    ? 'bg-primary/5 border-primary shadow-[0_0_20px_-5px_rgba(0,255,136,0.3)]'
                                                    : 'bg-surface border-white/10 hover:border-white/20'
                                                }
                                            `}
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className={`text-xl font-bold uppercase mb-1 ${selectedTicket?.name === ticket.name ? 'text-primary' : 'text-white'}`}>
                                                        {ticket.name} Pass
                                                    </h3>
                                                    <p className="text-sm text-text-muted mb-4 max-w-md">
                                                        Access to all matches for this ticket tier. Includes standard venue entry and seating.
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400">Entry to Venue</span>
                                                        {ticket.name === 'VIP' && (
                                                            <>
                                                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">Priority Access</span>
                                                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">Lounge Access</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-white">${ticket.price}</div>
                                                    <div className="text-xs text-text-muted">per person</div>
                                                    {selectedTicket?.name === ticket.name && (
                                                        <div className="mt-4">
                                                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center ml-auto">
                                                                <Check className="w-4 h-4 text-black" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-surface border border-white/10 rounded-xl">
                                <Shield className="w-8 h-8 text-primary mb-4" />
                                <h3 className="font-bold mb-2">Secure Ticketing</h3>
                                <p className="text-sm text-text-muted">
                                    All tickets are cryptographically secured and linked to your account.
                                    Present your QR code at the venue for entry.
                                </p>
                            </div>
                            <div className="p-6 bg-surface border border-white/10 rounded-xl">
                                <Trophy className="w-8 h-8 text-primary mb-4" />
                                <h3 className="font-bold mb-2">Exclusive Rewards</h3>
                                <p className="text-sm text-text-muted">
                                    Ticket holders may receive exclusive in-game drops and digital collectibles
                                    for attending official major tournaments.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface border border-white/10 rounded-xl p-6 sticky top-8">
                            <h3 className="text-lg font-bold uppercase mb-6 pb-4 border-b border-white/10">Order Summary</h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Tournament</span>
                                    <span className="font-medium text-right truncate max-w-[150px]">{tournament.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Ticket Type</span>
                                    <span className="font-medium">{selectedTicket?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted">Date</span>
                                    <span className="font-medium">{new Date(tournament.startDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {selectedTicket && (
                                <div className="mb-6 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium">Quantity</span>
                                        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                                            <button
                                                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white disabled:opacity-50"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                                            <button
                                                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white"
                                                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-text-muted">Total Amount</span>
                                        <span className="text-3xl font-black text-primary">${calculateTotal()}</span>
                                    </div>
                                    {selectedTicket.bundles?.some(b => b.quantity === quantity) && (
                                        <p className="text-xs text-green-400 text-right">Bundle discount applied!</p>
                                    )}
                                </div>
                            )}

                            <Button
                                className="w-full h-14 text-lg font-bold shadow-[0_0_20px_-5px_rgba(0,255,136,0.3)]"
                                disabled={!selectedTicket || bookingLoading}
                                onClick={handleBooking}
                                isLoading={bookingLoading}
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                {bookingLoading ? 'Processing...' : 'Confirm & Pay'}
                            </Button>

                            <p className="text-xs text-center text-text-muted mt-4">
                                By completing this purchase, you agree to the Arena Chain Terms of Service and Event Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

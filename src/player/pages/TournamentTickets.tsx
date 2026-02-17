import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Calendar, MapPin, Users, Ticket, Check, Star, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import type { Tournament, TicketType } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import reservationService from '../../services/reservationService';

interface TicketSelection {
    type: string;
    quantity: number;
    price: number;
}

export default function TournamentTickets() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [selections, setSelections] = useState<Record<string, TicketSelection>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTournament(id);
        }
    }, [id]);

    const fetchTournament = async (tournamentId: string) => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournamentById(tournamentId);

            // Debug logging to track ticket data
            console.log('Tournament fetched:', {
                id: data._id,
                name: data.name,
                status: data.status,
                hasTicketTypes: !!data.ticketTypes,
                ticketTypesCount: data.ticketTypes?.length || 0,
                ticketTypes: data.ticketTypes
            });

            // Check if ticket types are missing
            if (!data.ticketTypes || data.ticketTypes.length === 0) {
                console.warn('⚠️ Tournament has no ticket types configured:', {
                    tournamentId: data._id,
                    tournamentName: data.name,
                    status: data.status
                });
            }

            setTournament(data);
        } catch (error) {
            console.error('Failed to fetch tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = (ticketType: TicketType, delta: number) => {
        setSelections(prev => {
            const current = prev[ticketType.name] || { type: ticketType.name, quantity: 0, price: ticketType.price };
            const newQuantity = Math.max(0, Math.min(ticketType.capacity, current.quantity + delta));

            if (newQuantity === 0) {
                const { [ticketType.name]: _, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [ticketType.name]: { ...current, quantity: newQuantity }
            };
        });
    };

    const getTotalPrice = (): number => {
        return Object.values(selections).reduce((sum, selection) => {
            const ticketType = tournament?.ticketTypes?.find(t => t.name === selection.type);
            if (!ticketType) return sum;

            // Check for bundle discounts
            const bundle = ticketType.bundles?.find(b => b.quantity === selection.quantity);
            if (bundle) {
                return sum + bundle.price;
            }

            return sum + (selection.price * selection.quantity);
        }, 0);
    };

    const getTotalTickets = (): number => {
        return Object.values(selections).reduce((sum, selection) => sum + selection.quantity, 0);
    };

    const handleReserve = async () => {
        if (!tournament || getTotalTickets() === 0) return;

        setSubmitting(true);
        try {
            // For simplicity, create one reservation per ticket type
            const user = localStorage.getItem('userId') || 'current-user-id';

            const createdReservations = [];

            for (const selection of Object.values(selections)) {
                const res = await reservationService.createReservation({
                    tournament: tournament._id,
                    user,
                    ticketType: selection.type,
                    quantity: selection.quantity,
                });
                createdReservations.push(res);
            }

            navigate('/player/reservation-confirmation', {
                state: { tournamentId: tournament._id, reservations: createdReservations }
            });
        } catch (error) {
            console.error('Failed to create reservation:', error);
            alert('Failed to reserve tickets. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Tournament Not Found</h2>
                    <Button onClick={() => navigate('/player/tournaments')}>
                        Back to Tournaments
                    </Button>
                </div>
            </div>
        );
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const bannerUrl = tournament.bannerImageUrl?.startsWith('http')
        ? tournament.bannerImageUrl
        : `${API_URL}/${tournament.bannerImageUrl}`;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bannerUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end pb-12 px-6">
                    <div className="max-w-7xl mx-auto w-full">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/player/market')}
                            className="bg-black/30 backdrop-blur-md text-white border border-white/10 hover:bg-black/50 mb-6 w-fit"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Market
                        </Button>

                        <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
                            <div className="space-y-4 max-w-3xl animate-fade-in-up">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-primary text-black font-bold">OPEN REGISTRATION</Badge>
                                    <span className="text-primary font-bold tracking-widest uppercase">
                                        {typeof tournament.gameId === 'object' && tournament.gameId?.title
                                            ? tournament.gameId.title
                                            : 'Tournament'}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                                    {tournament.name}
                                </h1>
                                <div className="flex flex-wrap gap-6 text-sm md:text-base text-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span>{new Date(tournament.startDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <span>Championship Arena</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        <span>{tournament.maxTeams} Teams</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Ticket Selection */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <Ticket className="w-6 h-6 text-primary" />
                                Choose Your Experience
                            </h2>

                            {/* Check if tickets are configured */}
                            {!tournament.ticketTypes || tournament.ticketTypes.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-10 h-10 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Tickets Not Available</h3>
                                    <p className="text-text-muted mb-4 max-w-md mx-auto">
                                        Ticket sales have not been configured for this tournament yet.
                                        Please check back later or contact the organizer.
                                    </p>
                                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4 max-w-md mx-auto">
                                        <p className="text-sm text-orange-400">
                                            <strong>Tournament Status:</strong> {tournament.status}
                                        </p>
                                        {tournament.status !== 'OPEN_REGISTRATION' && (
                                            <p className="text-xs text-text-muted mt-2">
                                                Tickets may become available when registration opens.
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => navigate('/player/tournaments')}
                                        variant="secondary"
                                        className="mt-6"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Browse Other Tournaments
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tournament.ticketTypes.map((ticketType) => {
                                        const selection = selections[ticketType.name];
                                        const quantity = selection?.quantity || 0;
                                        const isVIP = ticketType.name.toLowerCase().includes('vip');
                                        const hasQuantity = quantity > 0;

                                        return (
                                            <div
                                                key={ticketType.name}
                                                className={`relative bg-black/20 rounded-[2rem] p-6 transition-all duration-300 border ${hasQuantity
                                                    ? isVIP
                                                        ? 'border-[#FFD700] bg-[#FFD700]/5 shadow-[0_0_30px_-10px_rgba(255,215,0,0.2)]'
                                                        : 'border-primary bg-primary/5 shadow-[0_0_30px_-10px_rgba(0,255,136,0.2)]'
                                                    : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className={`text-xl font-bold ${isVIP ? 'text-[#FFD700]' : 'text-white'}`}>
                                                                {ticketType.name}
                                                            </h3>
                                                            {isVIP && (
                                                                <div className="px-2 py-0.5 rounded bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-bold flex items-center gap-1">
                                                                    <Star className="w-3 h-3 fill-current" /> VIP
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Price Display */}
                                                        <div className="flex items-baseline gap-2 mb-4">
                                                            <span className="text-3xl font-black text-white">
                                                                ${ticketType.price}
                                                            </span>
                                                            <span className="text-text-muted text-sm">per person</span>
                                                        </div>

                                                        {/* Features / Description Placeholder */}
                                                        <div className="space-y-1 mb-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                                <Check className="w-4 h-4 text-primary" />
                                                                <span>Access to {isVIP ? 'VIP Lounge & All Areas' : 'General Stadium Seating'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                                <Check className="w-4 h-4 text-primary" />
                                                                <span>{isVIP ? 'Priority Entry & Meet n Greet' : 'Fan Zone Access'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Bundle Offers */}
                                                        {ticketType.bundles && ticketType.bundles.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Special Offers</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {ticketType.bundles.map((bundle, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-colors ${quantity === bundle.quantity
                                                                                ? 'bg-green-500/20 border-green-500 text-green-400'
                                                                                : 'bg-white/5 border-white/10 text-gray-400'
                                                                                }`}
                                                                        >
                                                                            <span className="font-bold">Buy {bundle.quantity}</span>
                                                                            <span className="opacity-50">|</span>
                                                                            <span className="font-bold text-white">${bundle.price}</span>
                                                                            {quantity === bundle.quantity && <Check className="w-3 h-3" />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex flex-row md:flex-col items-center justify-between gap-4 md:border-l border-white/10 md:pl-6">
                                                        <div className="text-right hidden md:block">
                                                            <p className="text-xs text-text-muted mb-1">Available</p>
                                                            <p className="text-lg font-bold text-white max-w-[80px] truncate text-right">{ticketType.capacity}</p>
                                                        </div>

                                                        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/10">
                                                            <button
                                                                onClick={() => updateQuantity(ticketType, -1)}
                                                                disabled={quantity === 0}
                                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
                                                            >
                                                                <Minus className="w-4 h-4 text-white" />
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-lg text-white tabular-nums">
                                                                {quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(ticketType, 1)}
                                                                disabled={quantity >= ticketType.capacity}
                                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isVIP ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black' : 'bg-primary hover:bg-primary/90 text-black'
                                                                    }`}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Summary Card (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-[#1A1D21] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
                            <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6 uppercase tracking-tight">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                Order Summary
                            </h3>

                            <div className="space-y-4 mb-6 min-h-[100px]">
                                {Object.values(selections).length > 0 ? (
                                    Object.values(selections).map((selection) => (
                                        <div key={selection.type} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                            <div>
                                                <div className="font-bold text-white text-sm">{selection.type}</div>
                                                <div className="text-xs text-text-muted">x{selection.quantity} Tickets</div>
                                            </div>
                                            <div className="font-bold text-primary">
                                                ${(selection.price * selection.quantity).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-4 opacity-50">
                                        <Ticket className="w-12 h-12 text-gray-600 mb-2" />
                                        <p className="text-sm text-text-muted">Select tickets to see summary</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-sm text-text-muted">
                                    <span>Subtotal</span>
                                    <span>${getTotalPrice()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-text-muted">
                                    <span>Fees</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-2 border-t border-white/5 mt-2">
                                    <span className="text-lg font-bold text-white">Total</span>
                                    <span className="text-3xl font-black text-primary">
                                        ${getTotalPrice().toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleReserve}
                                disabled={submitting || getTotalTickets() === 0}
                                isLoading={submitting}
                                className="w-full text-lg py-6 font-bold bg-gradient-to-r from-primary to-emerald-400 text-black border-none hover:brightness-110 shadow-lg shadow-primary/20"
                            >
                                {submitting ? 'Processing...' : 'Secure Tickets'}
                            </Button>

                            <p className="text-xs text-center text-text-muted mt-4 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 text-green-500" /> Secure SSL Encryption
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

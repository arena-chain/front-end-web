import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ShoppingCart, Trophy, Ticket, Check, AlertCircle } from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import { cn } from '../../lib/utils';
import type { Tournament, TicketType } from '../../models/tournament';
import tournamentService from '../../services/tournamentService';
import reservationService from '../../services/reservationService';
import { resolveBackendAssetUrl } from '../../lib/apiBase';

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
        window.scrollTo(0, 0);
        if (id) {
            fetchTournament(id);
        }
    }, [id]);

    const fetchTournament = async (tournamentId: string) => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournamentById(tournamentId);
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
            const user = localStorage.getItem('userId') || 'current-user';
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
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00ff88]"></div>
                    <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00ff88]/20" size={24} />
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <Trophy className="mx-auto text-white/5 mb-6" size={80} />
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Event Unavailable</h2>
                    <Button onClick={() => navigate('/player/tournaments')} variant="outline" className="border-white/10 hover:bg-white/5">
                        Back to Arena
                    </Button>
                </div>
            </div>
        );
    }

    const bannerUrl = tournament.bannerImageUrl ? resolveBackendAssetUrl(tournament.bannerImageUrl) : '';

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header / Hero */}
            <div className="relative h-[40vh] min-h-[350px] overflow-hidden">
                <div className="absolute inset-0">
                    <img src={bannerUrl} alt={tournament.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
                    <div className="absolute inset-0 bg-[#00ff88]/5 mix-blend-overlay" />
                </div>

                <div className="container mx-auto px-8 relative h-full flex flex-col justify-end pb-12">
                    <Link to={`/player/tournaments/${tournament._id}`} className="inline-flex items-center gap-2 mb-8 text-white/40 hover:text-[#00ff88] transition-colors font-black uppercase tracking-widest text-[10px]">
                        <ArrowLeft size={14} /> Back to Event
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
                        Ticket <span className="text-[#00ff88]">Nexus</span>
                    </h1>
                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Secure your presence at {tournament.name}</p>
                </div>
            </div>

            <div className="container mx-auto px-8 py-12 -mt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Ticket List */}
                    <div className="lg:col-span-2 space-y-8">
                        {!tournament.ticketTypes || tournament.ticketTypes.length === 0 ? (
                            <div className="p-16 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 text-center">
                                <AlertCircle className="mx-auto text-white/10 mb-6" size={64} />
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-white/60">Sales Not Configured</h3>
                                <p className="text-white/20 font-bold uppercase tracking-widest text-xs mt-2">Check back later for availability</p>
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
                                            className={cn(
                                                "p-8 rounded-[2.5rem] bg-[#141419] border transition-all duration-500",
                                                hasQuantity ? "border-[#00ff88] shadow-[0_0_40px_rgba(0,255,136,0.1)]" : "border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-black uppercase tracking-tight text-white">{ticketType.name}</h3>
                                                        {isVIP && <Badge className="bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20 font-black tracking-widest text-[9px]">ELITE VIP</Badge>}
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-4xl font-black text-white">${ticketType.price}</span>
                                                        <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">Single Pass</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
                                                            <Check size={14} className="text-[#00ff88]" />
                                                            Arena Access
                                                        </div>
                                                        <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
                                                            <Check size={14} className="text-[#00ff88]" />
                                                            Digital Badge
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 p-2 rounded-2xl bg-black/40 border border-white/5">
                                                    <button
                                                        onClick={() => updateQuantity(ticketType, -1)}
                                                        disabled={quantity === 0}
                                                        className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all"
                                                    >
                                                        <Minus size={20} />
                                                    </button>
                                                    <span className="w-10 text-center text-xl font-black tabular-nums">{quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(ticketType, 1)}
                                                        disabled={quantity >= ticketType.capacity}
                                                        className="w-12 h-12 rounded-xl bg-[#00ff88] text-black flex items-center justify-center hover:bg-[#00ff88]/80 transition-all font-black"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="p-8 rounded-[2.5rem] bg-[#141419] border border-white/5 sticky top-24">
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-8 flex items-center gap-3">
                                <ShoppingCart size={20} className="text-[#00ff88]" /> Cart <span className="text-white/20 opacity-50">Summary</span>
                            </h3>

                            <div className="space-y-4 mb-8">
                                {Object.values(selections).length > 0 ? (
                                    Object.values(selections).map((s) => (
                                        <div key={s.type} className="flex justify-between items-center p-4 rounded-2xl bg-black/20 border border-white/5">
                                            <div>
                                                <p className="font-black uppercase tracking-tight text-white text-sm">{s.type}</p>
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{s.quantity} Passes</p>
                                            </div>
                                            <p className="font-black text-[#00ff88]">${(s.price * s.quantity).toLocaleString()}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center space-y-3 opacity-20">
                                        <Ticket size={40} className="mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Nexus is empty</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/20">
                                    <span>Subtotal</span>
                                    <span>${getTotalPrice()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black uppercase tracking-tighter">Total Due</span>
                                    <span className="text-4xl font-black text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.2)]">
                                        ${getTotalPrice().toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleReserve}
                                disabled={submitting || getTotalTickets() === 0}
                                className="w-full mt-10 py-8 rounded-[2rem] bg-[#00ff88] text-black hover:bg-[#00ff88]/90 font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(0,255,136,0.2)] disabled:opacity-50"
                            >
                                {submitting ? 'VALIDATING...' : 'SECURE PASSES'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

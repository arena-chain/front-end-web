import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Ticket, Clock, ArrowRight, Shield } from 'lucide-react';
import { Button } from '../../components/ui/core';
import type { Reservation } from '../../models/ticket';
import reservationService from '../../services/reservationService';
import CountdownTimer from '../../components/tickets/CountdownTimer';

export default function ReservationConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        if (location.state?.reservations) {
            setReservations(location.state.reservations);
        } else if (location.state?.reservation) {
            setReservations([location.state.reservation]);
        }
    }, [location.state]);

    const totalPrice = reservations.reduce((sum, res) => sum + (res.totalPrice || 0), 0);
    const expiresAt = reservations.length > 0
        ? reservations[0].expiresAt
        : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const handleConfirmPayment = async () => {
        if (reservations.length === 0) return;
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const paymentId = 'pay_' + Math.random().toString(36).substring(7);
            await Promise.all(reservations.map(res =>
                reservationService.confirmReservation(res._id!, { paymentId })
            ));
            navigate('/player/tickets');
        } catch (error) {
            console.error('Payment failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (reservations.length === 0) return;
        if (window.confirm('Abort transaction?')) {
            setLoading(true);
            try {
                await Promise.all(reservations.map(res =>
                    reservationService.cancelReservation(res._id!)
                ));
                navigate('/player/tournaments');
            } catch (error) {
                console.error('Cancellation failed:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] py-12 px-6 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-10 animate-fade-in-up">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto border border-[#00ff88]/20 shadow-[0_0_40px_rgba(0,255,136,0.1)]">
                        <CreditCard className="w-10 h-10 text-[#00ff88]" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Secure <span className="text-[#00ff88]">Presence</span>
                        </h1>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2">
                            Review your passes and finalize registration
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Timer Card */}
                    <div className="bg-[#141419] border border-[#00ff88]/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.05)]">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <Clock className="w-10 h-10 text-[#00ff88] animate-pulse" />
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-tight text-lg">Nexus Lock Active</h3>
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Complete purchase before de-synchronization</p>
                                </div>
                            </div>
                            <div className="bg-black/40 px-8 py-3 rounded-2xl border border-white/5 shadow-inner">
                                <CountdownTimer
                                    expiresAt={expiresAt}
                                    onExpire={() => navigate('/player/tournaments')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-[#141419] border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-10 relative overflow-hidden">
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                <Ticket className="w-6 h-6 text-[#00ff88]" />
                                Your Passes
                            </h3>
                            <div className="space-y-4">
                                {reservations.map((res, i) => (
                                    <div key={i} className="space-y-4">
                                        {res.tickets.map((ticket: any, tIndex: number) => (
                                            <div key={`${i}-${tIndex}`} className="flex justify-between items-center bg-black/20 p-6 rounded-2xl border border-white/5 group hover:border-[#00ff88]/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                        <Shield size={24} className="text-white/20 group-hover:text-[#00ff88] transition-colors" />
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-black uppercase tracking-tight text-sm block">
                                                            {ticket.type || 'Standard'} Access
                                                        </span>
                                                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
                                                            Arena Fragment Pass
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-black text-white tabular-nums">
                                                    ${ticket.price}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-8 border-t border-white/5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Total Credits Required</p>
                                <p className="text-xs font-bold text-white/40">Includes automated gas fees</p>
                            </div>
                            <div className="text-5xl font-black text-[#00ff88] shadow-[0_0_40px_rgba(0,255,136,0.15)] leading-none">
                                ${totalPrice.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Button
                                className="w-full h-20 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] bg-[#00ff88] text-black hover:bg-[#00ff88]/80 border-none shadow-[0_0_50px_rgba(0,255,136,0.2)] transition-all"
                                onClick={handleConfirmPayment}
                                isLoading={loading}
                                disabled={loading}
                            >
                                <span className="flex items-center gap-3">
                                    Finalize Synchronization <ArrowRight size={20} />
                                </span>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Abort Transaction
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-[10px] text-white/10 font-black uppercase tracking-[0.3em] pt-4">
                            <Shield size={12} />
                            <span>AES-256 NEXUS SECURITY ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

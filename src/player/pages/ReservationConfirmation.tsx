import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Ticket, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/core';
import type { Reservation } from '../../models/ticket';
import reservationService from '../../services/reservationService';
import CountdownTimer from '../../components/tickets/CountdownTimer';

export default function ReservationConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Handle both single and multiple reservations
    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        if (location.state?.reservations) {
            setReservations(location.state.reservations);
        } else if (location.state?.reservation) {
            setReservations([location.state.reservation]);
        }
    }, [location.state]);

    // Calculate total price and find earliest expiration
    const totalPrice = reservations.reduce((sum, res) => sum + (res.totalPrice || 0), 0);
    const expiresAt = reservations.length > 0
        ? reservations[0].expiresAt // Assuming all created roughly same time
        : new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const handleConfirmPayment = async () => {
        if (reservations.length === 0) {
            alert('No reservations found');
            return;
        }

        setLoading(true);
        try {
            // Mock payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            const paymentId = 'pay_' + Math.random().toString(36).substring(7);

            // Confirm all reservations
            await Promise.all(reservations.map(res =>
                reservationService.confirmReservation(res._id!, { paymentId })
            ));

            navigate('/player/tickets');
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (reservations.length === 0) return;

        if (window.confirm('Are you sure you want to cancel these reservations?')) {
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

    if (reservations.length === 0 && !location.state) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto border border-white/10">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Reservation Found</h2>
                        <p className="text-text-muted mb-6">Your session may have expired or no booking was found.</p>
                    </div>
                    <Button onClick={() => navigate('/player/tournaments')}>
                        Browse Tournaments
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-6 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-8 animate-fade-in-up">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                        Confirm Your Booking
                    </h1>
                    <p className="text-text-muted">
                        Review your tickets and complete payment to secure your spots.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timer Card */}
                    <div className="md:col-span-2 bg-[#1A1D21] border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_-5px_rgba(0,255,136,0.1)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-8 h-8 text-primary animate-pulse" />
                                <div>
                                    <h3 className="text-white font-bold">Tickets Reserved</h3>
                                    <p className="text-xs text-text-muted">Complete purchase before timer expires</p>
                                </div>
                            </div>
                            <div className="bg-black/30 px-6 py-2 rounded-xl border border-white/5">
                                <CountdownTimer
                                    expiresAt={expiresAt}
                                    onExpire={() => {
                                        alert('Reservation expired');
                                        navigate('/player/tournaments');
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="md:col-span-2 bg-surface border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-primary" />
                                Reservation Details
                            </h3>

                            <div className="space-y-3 bg-black/20 rounded-xl p-4 border border-white/5">
                                {reservations.map((res, i) => (
                                    <div key={i} className="space-y-2">
                                        {res.tickets.map((ticket: any, tIndex: number) => (
                                            <div key={`${i}-${tIndex}`} className="flex justify-between items-center text-sm py-2 border-b border-white/5 last:border-0">
                                                <div>
                                                    <span className="text-white font-medium block">
                                                        {ticket.type || 'Standard'} Ticket
                                                    </span>
                                                    <span className="text-xs text-text-muted">
                                                        Tournament Pass
                                                    </span>
                                                </div>
                                                <span className="text-white font-bold font-mono">
                                                    ${ticket.price}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div>
                                <p className="text-sm text-text-muted">Total Amount</p>
                                <p className="text-xs text-text-muted">Includes all fees and taxes</p>
                            </div>
                            <div className="text-3xl font-black text-primary">
                                ${totalPrice.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-400 text-black border-none hover:brightness-110 shadow-lg shadow-primary/20"
                                onClick={handleConfirmPayment}
                                isLoading={loading}
                                disabled={loading}
                            >
                                <span className="flex items-center gap-2">
                                    Confirm Payment <ArrowRight className="w-5 h-5" />
                                </span>
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full text-text-muted hover:text-red-400 hover:bg-red-400/10"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancel Reservation
                            </Button>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-xs text-text-muted opacity-50 pt-2">
                            <CreditCard className="w-3 h-3" />
                            <span>SECURE ENCRYPTED CHECKOUT</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

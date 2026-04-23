import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    CardElement,
    Elements,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import paymentService from '../../services/paymentService';
import ticketService from '../../services/ticketService';
import { toast } from 'sonner';
import { getStripePublishableKey } from '../../lib/stripe';

const stripePromise = loadStripe(getStripePublishableKey());

type PaymentSuccessPayload = {
    paymentIntentId: string;
    paymentStatus: string;
};

const CheckoutForm = ({ amount, onPaymentSuccess }: { amount: number; onPaymentSuccess: (payload: PaymentSuccessPayload) => Promise<void> | void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setError(null);

        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                setError('Card form is not ready yet. Please wait a moment and try again.');
                setIsProcessing(false);
                return;
            }

            // 1. Create PaymentIntent
            const { clientSecret } = await paymentService.createPaymentIntent(amount);

            // 2. Confirm Payment

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (result.error) {
                setError(result.error.message || 'Payment failed');
                toast.error(result.error.message || 'Payment failed');
                setIsProcessing(false);
            } else {
                if (result.paymentIntent?.status === 'succeeded') {
                    await onPaymentSuccess({
                        paymentIntentId: result.paymentIntent.id,
                        paymentStatus: result.paymentIntent.status,
                    });
                    return;
                }

                setError(`Payment not completed (status: ${result.paymentIntent?.status || 'unknown'}).`);
                setIsProcessing(false);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            toast.error(err.message || 'An unexpected error occurred');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="p-4 bg-black/30 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-3 text-xs uppercase tracking-widest font-bold text-text-muted">
                        <span>Card Information</span>
                        <Lock size={12} className="text-primary" />
                    </div>
                    <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-lg">
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#ffffff',
                                        '::placeholder': { color: '#71717a' },
                                    },
                                    invalid: { color: '#ef4444' },
                                },
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-medium">
                        {error}
                    </div>
                )}
            </div>

            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                isLoading={isProcessing}
                className="w-full py-6 text-lg font-bold uppercase tracking-wider"
            >
                {isProcessing ? 'Processing Transaction...' : `Pay $${amount.toFixed(2)} Now`}
            </Button>
        </form>
    );
};

export default function PlayerPayment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { planId, billingCycle } = location.state || { planId: 'pro', billingCycle: 'monthly' };
    const [isProcessing, setIsProcessing] = useState(false);

        if (planId === 'elite') {
            return {
                name: 'Elite Plan',
                subtext: `${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Billing`,
                price: billingCycle === 'monthly' ? 19.99 : 199.99,
                type: 'Subscription'
            };
        }
        return {
            name: 'Arena Plus',
            subtext: `${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Billing`,
            price: billingCycle === 'monthly' ? 9.99 : 99.99,
            type: 'Subscription'
        };
    };

    const details = getDetails();
    const tax = details.price * 0.1; // 10% tax
    const total = details.price + tax;

    const handleSuccess = async ({ paymentIntentId, paymentStatus }: PaymentSuccessPayload) => {
        if (paymentStatus !== 'succeeded' || !paymentIntentId?.startsWith('pi_')) {
            toast.error('Payment validation failed. Ticket will not be created.');
            return;
        }
    const plan = getPlanDetails();
    const tax = plan.price * 0.1; // 10% tax
    const total = plan.price + tax;

        try {
            await paymentService.confirmPayment({
                paymentIntentId,
                amount: total,
                currency: 'usd',
                context: isTicket ? 'ticket' : 'subscription',
                ticketData: isTicket
                    ? {
                        tournamentId: ticketData?.tournamentId,
                        ticketName: ticketData?.ticketName,
                    }
                    : undefined,
            });
        } catch (error: any) {
            // Don't block booking if backend has no dedicated payment-record endpoint.
            console.warn('Payment record endpoint unavailable:', error?.message || error);
        }

        if (isTicket) {
            try {
                const bookedTickets = await ticketService.bookTicket(
                    ticketData.tournamentId,
                    ticketData.ticketName,
                    1,
                    paymentIntentId
                );
                toast.success('Ticket Purchased Successfully!');
                navigate('/player/my-tickets', {
                    state: { recentPurchase: Array.isArray(bookedTickets) ? bookedTickets : [bookedTickets] },
                });
            } catch (err: any) {
                toast.error(err?.message || 'Payment succeeded but booking failed.');
                console.error('Booking failed after payment success:', err);
            }
        } else {
            toast.success('Subscription Activated!');
            navigate('/player/dashboard');
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-fade-in-up">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Summary */}
                <div className="space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-text-muted hover:text-white transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>

                    <div className="bg-[#1A1D21] border border-white/5 rounded-[2rem] p-8 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div>
                            <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black mb-2 block">
                                Transaction_Summary
                            </span>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Order Summary</h2>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                {isTicket ? <Ticket size={24} /> : <ShieldCheck size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">{details.name}</h3>
                                <p className="text-sm text-text-muted">{details.subtext}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Item Price</span>
                                <span className="text-white font-medium">${details.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Processing Fee (10%)</span>
                                <span className="text-white font-medium">${tax.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                            <div className="text-xs uppercase tracking-widest text-text-muted font-bold">Total Amount</div>
                            <div className="text-4xl font-black text-primary">${total.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-4 items-start">
                        <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-text-muted leading-relaxed">
                            Your transaction is encrypted and secured by Stripe. Assets will be added to your account instantly upon validation.
                        </p>
                    </div>
                </div>

                {/* Right Column: Stripe Payment */}
                <div className="bg-[#1A1D21] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between">
                    <div>
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Secure Payment</h2>
                            <p className="text-xs text-text-muted uppercase tracking-widest">Powered by Stripe Connect</p>
                        </div>

                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                amount={total}
                                onPaymentSuccess={handleSuccess}
                            />
                        </Elements>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-6 opacity-40 grayscale">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
                        <div className="h-3 w-[1px] bg-white/20" />
                        <CreditCard size={16} className="text-white" />
                        <span className="text-[10px] font-bold text-white tracking-widest uppercase">Verified</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

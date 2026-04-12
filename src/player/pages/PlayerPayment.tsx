import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Lock, ArrowLeft } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { useState } from 'react';

export default function PlayerPayment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { planId, billingCycle } = location.state || { planId: 'pro', billingCycle: 'monthly' };
    const [isProcessing, setIsProcessing] = useState(false);

    const getPlanDetails = () => {
        if (planId === 'elite') {
            return {
                name: 'Elite Plan',
                price: billingCycle === 'monthly' ? 19.99 : 199.99,
                period: billingCycle === 'monthly' ? 'Monthly' : 'Yearly'
            };
        }
        return {
            name: 'Arena Plus',
            price: billingCycle === 'monthly' ? 9.99 : 99.99,
            period: billingCycle === 'monthly' ? 'Monthly' : 'Yearly'
        };
    };

    const plan = getPlanDetails();
    const tax = plan.price * 0.1; // 10% tax
    const total = plan.price + tax;

    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            alert('Payment Successful! Welcome to ' + plan.name);
            navigate('/player/dashboard');
        }, 2000);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center animate-fade-in-up">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Summary */}
                <div className="space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-text-muted hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Plans
                    </button>

                    <div className="bg-[#1A1D21] border border-white/5 rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Order Summary</h2>

                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                            <div>
                                <h3 className="font-bold text-white">{plan.name}</h3>
                                <p className="text-sm text-text-muted">{plan.period} Billing</p>
                            </div>
                            <span className="font-bold text-white">${plan.price.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2 text-sm text-text-muted">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${plan.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (10%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-lg font-bold text-white">Total</span>
                            <span className="text-2xl font-black text-primary">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-4 items-start">
                        <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                        <div>
                            <h4 className="font-bold text-white text-sm">Secure Payment</h4>
                            <p className="text-xs text-text-muted mt-1">
                                Your payment information is encrypted and secure. We do not store your credit card details.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Form */}
                <div className="bg-[#1A1D21] border border-white/5 rounded-3xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Payment Details</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-muted">Cardholder Name</label>
                            <Input placeholder="John Doe" className="bg-black/30 border-white/10" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-muted">Card Number</label>
                            <div className="relative">
                                <Input placeholder="0000 0000 0000 0000" className="bg-black/30 border-white/10 pl-11" />
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-muted">Expiry Date</label>
                                <Input placeholder="MM/YY" className="bg-black/30 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-muted">CVC</label>
                                <div className="relative">
                                    <Input placeholder="123" className="bg-black/30 border-white/10 pl-11" />
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-6 mt-8 text-lg font-bold uppercase tracking-wider"
                    >
                        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                    </Button>

                    <p className="text-xs text-center text-text-muted mt-4">
                        By clicking pay, you agree to our Terms of Service and Privacy Policy. You can cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
}

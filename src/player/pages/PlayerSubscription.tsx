import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { Button } from '../../components/ui/core';

export default function PlayerSubscription() {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            description: 'Essential features for casual players.',
            features: [
                'Basic matchmaking',
                'Join public tournaments',
                'Standard support',
                'Ad-supported experience'
            ],
            icon: Shield,
            color: 'text-gray-400',
            bg: 'bg-gray-400/10',
            border: 'border-white/10',
            btnVariant: 'outline'
        },
        {
            id: 'pro',
            name: 'Arena Plus',
            price: billingCycle === 'monthly' ? 9.99 : 99.99,
            description: 'Level up your game with premium features.',
            features: [
                'Priority matchmaking',
                'Exclusive tournaments',
                'Ad-free experience',
                'Advanced stats & analytics',
                'Custom profile customization'
            ],
            icon: Zap,
            color: 'text-primary',
            bg: 'bg-primary/20',
            border: 'border-primary/50',
            popular: true,
            btnVariant: 'primary'
        },
        {
            id: 'elite',
            name: 'Elite',
            price: billingCycle === 'monthly' ? 19.99 : 199.99,
            description: 'For the ultimate competitive advantage.',
            features: [
                'All Pro features',
                'Dedicated server access',
                'VIP support (24/7)',
                'Early access to new games',
                'Verified badge',
                '1 Free tournament entry/mo'
            ],
            icon: Crown,
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10',
            border: 'border-yellow-400/50',
            btnVariant: 'outline'
        }
    ];

    const handleSubscribe = (planId: string) => {
        if (planId === 'free') return;
        navigate('/player/payment', { state: { planId, billingCycle } });
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                    Choose Your <span className="text-primary">Legacy</span>
                </h1>
                <p className="text-xl text-text-muted">
                    Unlock exclusive features and take your competitive journey to the next level.
                </p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-text-muted'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-7 bg-white/10 rounded-full relative transition-colors focus:outline-none"
                    >
                        <div className={`absolute top-1 left-1 w-5 h-5 bg-primary rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
                    </button>
                    <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-white' : 'text-text-muted'}`}>
                        Yearly <span className="text-primary text-xs">(Save 20%)</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-[#1A1D21] border ${plan.border} rounded-3xl p-8 flex flex-col hover:transform hover:-translate-y-2 transition-all duration-300 ${plan.popular ? 'shadow-[0_0_40px_-10px_rgba(0,255,136,0.3)]' : ''}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-2xl ${plan.bg} flex items-center justify-center mb-6`}>
                                <Icon className={`w-6 h-6 ${plan.color}`} />
                            </div>

                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                                {plan.name}
                            </h3>
                            <p className="text-text-muted text-sm mb-6 h-10">
                                {plan.description}
                            </p>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black text-white">${plan.price}</span>
                                <span className="text-text-muted">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <div className="space-y-4 flex-1 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span className="text-sm text-gray-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={plan.btnVariant as any}
                                className="w-full py-6 text-lg font-bold uppercase tracking-wider"
                                onClick={() => handleSubscribe(plan.id)}
                            >
                                {plan.price === 0 ? 'Current Plan' : 'Get Started'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Calendar, MapPin, Users,
    ArrowLeft, ShieldCheck, Zap, Diamond, Globe,
    CheckCircle2, ChevronRight
} from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import type { LeagueEvent } from '../../models/event.model';
import { toast } from 'sonner';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<LeagueEvent | null>(null);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch
        setTimeout(() => {
            setEvent({
                _id: id || 'e1',
                leagueId: 'l1',
                name: 'Valorant Champions Tour: Grand Finals',
                description: 'Witness the crowning of the 2026 World Champion. An unforgettable night of tactical mastery and explosive plays at the heart of Berlin Arena. Featuring live performances, exclusive merchandise, and the best esports atmosphere in the world.',
                date: new Date(Date.now() + 86400000 * 5).toISOString(),
                location: 'Berlin Arena, Germany',
                isOnline: false,
                totalCapacity: 5000,
                remainingCapacity: 450,
                status: 'UPCOMING',
                bannerImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
                ticketTypes: [
                    { name: 'Standard', price: 49.99, capacity: 50 },
                    { name: 'Premium', price: 99.99, capacity: 20 },
                    { name: 'VIP NFT', price: 299.99, capacity: 10 }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            setLoading(false);
        }, 500);
    }, [id]);

    const handlePurchase = () => {
        if (!selectedTier) {
            toast.error('Please select a ticket tier');
            return;
        }
        
        toast.success(`Success! You have purchased ${quantity} ${selectedTier} ticket(s).`);
        setTimeout(() => navigate('/player/my-tickets'), 2000);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (!event) return <div>Event not found</div>;

    const selectedTicket = event.ticketTypes.find(t => t.name === selectedTier);

    return (
        <div className="pb-20 animate-fade-in">
            {/* Back Button */}
            <button 
                onClick={() => navigate('/player/events')}
                className="flex items-center gap-2 text-text-muted hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest">Back to Events</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Details */}
                <div className="lg:col-span-7 space-y-10">
                    {/* Hero Card */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={event.bannerImageUrl} alt={event.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <Badge className="mb-3 bg-primary text-black font-black">MAJOR EVENT</Badge>
                            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">{event.name}</h1>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoItem icon={<Calendar className="text-primary" />} label="Date & Time" value={new Date(event.date).toLocaleDateString() + ' • ' + new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                        <InfoItem icon={<MapPin className="text-primary" />} label="Venue" value={event.location} />
                        <InfoItem icon={<Users className="text-primary" />} label="Attendance" value={`${event.remainingCapacity} / ${event.totalCapacity} Spots left`} />
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                            <ShieldCheck className="w-5 h-5 text-primary" /> About the Event
                        </h2>
                        <p className="text-text-muted leading-relaxed text-lg">
                            {event.description}
                        </p>
                    </div>

                    {/* Perks Section (Placeholder for VIP) */}
                    {selectedTier?.includes('VIP') && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4 shadow-[0_0_30px_rgba(0,255,0,0.05)]"
                        >
                            <h3 className="text-primary font-black uppercase tracking-widest text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4" /> VIP NFT Exclusive Perks
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <PerkItem text="Commemorative NFT Artwork" />
                                <PerkItem text="Early Entry to the Arena" />
                                <PerkItem text="Meet & Greet with Finalists" />
                                <PerkItem text="Limited Edition Team Jersey" />
                            </ul>
                        </motion.div>
                    )}
                </div>

                {/* Right Column: Checkout */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24 bg-surface border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Select Tickets</h3>
                            <p className="text-text-muted text-sm">Choose your entry tier for the event</p>
                        </div>

                        {/* Tier Selection */}
                        <div className="space-y-4">
                            {event.ticketTypes.map((ticket) => (
                                <button
                                    key={ticket.name}
                                    onClick={() => setSelectedTier(ticket.name)}
                                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                                        selectedTier === ticket.name 
                                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,255,0,0.1)]' 
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {ticket.name.includes('NFT') && (
                                        <div className="absolute top-0 right-0 p-3">
                                            <Diamond className="w-4 h-4 text-primary animate-pulse" />
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center relative z-1">
                                        <div className="space-y-1">
                                            <p className={`font-black uppercase tracking-tight ${selectedTier === ticket.name ? 'text-primary' : 'text-white'}`}>
                                                {ticket.name}
                                            </p>
                                            <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">
                                                {ticket.capacity} Available
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white">${ticket.price.toFixed(2)}</p>
                                            {selectedTier === ticket.name && (
                                                <motion.div layoutId="check" className="inline-block">
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
                            <span className="text-sm font-black uppercase tracking-widest text-white/60">Quantity</span>
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors font-bold text-xl"
                                >
                                    -
                                </button>
                                <span className="text-lg font-black w-4 text-center">{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors font-bold text-xl"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between text-sm uppercase font-bold tracking-widest text-text-muted">
                                <span>Subtotal</span>
                                <span>${((selectedTicket?.price || 0) * quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black uppercase tracking-tight text-white border-t border-white/5 pt-4">
                                <span>Total Price</span>
                                <span>${((selectedTicket?.price || 0) * quantity).toFixed(2)}</span>
                            </div>
                        </div>

                        <Button 
                            className="w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,0,0.2)]"
                            onClick={handlePurchase}
                            disabled={!selectedTier}
                        >
                            Complete Purchase <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>

                        {selectedTier?.includes('NFT') && (
                            <div className="flex flex-col items-center gap-3 pt-4 opacity-70">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
                                    <Globe className="w-3 h-3" /> Blockchain Verification Enabled
                                </div>
                                <p className="text-[9px] text-center text-text-muted leading-relaxed">
                                    Your VIP ticket will be minted as a unique NFT on the Polygon network. 
                                    Wallet signature required after payment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-surface border border-white/10 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-[0.2em]">{label}</span>
            </div>
            <p className="text-white font-black uppercase tracking-tighter line-clamp-1">{value}</p>
        </div>
    );
}

function PerkItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2 text-sm text-primary/80 font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            {text}
        </li>
    );
}

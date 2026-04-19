import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Calendar, MapPin, Users,
    ArrowLeft, ShieldCheck, Zap, Diamond, Globe,
    ChevronRight, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LeagueEvent } from '../../models/event.model';
import { toast } from 'sonner';
import ticketService from '../../services/ticketService';
import tournamentService from '../../services/tournamentService';

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

const normalizeTicketType = (ticket: any) => {
    const name = String(ticket?.name ?? ticket?.type ?? ticket?.ticketType ?? ticket?.label ?? '').trim();
    if (!name) return null;
    return {
        name,
        price: Number(ticket?.price ?? ticket?.amount ?? ticket?.cost ?? 0),
        capacity: Number(ticket?.capacity ?? ticket?.maxCapacity ?? ticket?.quantity ?? ticket?.stock ?? 0),
    };
};

const mergeTicketTypes = (primary: any[], fallback: any[]) => {
    const map = new Map<string, { name: string; price: number; capacity: number }>();
    [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(fallback) ? fallback : [])]
        .map(normalizeTicketType)
        .filter(Boolean)
        .forEach((ticket) => {
            if (!ticket) return;
            const key = ticket.name.toUpperCase();
            if (!map.has(key)) map.set(key, ticket);
        });
    return Array.from(map.values());
};

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<LeagueEvent | null>(null);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [ownedTicketTypes, setOwnedTicketTypes] = useState<Set<string>>(new Set());

    useEffect(() => {
        const mockEvents: Record<string, any> = {
                'e1': {
                    _id: 'e1',
                    name: 'Valorant Champions:Grand Finals',
                    description: 'Witness the crowning of the 2026 World Champion. An unforgettable night of tactical mastery and explosive plays at the heart of Berlin Arena. Featuring live performances, cryptographic exclusive merchandise, and the best esports atmosphere in the world.',
                    date: new Date(Date.now() + 86400000 * 5).toISOString(),
                    location: 'Berlin Arena, Germany',
                    remainingCapacity: 450,
                    totalCapacity: 5000,
                    bannerImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
                    ticketTypes: [
                        { name: 'Standard', price: 49.99, capacity: 3000 },
                        { name: 'Premium', price: 99.99, capacity: 1500 },
                        { name: 'VIP NFT', price: 299.99, capacity: 500 }
                    ]
                },
                'e2': {
                    _id: 'e2',
                    name: 'League of Legends:LEC Summer Split',
                    description: 'Week 4 of the regional classic matches. Experience the high-stakes clash of titans as the summer split heats up. Real-time protocol validation on entry.',
                    date: new Date(Date.now() + 86400000 * 2).toISOString(),
                    location: 'Online Protocol',
                    remainingCapacity: 2000,
                    totalCapacity: 10000,
                    bannerImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
                    ticketTypes: [
                        { name: 'Digital Pass', price: 9.99, capacity: 8000 },
                        { name: 'Elite Digital', price: 19.99, capacity: 2000 }
                    ]
                },
                'e3': {
                    _id: 'e3',
                    name: 'Dota 2 TI13:Egis Edition',
                    description: 'The battle for the Aegis begins in Seattle. A legendary tournament with a tradition of excellence. Secure your spot in the hall of heroes.',
                    date: new Date(Date.now() + 86400000 * 12).toISOString(),
                    location: 'Climate Pledge Arena, Seattle',
                    remainingCapacity: 1200,
                    totalCapacity: 12000,
                    bannerImageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=2070&auto=format&fit=crop',
                    ticketTypes: [
                        { name: 'Standard', price: 149.99, capacity: 8000 },
                        { name: 'VIP Founder', price: 499.99, capacity: 1000 }
                    ]
                }
            };

        const loadEvent = async () => {
            if (!id) {
                setEvent(mockEvents['e1']);
                setSelectedTier(mockEvents['e1'].ticketTypes[0]?.name ?? null);
                setLoading(false);
                return;
            }

            try {
                const tournament = await tournamentService.fetchTournamentById(id);

                let availableTickets: any[] = [];
                try {
                    const ticketInventory = await ticketService.getAvailableTickets(id);
                    if (Array.isArray(ticketInventory?.availableTickets)) {
                        availableTickets = ticketInventory.availableTickets;
                    } else if (Array.isArray(ticketInventory)) {
                        availableTickets = ticketInventory;
                    }
                } catch (ticketError) {
                    console.warn('Failed to fetch available tickets, using tournament ticketTypes fallback:', ticketError);
                    if (Array.isArray((tournament as any).ticketTypes)) {
                        availableTickets = (tournament as any).ticketTypes;
                    }
                }

                const tournamentTicketTypes = Array.isArray((tournament as any).ticketTypes)
                    ? (tournament as any).ticketTypes
                    : [];
                const mergedTicketTypes = mergeTicketTypes(availableTickets, tournamentTicketTypes);

                const dynamicEvent: LeagueEvent = {
                    _id: tournament._id,
                    leagueId: (tournament as any).leagueId ?? 'default',
                    name: tournament.name,
                    description: tournament.description ?? 'No deployment summary available.',
                    date: tournament.startDate ?? new Date().toISOString(),
                    location: (tournament as any).location ?? 'TBD Arena',
                    isOnline: false,
                    totalCapacity: (tournament as any).maxTeams ?? 0,
                    remainingCapacity: (tournament as any).maxTeams ?? 0,
                    bannerImageUrl: tournament.bannerImageUrl,
                    status: 'UPCOMING',
                    createdAt: tournament.createdAt ?? new Date().toISOString(),
                    updatedAt: tournament.updatedAt ?? new Date().toISOString(),
                    ticketTypes: mergedTicketTypes,
                };

                if (!dynamicEvent.ticketTypes.length) {
                    throw new Error('No ticket types configured for this event yet.');
                }

                setEvent(dynamicEvent);
                setSelectedTier(dynamicEvent.ticketTypes[0]?.name ?? null);

                // Load my tickets and mark already owned types for this tournament
                try {
                    const myTickets = await ticketService.getMyTickets();
                    const owned = new Set(
                        myTickets
                            .filter((ticket) => {
                                const tournamentId = typeof ticket.tournament === 'string' ? ticket.tournament : ticket.tournament?._id;
                                return tournamentId === dynamicEvent._id && ticket.status !== 'CANCELLED';
                            })
                            .map((ticket) => ticket.type)
                    );
                    setOwnedTicketTypes(owned);
                } catch (myTicketsError) {
                    console.warn('Failed to load owned tickets for duplicate check:', myTicketsError);
                    setOwnedTicketTypes(new Set());
                }
            } catch (error) {
                console.warn('Falling back to mock event details:', error);
                const fallback = mockEvents[id];
                if (fallback) {
                    setEvent(fallback);
                    setSelectedTier(fallback.ticketTypes[0]?.name ?? null);
                } else {
                    setEvent(null);
                    setSelectedTier(null);
                }
            } finally {
                setLoading(false);
            }
        };

        void loadEvent();
    }, [id]);

    const handlePurchase = async () => {
        if (!selectedTier || !event) {
            toast.error('Please select a protocol tier');
            return;
        }

        if (!MONGO_ID_REGEX.test(event._id)) {
            toast.error('Invalid Event ID');
            return;
        }

        if (ownedTicketTypes.has(selectedTier)) {
            toast.error('You already own this ticket type for this event.');
            return;
        }
        
        // Redirect to specialized payment page
        navigate('/player/payment', {
            state: {
                type: 'ticket',
                ticketData: {
                    tournamentId: event._id,
                    tournamentName: event.name,
                    ticketName: selectedTier,
                    price: selectedTicket?.price || 0
                }
            }
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#00ff87]/20 border-t-[#00ff87] rounded-full animate-spin" />
        </div>
    );

    if (!event) return <div className="p-20 text-center font-black text-[#00ff87]">404 // PROTOCOL_NOT_FOUND</div>;

    const selectedTicket = event.ticketTypes.find(t => t.name === selectedTier);

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden p-8 lg:p-10">
            {/* Hex pattern background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px' 
                 }} 
            />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* ── Navigation ─────────────────────────────── */}
                <button 
                    onClick={() => navigate('/player/events')}
                    className="flex items-center gap-3 text-white/30 hover:text-[#00ff87] transition-all group font-black uppercase text-[10px] tracking-widest italic"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    REVERT TO PROTOCOL LIST
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    {/* ── Left: Detailed Protocol Info ───────────────── */}
                    <div className="xl:col-span-7 space-y-10">
                        {/* Immersive Image */}
                        <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/10 group shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                            <img src={event.bannerImageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-10 left-10 flex flex-col gap-4">
                                <div className="bg-[#00ff87] text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-[4px] w-fit italic">
                                    VERIFIED MAJOR
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
                                    {event.name.split(':')[0]} <span className="text-[#00ff87] block">{event.name.split(':')[1]}</span>
                                </h1>
                            </div>
                        </div>

                        {/* Tech-Spec Info Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SpecItem 
                                icon={<Calendar size={18} className="text-[#00ff87]" />} 
                                label="TIMESTAMP" 
                                value={new Date(event.date).toLocaleDateString() + ' // ' + new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                            />
                            <SpecItem 
                                icon={<MapPin size={18} className="text-[#00ff87]" />} 
                                label="GEOLOCATION" 
                                value={event.location} 
                            />
                            <SpecItem 
                                icon={<Users size={18} className="text-[#00ff87]" />} 
                                label="CAPACITY_VALIDATED" 
                                value={`${event.remainingCapacity} SLOTS OPEN`} 
                            />
                        </div>

                        {/* About Container */}
                        <div className="p-10 bg-white/[0.02] border border-white/[0.05] rounded-[40px] space-y-6">
                            <h2 className="text-xl font-black uppercase italic tracking-widest flex items-center gap-3">
                                <Info size={20} className="text-[#00ff87]" /> DEPLOYMENT SUMMARY
                            </h2>
                            <p className="text-white/50 text-xl font-bold leading-relaxed italic">
                                "{event.description}"
                            </p>
                        </div>

                        {/* VIP Hologram Badge */}
                        {selectedTier?.includes('VIP') && (
                            <motion.div 
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-8 bg-gradient-to-r from-purple-500/10 to-transparent border-l-4 border-purple-500 rounded-r-[32px] space-y-6"
                            >
                                <h3 className="text-purple-400 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Zap size={16} /> NFT_HOLDER_PRIVILEGES_AUTHORIZED
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <PerkItem text="ON-CHAIN AUTHENTICATED ENTRY" />
                                    <PerkItem text="PROTOCOL CRYPTO-EXCLUSIVE MERCH" />
                                    <PerkItem text="OPERATOR LOUNGE CLEARANCE" />
                                    <PerkItem text="DIGITAL ASSET COMMEMORATION" />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ── Right: Protocol Access Checkout ──────────── */}
                    <div className="xl:col-span-5 relative">
                        <div className="sticky top-10 bg-[#0a0c0f] border border-white/10 rounded-[48px] p-10 space-y-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00ff87]/10 blur-[90px] -mr-20 -mt-20 rounded-full" />
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#00ff87]/5 blur-[90px] -ml-20 -mb-20 rounded-full" />
                            
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">RESERVE CLEARANCE</h3>
                                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Select Deployment Tier // Finalize Protocol</p>
                            </div>

                            {/* Tier selection - holographic style */}
                            <div className="space-y-4 relative z-10">
                                {event.ticketTypes.map((ticket) => (
                                    <button
                                        key={ticket.name}
                                        onClick={() => setSelectedTier(ticket.name)}
                                        className={cn(
                                            "w-full text-left p-7 rounded-[28px] border transition-all duration-300 relative group overflow-hidden",
                                            selectedTier === ticket.name 
                                            ? "bg-[#00ff87]/10 border-[#00ff87]/40 shadow-[0_0_40px_rgba(0,255,135,0.1)]" 
                                            : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        {ticket.name.includes('VIP') && (
                                            <div className="absolute top-0 right-0 p-4">
                                                <Diamond size={14} className={selectedTier === ticket.name ? "text-[#00ff87]" : "text-white/10"} />
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center relative z-10">
                                            <div className="space-y-1">
                                                <p className={cn(
                                                    "text-lg font-black uppercase italic tracking-tighter",
                                                    selectedTier === ticket.name ? "text-[#00ff87]" : "text-white"
                                                )}>
                                                    {ticket.name} PASS
                                                </p>
                                                <p className="text-[8px] uppercase font-black text-white/20 tracking-widest">
                                                    CAPACITY: {ticket.capacity} // SECURED
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black italic tracking-tighter text-white">${ticket.price.toFixed(0)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Summary tech table */}
                            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                                    <span>NETWORK_PROTOCOL_FEE</span>
                                    <span className="text-[#00ff87]">COMPLIMENTARY</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff87]">TOTAL_ASSET_COST</span>
                                    <span className="text-5xl font-black italic tracking-tighter text-white">
                                        <span className="text-[#00ff87] text-2xl mr-1">$</span>
                                        {selectedTicket?.price.toFixed(0) || '0'}
                                    </span>
                                </div>
                            </div>

                            {/* Purchase Button - High Contrast */}
                            <button 
                                className={cn(
                                    "w-full h-20 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.3em] italic transition-all relative z-10 overflow-hidden",
                                    !selectedTier || purchasing || (!!selectedTier && ownedTicketTypes.has(selectedTier))
                                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5" 
                                    : "bg-[#00ff87] text-black shadow-[0_15px_40px_rgba(0,255,135,0.3)] hover:scale-105 active:scale-95 border-none"
                                )}
                                onClick={handlePurchase}
                                disabled={!selectedTier || purchasing || (!!selectedTier && ownedTicketTypes.has(selectedTier))}
                            >
                                {purchasing
                                    ? 'INITIATING_PROTOCOL...'
                                    : selectedTier && ownedTicketTypes.has(selectedTier)
                                        ? 'ALREADY OWNED'
                                        : 'AUTHORIZE TRANSACTION'}
                                {!purchasing && selectedTier && <ChevronRight size={18} />}
                            </button>

                            {/* Blockchain validation text */}
                            {selectedTier?.includes('VIP') && (
                                <div className="flex flex-col items-center gap-3 pt-4 relative z-10 opacity-30">
                                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-[#00ff87]">
                                        <Globe size={12} /> GLOBAL_LEDGER_ACTIVE
                                    </div>
                                    <p className="text-[7px] text-center text-white/60 leading-relaxed font-black uppercase tracking-widest px-8">
                                        ON-CHAIN MINTING OCCURS IMMEDIATELY UPON CREDIT VALIDATION VIA POLYGON HIGH-SPEED BRIDGE.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-[#0a0c0f] border border-white/10 rounded-3xl p-7 space-y-3 shadow-xl">
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-[9px] text-white/20 uppercase font-black tracking-widest italic">{label}</span>
            </div>
            <p className="text-base font-black uppercase tracking-tighter text-white truncate italic">{value}</p>
        </div>
    );
}

function PerkItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-purple-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic">{text}</span>
        </div>
    );
}

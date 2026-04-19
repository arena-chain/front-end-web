import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Filter, ArrowRight, Ticket as TicketIcon, Zap, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { LeagueEvent } from '../../models/event.model';
import tournamentService from '../../services/tournamentService';

export default function EventBrowsing() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<LeagueEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const mockEvents: LeagueEvent[] = [
            {
                _id: 'e1',
                leagueId: 'l1',
                name: 'Valorant Champions:Grand Finals',
                description: 'The ultimate showdown of the best teams in the world.',
                date: new Date(Date.now() + 86400000 * 5).toISOString(),
                location: 'Berlin Arena, Germany',
                isOnline: false,
                totalCapacity: 5000,
                remainingCapacity: 450,
                status: 'UPCOMING',
                bannerImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
                ticketTypes: [
                    { name: 'Standard', price: 49.99, capacity: 3000 },
                    { name: 'Premium', price: 99.99, capacity: 1500 },
                    { name: 'VIP NFT', price: 299.99, capacity: 500 }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                _id: 'e2',
                leagueId: 'l1',
                name: 'League of Legends:LEC Summer Split',
                description: 'Week 4 of the regional classic matches.',
                date: new Date(Date.now() + 86400000 * 2).toISOString(),
                location: 'Online Protocol',
                isOnline: true,
                totalCapacity: 10000,
                remainingCapacity: 2000,
                status: 'UPCOMING',
                bannerImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
                ticketTypes: [
                    { name: 'Digital Pass', price: 9.99, capacity: 8000 },
                    { name: 'Elite Digital', price: 19.99, capacity: 2000 }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                _id: 'e3',
                leagueId: 'l2',
                name: 'Dota 2 TI13:Egis Edition',
                description: 'The battle for the Aegis begins in Seattle.',
                date: new Date(Date.now() + 86400000 * 12).toISOString(),
                location: 'Climate Pledge Arena, Seattle',
                isOnline: false,
                totalCapacity: 12000,
                remainingCapacity: 1200,
                status: 'UPCOMING',
                bannerImageUrl: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=2070&auto=format&fit=crop',
                ticketTypes: [
                    { name: 'Standard', price: 149.99, capacity: 8000 },
                    { name: 'VIP Founder', price: 499.99, capacity: 1000 }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        const loadEvents = async () => {
            try {
                const tournaments = await tournamentService.fetchTournaments();
                const normalizedEvents: LeagueEvent[] = tournaments.map((tournament: any) => ({
                    _id: tournament._id,
                    leagueId: tournament.leagueId ?? 'default',
                    name: tournament.name,
                    description: tournament.description ?? 'No deployment summary available.',
                    date: tournament.startDate ?? new Date().toISOString(),
                    location: tournament.location ?? 'TBD Arena',
                    isOnline: false,
                    totalCapacity: Number(tournament.maxTeams ?? 0),
                    remainingCapacity: Math.max(0, Number(tournament.maxTeams ?? 0) - Number(tournament.currentTeams ?? 0)),
                    status: 'UPCOMING',
                    bannerImageUrl: tournament.bannerImageUrl,
                    ticketTypes: Array.isArray(tournament.ticketTypes) ? tournament.ticketTypes : [],
                    createdAt: tournament.createdAt ?? new Date().toISOString(),
                    updatedAt: tournament.updatedAt ?? new Date().toISOString(),
                }));

                if (normalizedEvents.length > 0) {
                    setEvents(normalizedEvents);
                } else {
                    setEvents(mockEvents);
                }
            } catch (error) {
                console.warn('Failed to load tournaments, falling back to mock events:', error);
                setEvents(mockEvents);
            } finally {
                setLoading(false);
            }
        };

        void loadEvents();
    }, []);

    const filteredEvents = events.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#060606] text-white relative overflow-hidden p-8 lg:p-10 transition-all duration-500">
            {/* Hex pattern background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px' 
                 }} 
            />

            <div className="max-w-[1400px] mx-auto space-y-12 relative z-10">
                {/* ── Header Area ─────────────────────────────── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse shadow-[0_0_10px_#00ff87]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00ff87] italic">Deployment Active</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-none" style={{textShadow: '0 0 80px rgba(0,255,135,0.05)'}}>
                            EVENT <span className="text-[#00ff87]">BROWSING</span>
                        </h1>
                        <p className="text-white/25 font-black uppercase tracking-[0.35em] text-[10px]">
                            Secure your protocol access credentials // Global Ledger
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#00ff87] transition-colors" size={16} />
                            <input 
                                type="text" 
                                placeholder="ENCRYPTED SEARCH..." 
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-[#00ff87]/40 text-white placeholder:text-white/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            className="bg-white/5 border border-white/10 text-white/40 hover:text-[#00ff87] hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 h-14 px-8 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2"
                        >
                            <Filter size={14} /> FILTER_PROTOCOLS
                        </button>
                    </div>
                </div>

                {/* ── Featured Hero Area ───────────────────────── */}
                {!loading && filteredEvents.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative h-[400px] rounded-[32px] overflow-hidden border border-white/10 group cursor-pointer"
                        onClick={() => navigate(`/player/events/${filteredEvents[0]._id}`)}
                    >
                        <div className="absolute inset-0 z-0">
                            <img src={filteredEvents[0].bannerImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Hero" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
                        </div>
                        
                        <div className="absolute bottom-0 left-0 p-12 space-y-6 z-10 max-w-2xl">
                            <div className="flex gap-4">
                                <div className="bg-[#00ff87]/20 border border-[#00ff87]/30 px-3 py-1 rounded-sm text-[8px] font-black text-[#00ff87] uppercase tracking-widest">
                                    LIVE_MAJOR_EVENT
                                </div>
                                <div className="bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-sm text-[8px] font-black text-purple-400 uppercase tracking-widest">
                                    NFT_INTEGRATED
                                </div>
                            </div>
                            
                            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                                {filteredEvents[0].name.replace(':', '\n')}
                            </h2>
                            
                            <p className="text-white/50 text-base font-bold uppercase tracking-wide leading-relaxed">
                                {filteredEvents[0].description}
                            </p>
                            
                            <button className="bg-[#00ff87] text-black px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] italic flex items-center gap-3 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(0,255,135,0.3)]">
                                Initiate Access Request <ArrowRight size={14} />
                            </button>
                        </div>
                        
                        {/* Vault Status Corner */}
                        <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
                            <div className="text-[9px] font-black text-[#00ff87] uppercase tracking-widest">Protocol Capacity</div>
                            <div className="text-3xl font-black italic tracking-tighter text-white">
                                {filteredEvents[0].remainingCapacity}/{filteredEvents[0].totalCapacity}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Event Grid ─────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-[480px] bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse" />
                        ))
                    ) : filteredEvents.length === 0 ? (
                        <div className="col-span-full py-40 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-white/20">
                            <Zap size={48} className="mb-4 opacity-10" />
                            <p className="text-xl font-black uppercase tracking-widest italic">No Protocols Detected</p>
                        </div>
                    ) : (
                        filteredEvents.map((event, idx) => (
                            <ProtocolCard key={event._id} event={event} index={idx} onClick={() => navigate(`/player/events/${event._id}`)} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function ProtocolCard({ event, index, onClick }: { event: LeagueEvent, index: number, onClick: () => void }) {
    const accents = ['#00ff87', '#ff00ff', '#00bfff'];
    const accent = accents[index % accents.length];
    const minPrice = Math.min(...event.ticketTypes.map(t => t.price));

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -8 }}
            className="group cursor-pointer bg-[#111111] border border-white/[0.05] rounded-[32px] overflow-hidden hover:border-white/15 transition-all duration-500 shadow-2xl relative"
            onClick={onClick}
        >
            <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full" style={{ background: accent }} />
            
            <div className="h-56 relative overflow-hidden">
                <img src={event.bannerImageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={event.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-center shadow-lg">
                        <span className="block text-lg font-black leading-none text-white italic">{new Date(event.date).getDate()}</span>
                        <span className="text-[8px] uppercase font-black text-white/40 tracking-widest">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                    </div>
                </div>
                
                <div className="absolute top-6 right-6">
                    <div className="bg-black/60 backdrop-blur-md text-white/60 p-2 rounded-lg border border-white/10 hover:text-white transition-all">
                        <TicketIcon size={16} />
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Protocol Access</span>
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight group-hover:text-white transition-all line-clamp-2">
                        {event.name}
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/20">
                            <MapPin size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Deployment</span>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 truncate italic capitalize">{event.location}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/20">
                            <Calendar size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Timestamp</span>
                        </div>
                        <p className="text-[11px] font-bold text-white/60 italic capitalize">
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // 2026
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/[0.03] flex items-center justify-between">
                    <div>
                        <span className="text-[9px] text-white/20 uppercase font-black tracking-widest block mb-1 italic">Initiate From</span>
                        <span className="text-3xl font-black italic tracking-tighter text-white">${minPrice.toFixed(0)}</span>
                    </div>
                    
                    <button 
                        className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center transition-all duration-300 shadow-inner group-hover:bg-white/10 group-hover:border-white/20"
                    >
                        <ArrowRight size={18} className="text-white group-hover:text-[#00ff87] group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

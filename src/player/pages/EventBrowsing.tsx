import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Filter, ArrowRight, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '../../components/ui/core';
import type { LeagueEvent } from '../../models/event.model';

export default function EventBrowsing() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<LeagueEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Mock data for initial fill
        const mockEvents: LeagueEvent[] = [
            {
                _id: 'e1',
                leagueId: 'l1',
                name: 'Valorant Champions Tour: Grand Finals',
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
                name: 'League of Legends LEC Summer Split',
                description: 'Week 4 of the regional classic matches.',
                date: new Date(Date.now() + 86400000 * 2).toISOString(),
                location: 'Online',
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
            }
        ];
        
        setTimeout(() => {
            setEvents(mockEvents);
            setLoading(false);
        }, 800);
    }, []);

    const filteredEvents = events.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-in-up pb-20">
            {/* Hero Billboard */}
            <div className="relative rounded-[40px] overflow-hidden bg-[#0A0C0F] border border-white/5 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent z-0" />
                <div className="relative z-1 p-12 md:p-16 flex flex-col gap-6 md:w-2/3">
                    <Badge className="w-fit bg-primary/20 text-primary border-primary/30 uppercase font-black tracking-[0.2em] px-3 py-1 text-[10px] flex items-center gap-2">
                        <TicketIcon size={12} className="rotate-[-10deg]" /> Ticket Sales Open
                    </Badge>
                    
                    <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-white">
                        Get your <span className="text-primary block">Tickets</span>
                    </h1>
                    
                    <p className="text-text-muted text-lg md:text-xl font-medium max-w-md leading-relaxed">
                        Secure your spot at the biggest esports events. Limited seats available for upcoming championships.
                    </p>
                </div>
                
                {/* Decorative Element */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent hidden lg:block" />
            </div>

            {/* Sub-header Filter Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="relative group flex-1 max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search available tickets..."
                        className="w-full bg-surface border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-bold tracking-wide"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 h-[52px] px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                        <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
                    <Button 
                        className="bg-white/5 border border-white/10 text-white hover:bg-white/10 h-[52px] px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                        onClick={() => navigate('/player/my-tickets')}
                    >
                        <TicketIcon className="w-4 h-4 mr-2" /> My Wallet
                    </Button>
                </div>
            </div>

            {/* Event Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[450px] bg-surface/50 border border-white/5 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-32 bg-surface/30 border border-white/5 rounded-3xl border-dashed">
                    <p className="text-text-muted italic">No events found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEvents.map(event => (
                        <EventCard key={event._id} event={event} onClick={() => navigate(`/player/events/${event._id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EventCard({ event, onClick }: { event: LeagueEvent, onClick: () => void }) {
    const minPrice = Math.min(...event.ticketTypes.map(t => t.price));
    const hasNFT = event.ticketTypes.some(t => t.name.includes('NFT'));

    return (
        <motion.div 
            whileHover={{ y: -8 }}
            className="group cursor-pointer flex flex-col h-[480px] bg-surface border border-white/10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-xl shadow-black/20"
            onClick={onClick}
        >
            {/* Image Section */}
            <div className="relative h-60 overflow-hidden shrink-0">
                <img 
                    src={event.bannerImageUrl} 
                    alt={event.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                
                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge className="bg-primary/90 text-black border-none uppercase text-[9px] font-black tracking-widest px-2 py-1">
                        Upcoming
                    </Badge>
                    {hasNFT && (
                        <Badge className="bg-purple-600 text-white border-none uppercase text-[9px] font-black tracking-widest px-2 py-1 shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                            NFT Access
                        </Badge>
                    )}
                </div>
                
                <div className="absolute top-4 right-4">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-center">
                        <span className="block text-lg font-black leading-none">{new Date(event.date).getDate()}</span>
                        <span className="text-[9px] uppercase font-bold text-white/60 tracking-widest">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-3">
                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                        {event.name}
                    </h3>
                    
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                            <MapPin className="w-4 h-4 text-primary" />
                            {event.location}
                        </div>
                        <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Arena Open
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Starting at</span>
                        <span className="text-2xl font-black text-white">${minPrice.toFixed(2)}</span>
                    </div>
                    
                    <button className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-primary hover:text-black flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

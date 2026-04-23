import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ShieldCheck,
    LayoutGrid,
    List,
    Search,
    Ticket as TicketIcon,
    Calendar,
    MapPin,
    ChevronRight,
    Gem,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/core';
import ticketService from '../../services/ticketService';
import type { Ticket } from '../../models/ticket';
import { cn } from '../../lib/utils';

export default function MyTickets() {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filter, setFilter] = useState<'ALL' | 'VALID'>('VALID');

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setLoading(true);
                const data = await ticketService.getMyTickets();
                const activeTickets = data.filter((ticket) => ticket.status === 'VALID');
                const sorted = [...activeTickets].sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.purchaseDate || 0).getTime();
                    const dateB = new Date(b.createdAt || b.purchaseDate || 0).getTime();
                    return dateB - dateA;
                });
                setTickets(sorted);
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const filteredTickets = tickets.filter(t => {
        const matchesSearch =
            t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (typeof t.tournament !== 'string' && t.tournament?.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFilter = filter === 'ALL' || t.status === filter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 lg:p-10 selection:bg-primary selection:text-black">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.02]"
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45v-30z' fill-rule='evenodd' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '30px' }}
                />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-black text-[10px] tracking-[0.3em] uppercase italic">
                            <ShieldCheck size={14} className="animate-pulse" />
                            Secure Assets Verified
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                            Digital <span className="text-primary">Vault</span>
                        </h1>
                        <p className="text-white/40 font-medium tracking-wide max-w-md">
                            Manage your authenticated tournament passes and NFT tickets in one high-security interface.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-white/10 text-primary" : "text-white/30 hover:text-white")}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-white/10 text-primary" : "text-white/30 hover:text-white")}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH ENCRYPTED LEDGER..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all placeholder:text-white/10 text-white"
                        />
                    </div>
                    <div className="md:col-span-4 flex gap-2">
                        {['ALL', 'VALID'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as 'ALL' | 'VALID')}
                                className={cn(
                                    "flex-1 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                                    filter === f
                                        ? "bg-primary/12 border-primary/40 text-primary"
                                        : "bg-white/5 border-white/10 text-white/30 hover:border-white/20"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-white/[0.02] border border-white/5 rounded-[32px] animate-pulse" />
                            ))}
                        </motion.div>
                    ) : filteredTickets.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                viewMode === 'grid'
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    : "space-y-4"
                            )}
                        >
                            {filteredTickets.map((ticket, idx) => (
                                <TicketCard
                                    key={ticket._id}
                                    ticket={ticket}
                                    index={idx}
                                    viewMode={viewMode}
                                    onClick={() => navigate(`/player/tickets/${ticket._id}`)}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <TicketIcon size={32} className="text-white/10" />
                            </div>
                            <h3 className="text-xl font-black italic tracking-widest text-white/40 uppercase">No Assets Detected</h3>
                            <p className="text-white/20 text-[10px] font-bold tracking-widest mt-2 uppercase">Your vault is currently empty</p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/player/market')}
                                className="mt-8 border-white/10 hover:border-primary hover:text-primary"
                            >
                                BROWSE MARKETPLACE
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TicketCard({ ticket, index, viewMode, onClick }: { ticket: Ticket; index: number; viewMode: 'grid' | 'list'; onClick: () => void }) {
    const tournament = typeof ticket.tournament === 'string' ? null : ticket.tournament;
    const isNft = !!ticket.nftTokenId;
    const accessId = ticket._id ? ticket._id.slice(-8).toUpperCase() : ticket.ticketNumber;

    if (viewMode === 'list') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={onClick}
                className="group bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center gap-6 cursor-pointer hover:border-primary/30 hover:bg-white/[0.02] transition-all"
            >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    {ticket.qrCode ? (
                        <img src={ticket.qrCode} alt={`QR ${ticket.ticketNumber}`} className="w-[30px] h-[30px]" />
                    ) : (
                        <QRCodeSVG value={ticket.ticketNumber} size={30} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black italic tracking-tight text-white uppercase line-clamp-1">{tournament?.name || 'Tournament Access'}</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{ticket.ticketNumber}</p>
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 px-6 border-x border-white/5">
                    <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <Calendar size={12} />
                        {tournament?.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <MapPin size={12} />
                        {tournament?.location || 'Virtual Arena'}
                    </div>
                </div>
                <div className="flex items-center gap-4 ml-auto">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                        ticket.status === 'VALID' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-white/30 border border-white/10"
                    )}>
                        {ticket.status}
                    </div>
                    <ChevronRight size={18} className="text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="group relative h-[440px] bg-[#111] border border-white/5 rounded-[32px] overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-500 shadow-2xl flex flex-col"
        >
            {/* Holographic Overlay Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 mix-blend-color-dodge"
                 style={{
                    background: 'linear-gradient(135deg, transparent 0%, rgba(0,255,135,0.05) 50%, transparent 100%)',
                    backgroundSize: '200% 200%'
                 }}
            />

            {/* Banner Image */}
            <div className="h-44 shrink-0 relative overflow-hidden bg-black">
                {tournament?.bannerImageUrl ? (
                    <img
                        src={tournament.bannerImageUrl}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-40 transition-all duration-1000"
                        alt="Venue"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black opacity-40" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-20">
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md",
                        ticket.status === 'VALID' ? "bg-primary/12 text-primary border border-primary/25" : "bg-black/60 text-white/20 border border-white/10"
                    )}>
                        {ticket.status === 'VALID' ? 'ACTIVE_PASS' : 'ARCHIVED'}
                    </div>
                </div>

                {/* NFT Badge */}
                {isNft && (
                    <div className="absolute top-4 right-4 z-20">
                        <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2">
                            <Gem size={12} className="animate-bounce" />
                            <span className="text-[8px] font-black uppercase tracking-widest italic">NFT_ASSET</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-8 flex flex-col flex-1 relative">
                <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-primary transition-colors leading-[1.1]">
                        {tournament?.name || 'Tournament Access Pass'}
                    </h3>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                            <Calendar size={14} className="text-white/20" />
                            {tournament?.startDate ? new Date(tournament.startDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'DATE TO BE DECLARED'}
                        </div>
                        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold tracking-widest uppercase">
                            <MapPin size={14} className="text-white/20" />
                            {tournament?.location || 'SECURE CONNECTED ARENA'}
                        </div>
                    </div>
                </div>

                {/* QR Section */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] italic">Access ID</p>
                        <p className="text-white font-mono text-[10px] tracking-widest group-hover:text-white transition-colors">
                            {accessId}
                        </p>
                    </div>

                    <div className="relative group/qr">
                        <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                        <div className="relative bg-white p-1.5 rounded-xl transition-all duration-300 group-hover:scale-110">
                            {ticket.qrCode ? (
                                <img src={ticket.qrCode} alt={`QR ${ticket.ticketNumber}`} className="w-[50px] h-[50px]" />
                            ) : (
                                <QRCodeSVG value={ticket.ticketNumber} size={50} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Progress/Deco */}
            <div className="h-1 w-full bg-white/[0.02]">
                <div className="h-full bg-primary w-[40%] group-hover:w-full transition-all duration-700" />
            </div>
        </motion.div>
    );
}

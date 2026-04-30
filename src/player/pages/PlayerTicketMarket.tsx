import { useState, useEffect } from 'react';
import { Search, Users, Ticket, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/core';
import ticketService from '../../services/ticketService';
import type { Ticket as TicketModel } from '../../models/ticket';
import { useNavigate } from 'react-router-dom';
import { resolveBackendAssetUrl } from '../../lib/apiBase';
import { placeholderImage } from '../../lib/placeholderImage';
import { cn } from '../../lib/utils';

export default function PlayerTicketMarket() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<TicketModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [userTickets, setUserTickets] = useState<TicketModel[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [templatesData, myTicketsData] = await Promise.all([
                ticketService.getTemplates(),
                ticketService.getMyTickets().catch(() => [])
            ]);
            console.log('Ticket Market Data:', { templatesData, myTicketsData });
            setTemplates(templatesData);
            setUserTickets(myTicketsData);
            setDebugInfo(`Market: ${templatesData.length} | Owned: ${myTicketsData.length}`);
        } catch (err: any) {
            console.error('Failed to fetch ticket market data:', err);
            setError(err.message);
            setDebugInfo(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter((template) => {
        const league = template.league && typeof template.league !== 'string' ? (template.league as any) : null;
        const leagueName = league?.name || '';
        const matchesSearch = leagueName.toLowerCase().includes(searchQuery.toLowerCase());
        console.log(`Filtering template ${template.ticketNumber}: leagueName="${leagueName}", matchesSearch=${matchesSearch}`);
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 mb-8">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-bold mb-4 animate-pulse">
                        <Ticket className="w-4 h-4" />
                        <span>OFFICIAL LEAGUE TICKETS</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
                        Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Leagues</span>
                    </h1>
                    <p className="text-xl text-text-muted mb-8">
                        Secure your spot at the biggest official leagues. Standard and special access tickets available now.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search available league tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 bg-surface border-white/5"
                    />
                </div>
                <div className="text-text-muted text-[10px] font-bold self-center">
                    DEBUG: {debugInfo} | FILTERED={filteredTemplates.length}
                </div>
                {error && <div className="text-red-500 text-xs font-bold self-center bg-red-500/10 px-2 py-1 rounded">ERR: {error}</div>}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-surface border border-white/5 rounded-xl h-96 animate-pulse" />
                    ))}
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => {
                        const leagueId = typeof template.league === 'object' ? template.league._id : template.league;
                        const isOwned = userTickets.some(ut => {
                            const utLeagueId = typeof ut.league === 'object' ? ut.league._id : ut.league;
                            return utLeagueId === leagueId;
                        });

                        return (
                            <MarketCard
                                key={template._id}
                                template={template}
                                isOwned={isOwned}
                                onClick={() => {
                                    navigate(`/player/leagues/${leagueId}`);
                                }}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-surface/30 rounded-3xl border border-white/5">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Ticket className="w-12 h-12 text-text-muted opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No League Tickets Found</h3>
                    <p className="text-text-muted max-w-md mx-auto">
                        There are no leagues currently offering tickets. Please check back later.
                    </p>
                </div>
            )}
        </div>
    );
}

function MarketCard({ template, isOwned, onClick }: { template: TicketModel, isOwned: boolean, onClick: () => void }) {
    const league = typeof template.league === 'object' ? template.league : null;

    const getImageUrl = (url?: string) => {
        if (!url || url === 'undefined') return placeholderImage(800, 400, 'League');
        if (url.startsWith('http')) return url;
        return resolveBackendAssetUrl(url);
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative bg-[#1A1D21] border border-white/10 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
                isOwned ? "opacity-75 grayscale-[0.5]" : "hover:border-primary/50 hover:shadow-[0_0_40px_-10px_rgba(0,255,136,0.3)]"
            )}
        >
            <div className="relative h-56 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${getImageUrl(league?.logoUrl)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D21] via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">
                        {league?.regionValue || 'Global'}
                    </span>
                    <h3 className="text-2xl font-black text-white leading-tight mb-2 shadow-black drop-shadow-md">
                        {league?.name || 'Unnamed League'}
                    </h3>
                </div>
                
                {isOwned && (
                    <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-md border border-primary/40 px-3 py-1 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest">
                        Already Owned
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-text-muted mb-1">Standard Price</p>
                        <p className="text-2xl font-black text-white">${template.price || 0}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-muted mb-1">Max Capacity</p>
                        <p className="text-xl font-bold text-primary flex items-center justify-end gap-1">
                            <Users className="w-4 h-4" />
                            {league?.maxParticipants || 0}
                        </p>
                    </div>
                </div>

                <div className={cn(
                    "w-full py-3 font-bold text-center rounded-xl flex items-center justify-center gap-2 transition-colors",
                    isOwned 
                        ? "bg-white/10 text-white/40" 
                        : "bg-primary text-background group-hover:bg-primary/90"
                )}>
                    <span>{isOwned ? 'Registered' : 'Register Now'}</span>
                    {!isOwned && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </div>
            </div>
        </div>
    );
}

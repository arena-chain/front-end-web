import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Ticket, Shield, Zap, Lock, Check, X, 
    ChevronRight, Loader2, Award, Wallet,
    Cpu, Activity, Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { leagueService } from '../../services/leagueService';
import ticketService from '../../services/ticketService';

export default function PlayerTicketSelection() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        leagueService.getLeagueById(id)
            .then(setLeague)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleSelect = async (category: 'STANDARD' | 'NFT') => {
        if (!id) return;
        setProcessing(category);
        try {
            await leagueService.registerForLeague(id, category);
            navigate('/player/tickets');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to secure pass');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#00FF00] animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-['Space_Grotesk'] overflow-y-auto pb-20 selection:bg-[#00FF00] selection:text-black">
            {/* Header */}
            <div className="max-w-6xl mx-auto pt-16 px-4 text-center mb-20">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-[#00FF00]/30 rounded-full bg-[#00FF00]/5 text-[#00FF00] text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                    <Activity size={12} />
                    Protocol Deployment: Phase 2
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-white leading-[0.9]">
                    CHOOSE YOUR <br />
                    <span className="text-[#00FF00] drop-shadow-[0_0_30px_rgba(0,255,0,0.3)]">ACCESS LEVEL</span>
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                    Initialize your credentials for the {league?.name || 'Ultra Compete'} Season. 
                    Standard entry or Elite Blockchain verification.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {/* Standard Entry - Always Available */}
                <div className="group relative">
                    <div className="absolute inset-0 bg-white/5 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
                    <div className="relative h-full bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 hover:border-white/20 hover:-translate-y-2">
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-1">
                                <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Base Access</span>
                                <h2 className="text-3xl font-black uppercase tracking-tight">Standard</h2>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-white/20" />
                            </div>
                        </div>

                        <div className="mb-10 relative aspect-[16/9]">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/[0.02] rounded-2xl border border-white/10 backdrop-blur-sm p-6 flex flex-col justify-between overflow-hidden">
                                <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Standard // 0x71A</div>
                                <div className="h-0.5 bg-gradient-to-r from-white/20 to-transparent w-full" />
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 italic text-right">Single Circuit Access</div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                            <div className="space-y-0.5">
                                <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Cost</span>
                                <div className="text-2xl font-black italic">FREE</div>
                            </div>
                            <button 
                                onClick={() => handleSelect('STANDARD')}
                                disabled={!!processing}
                                className="px-6 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {processing === 'STANDARD' ? <Loader2 className="animate-spin w-4 h-4" /> : 'Select Pass'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dynamic Ticket Types (configured by admin) */}
                {Array.isArray(league?.ticketTypes) && league.ticketTypes.map((type: any, index: number) => {
                    const isNft = (type.name || type.type || '').toUpperCase().includes('NFT') || (type.category === 'NFT');
                    const color = isNft ? '#00FF00' : '#00C2FF';
                    
                    return (
                        <div key={index} className="group relative">
                            <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" style={{ backgroundColor: `${color}33` }} />
                            <div className="relative h-full bg-[#0d0d0d] border-2 rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 hover:-translate-y-2" style={{ borderColor: isNft ? color : 'rgba(255,255,255,0.1)' }}>
                                
                                {isNft && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00FF00] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,0,0.4)]">
                                        Elite Asset
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isNft ? color : 'rgba(255,255,255,0.3)' }}>Premium Tier</span>
                                        <h2 className="text-3xl font-black uppercase tracking-tight">{type.name || type.type || 'Custom Pass'}</h2>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border flex items-center justify-center" style={{ borderColor: `${color}33` }}>
                                        {isNft ? <Shield className="w-6 h-6" style={{ color }} /> : <Award className="w-6 h-6" style={{ color }} />}
                                    </div>
                                </div>

                                <div className="mb-10 relative aspect-[16/9] group/ticket">
                                    <div className="absolute inset-0 bg-gradient-to-br from-black to-zinc-900 rounded-2xl border backdrop-blur-xl p-6 flex flex-col justify-between overflow-hidden" style={{ borderColor: `${color}44` }}>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                                        <div className="flex justify-between relative z-10">
                                            <div className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${color}88` }}>{isNft ? 'Verified Blockchain' : 'Priority Access'} // v2.0</div>
                                            {isNft ? <Cpu size={14} style={{ color: `${color}66` }} /> : <Activity size={14} style={{ color: `${color}66` }} />}
                                        </div>
                                        <div className="h-0.5 w-full shadow-[0_0_10px_rgba(0,255,0,0.5)]" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
                                        <div className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: `${color}AA` }}>{isNft ? 'Lifetime Ecosystem Access' : 'Full Tournament Access'}</div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                                    <div className="space-y-0.5">
                                        <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Protocol Mint</span>
                                        <div className="text-2xl font-black italic">{type.price || 0}.0 <span className="text-sm font-normal not-italic text-white/30">VEX</span></div>
                                    </div>
                                    <button 
                                        onClick={() => handleSelect(type.name || type.type || 'NFT')}
                                        disabled={!!processing}
                                        className="px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                                        style={{ backgroundColor: color, color: '#000', boxShadow: `0 0 25px ${color}44` }}
                                    >
                                        {processing === (type.name || type.type) ? <Loader2 className="animate-spin w-4 h-4" /> : isNft ? 'Mint Now' : 'Select'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Fallback NFT if no custom types configured */}
                {(!league?.ticketTypes || league.ticketTypes.length === 0) && (
                    <div className="group relative">
                        <div className="absolute inset-0 bg-[#00FF00]/10 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                        <div className="relative h-full bg-[#0d0d0d] border-2 border-[#00FF00] rounded-[2.5rem] p-8 flex flex-col transition-all duration-500 hover:-translate-y-2">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00FF00] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Elite Protocol</div>
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-1">
                                    <span className="text-[#00FF00] text-[10px] font-black uppercase tracking-widest">Lifetime Access</span>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">NFT Pass</h2>
                                </div>
                                <Shield className="w-6 h-6 text-[#00FF00]" />
                            </div>
                            <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <span className="text-[#00FF00] text-[10px] font-black uppercase tracking-widest">Premium Mint</span>
                                    <div className="text-2xl font-black italic">50.0 <span className="text-sm font-normal not-italic text-white/30">VEX</span></div>
                                </div>
                                <button onClick={() => handleSelect('NFT')} className="px-6 py-4 rounded-xl bg-[#00FF00] text-black font-black uppercase tracking-widest text-[10px] transition-all hover:scale-110">Mint Now</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Matrix Footer */}
            <div className="max-w-2xl mx-auto px-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 mb-4 italic">
                    Secure Neural Link Established // All Rights Reserved
                </p>
                <div className="h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
            </div>
        </div>
    );
}

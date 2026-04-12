import { useEffect, useState } from 'react';
import { 
    BarChart3, RefreshCw, Save, Trophy, 
    ArrowUpCircle, ArrowDownCircle, Settings2, 
    AlertTriangle, Layers, Palette, ShieldCheck, 
    ChevronDown, Edit3, Check, X 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminRankService, type RankGeneralConfig, type RankTierConfig } from '../../services/adminRankService';
import { toast } from 'sonner';

export default function RankingConfig() {
    const [generalConfig, setGeneralConfig] = useState<RankGeneralConfig | null>(null);
    const [tierConfigs, setTierConfigs] = useState<RankTierConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Edit States
    const [editingTier, setEditingTier] = useState<RankTierConfig | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [gen, tiers] = await Promise.all([
                adminRankService.getGeneralConfig(),
                adminRankService.getTierConfigs()
            ]);
            setGeneralConfig(gen);
            setTierConfigs(tiers);
        } catch (error) {
            console.error('Failed to load ranking config', error);
            toast.error('Impossible de charger la configuration.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpdateGeneral = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!generalConfig) return;
        
        setSaving(true);
        try {
            await adminRankService.updateGeneralConfig(generalConfig);
            toast.success('Configuration ELO mise à jour !');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTier = async () => {
        if (!editingTier) return;
        setSaving(true);
        try {
            await adminRankService.updateTierConfig(editingTier.tier, editingTier);
            toast.success(`Palier ${editingTier.tier} mis à jour.`);
            setEditingTier(null);
            loadData();
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde du palier.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
                    <RefreshCw className="animate-spin" size={32} />
                    <span className="text-[10px] uppercase font-black tracking-[0.3em]">Synching Balance...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
                        Ranking <span className="text-primary truncate">Balance</span>
                    </h1>
                    <p className="text-text-muted text-sm mt-1.5 font-medium italic">Configure the core logic of the competitive ladder.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* General Config (Left Section) */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-surface border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <Settings2 size={22} />
                            </div>
                            <div>
                                <h3 className="text-white font-black uppercase tracking-tight italic">ELO Multipliers</h3>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mt-1">Core Point Logic</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateGeneral} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[11px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                                            <ArrowUpCircle size={14} className="text-green-500" /> Gain Victoire (ELO)
                                        </label>
                                        <span className="text-[10px] font-black text-green-500 tabular-nums">WIN</span>
                                    </div>
                                    <input 
                                        type="number"
                                        value={generalConfig?.eloWinAmount}
                                        onChange={e => setGeneralConfig(prev => prev ? {...prev, eloWinAmount: Number(e.target.value)} : null)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-black text-xl focus:border-primary/50 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[11px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                                            <ArrowDownCircle size={14} className="text-red-500" /> Perte Défaite (ELO)
                                        </label>
                                        <span className="text-[10px] font-black text-red-500 tabular-nums">LOSS</span>
                                    </div>
                                    <input 
                                        type="number"
                                        value={generalConfig?.eloLossAmount}
                                        onChange={e => setGeneralConfig(prev => prev ? {...prev, eloLossAmount: Number(e.target.value)} : null)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-black text-xl focus:border-red-500/50 transition-all outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[11px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-blue-500" /> ELO Initial
                                        </label>
                                        <span className="text-[10px] font-black text-blue-500 tabular-nums">START</span>
                                    </div>
                                    <input 
                                        type="number"
                                        value={generalConfig?.startingElo}
                                        onChange={e => setGeneralConfig(prev => prev ? {...prev, startingElo: Number(e.target.value)} : null)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-black text-xl focus:border-blue-500/50 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full bg-primary hover:bg-primary/90 text-black py-5 rounded-[22px] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Update Base Configuration'}
                            </button>
                        </form>

                        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
                            <AlertTriangle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-yellow-500/80 font-bold leading-relaxed uppercase tracking-widest">
                                Attention : Modifier ces valeurs affecte instantanément tous les prochains calculs de match.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tiers List (Right Section) */}
                <div className="xl:col-span-8">
                    <div className="bg-surface border border-white/5 rounded-[32px] p-8 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                    <Layers size={22} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-tight italic">Tier Thresholds</h3>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mt-1">Difficulty Mapping</p>
                                </div>
                            </div>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
                                <RefreshCw size={14} /> Reset Default
                            </button>
                        </div>

                        <div className="space-y-4">
                            {tierConfigs.sort((a,b) => a.displayOrder - b.displayOrder).map(tier => {
                                const isEditing = editingTier?.tier === tier.tier;
                                return (
                                    <div key={tier.tier} className={cn(
                                        "group border rounded-[24px] transition-all p-5 flex items-center gap-6",
                                        isEditing ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 scale-[1.02] z-10 sticky top-4 mb-8 mt-4" : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                    )}>
                                        {/* Status Badge */}
                                        <div 
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-black shadow-inner overflow-hidden relative shrink-0" 
                                            style={{ backgroundColor: tier.color || '#333' }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/20" />
                                            <span className="relative z-10 drop-shadow-md">{tier.tier.charAt(0)}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black uppercase tracking-tight text-white leading-none">{tier.tier}</h4>
                                                <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{tier.divisions} Divisions</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                                                <span className="flex items-center gap-1.5"><ArrowUpCircle size={10} className="text-primary"/> Min: <span className="text-white tabular-nums">{tier.minElo}</span></span>
                                                <span className="opacity-20">|</span>
                                                <span className="flex items-center gap-1.5"><ArrowDownCircle size={10} className="text-red-500"/> Max: <span className="text-white tabular-nums">{tier.maxElo || '∞'}</span></span>
                                            </div>
                                        </div>

                                        {/* Row Actions */}
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2 p-2 bg-black/40 rounded-2xl border border-primary/20">
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="number"
                                                            placeholder="MIN"
                                                            value={editingTier.minElo}
                                                            onChange={e => setEditingTier({...editingTier, minElo: Number(e.target.value)})}
                                                            className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary/50"
                                                        />
                                                        <input 
                                                            type="number"
                                                            placeholder="MAX"
                                                            value={editingTier.maxElo || ''}
                                                            onChange={e => setEditingTier({...editingTier, maxElo: e.target.value ? Number(e.target.value) : undefined})}
                                                            className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary/50"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleSaveTier}
                                                            className="flex-1 bg-primary text-black py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                                                        >
                                                            <Check size={14} /> VALIDER
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingTier(null)}
                                                            className="flex-1 bg-white/5 text-white/60 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setEditingTier(tier)}
                                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

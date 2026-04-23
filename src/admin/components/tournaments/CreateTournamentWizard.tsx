import React, { useState, useEffect } from 'react';
import {
    X, Trophy, Shield, Zap,
    ChevronRight, ChevronLeft, Upload, Info,
    Calendar, MapPin, Target, Gem, User, Globe, Layers
} from 'lucide-react';
import { Button, Input } from '../../../components/ui/core';
import catalogService from '../../../services/catalogService';
import organizerService from '../../../services/organizerService';
import type { Game, Organizer } from '../../../models/tournament';
import type { CreateTournamentDto } from '../../../models/tournament';
import { TournamentFormat, TournamentRegion, GameMode } from '../../../models/tournament';

interface CreateTournamentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTournamentDto) => void;
}

const STEPS = [
    { id: 1, title: 'Setup', icon: Info },
    { id: 2, title: 'Format', icon: Target },
    { id: 3, title: 'Access', icon: Shield },
    { id: 4, title: 'Rewards', icon: Zap },
];

const CreateTournamentWizard: React.FC<CreateTournamentWizardProps> = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [games, setGames] = useState<Game[]>([]);
    const [organizers, setOrganizers] = useState<Organizer[]>([]);
    const [formData, setFormData] = useState<Partial<CreateTournamentDto>>({
        name: '',
        gameId: '',
        organizerId: '',
        region: TournamentRegion.GLOBAL,
        gameMode: GameMode.SQUAD_5,
        startDate: new Date().toISOString().split('T')[0] as any,
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] as any,
        maxTeams: 16,
        prizePool: 0,
        format: TournamentFormat.SINGLE_ELIMINATION,
        registrationOpen: true,
        firstPlace: 0,
        secondPlace: 0,
        thirdPlace: 0
    });

    useEffect(() => {
        if (isOpen) {
            catalogService.fetchGames().then((data: Game[]) => setGames(data));
            organizerService.fetchOrganizers().then((data: Organizer[]) => {
                setOrganizers(data);
                if (data.length > 0 && !formData.organizerId) {
                    setFormData(prev => ({ ...prev, organizerId: data[0]._id }));
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const handleSumbitFinal = () => {
        if (!formData.name || !formData.gameId || !formData.organizerId) return;
        onSubmit(formData as CreateTournamentDto);
    };

    const selectedOrganizer = organizers.find(o => o._id === formData.organizerId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-[#0a0a0f] border border-[#00ff88]/20 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,255,136,0.1)]">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                            <Trophy className="w-6 h-6 text-[#00ff88]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Forge Tournament</h2>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Deployment Phase {step} / 4</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-white/40 transition-all hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex px-10 pt-8 gap-3">
                    {STEPS.map((s) => (
                        <div key={s.id} className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]' : 'bg-white/5 text-white/20 border border-white/5'
                                    }`}>
                                    <s.icon size={20} />
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest transition-colors ${step >= s.id ? 'text-white' : 'text-white/20'}`}>
                                    {s.title}
                                </span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full bg-[#00ff88] transition-all duration-1000 ${step >= s.id ? 'w-full' : 'w-0'}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="p-10 min-h-[500px]">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in-right">
                            <div className="space-y-8">
                                {/* Organizer Selection */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Master Organizer</label>
                                    <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-[#00ff88]/30 transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                            {selectedOrganizer?.avatarUrl ? (
                                                <img src={selectedOrganizer.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <select
                                                className="w-full bg-transparent text-white font-black uppercase tracking-tight outline-none appearance-none cursor-pointer"
                                                value={formData.organizerId}
                                                onChange={e => setFormData({ ...formData, organizerId: e.target.value })}
                                            >
                                                {organizers.map(org => (
                                                    <option key={org._id} value={org._id} className="bg-[#0a0a0f]">{org.username}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{selectedOrganizer?.email || 'Select host entity'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tournament Name */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Tournament Designation</label>
                                    <Input
                                        placeholder="Enter name..."
                                        className="h-16 bg-black/40 border-white/5 focus:border-[#00ff88]/50 text-white font-black uppercase tracking-tight rounded-2xl text-lg px-6"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Region & Game Mode */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
                                            <Globe size={12} /> Region
                                        </label>
                                        <select
                                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-white font-black uppercase tracking-tight outline-none focus:border-[#00ff88]/50 transition-all appearance-none"
                                            value={formData.region}
                                            onChange={e => setFormData({ ...formData, region: e.target.value as TournamentRegion })}
                                        >
                                            {Object.values(TournamentRegion).map(r => (
                                                <option key={r} value={r} className="bg-[#0a0a0f]">{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
                                            <Layers size={12} /> Game Mode
                                        </label>
                                        <select
                                            className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-white font-black uppercase tracking-tight outline-none focus:border-[#00ff88]/50 transition-all appearance-none"
                                            value={formData.gameMode}
                                            onChange={e => setFormData({ ...formData, gameMode: e.target.value as GameMode })}
                                        >
                                            {Object.values(GameMode).map(m => (
                                                <option key={m} value={m} className="bg-[#0a0a0f]">{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Game Selector */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Select Core Engine</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        <select
                                            className="w-full h-16 bg-black/40 border border-white/5 rounded-2xl px-6 text-white font-black uppercase tracking-tight outline-none focus:border-[#00ff88]/50 transition-all appearance-none"
                                            value={String(formData.gameId)}
                                            onChange={e => setFormData({ ...formData, gameId: e.target.value })}
                                        >
                                            <option value="">Select Protocol...</option>
                                            {games.map(g => (
                                                <option key={g._id} value={g._id} className="bg-[#0a0a0f]">{g.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Operational Launch</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ff88]" />
                                        <Input
                                            type="datetime-local"
                                            className="h-16 pl-16 bg-black/40 border-white/5 text-white font-black uppercase rounded-2xl focus:border-[#00ff88]/50"
                                            value={formData.startDate as any}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value as any })}
                                        />
                                    </div>
                                </div>

                                {/* Banner (Compact) */}
                                <div className="bg-black/40 rounded-[2rem] border border-white/5 p-6 flex items-center gap-6 border-dashed hover:border-[#00ff88]/30 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/5 flex items-center justify-center shrink-0 border border-[#00ff88]/10">
                                        <Upload className="w-7 h-7 text-[#00ff88]" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-tight text-sm">Upload Visual Protocol</h4>
                                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Banner Image (16:9)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in-right">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Bracketing Logic</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[TournamentFormat.SINGLE_ELIMINATION, TournamentFormat.DOUBLE_ELIMINATION, TournamentFormat.SWISS].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFormData({ ...formData, format: f })}
                                                className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${formData.format === f ? 'border-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'border-white/5 bg-black/40 hover:border-white/10'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.format === f ? 'bg-[#00ff88] text-black' : 'bg-white/5 text-white/40'}`}>
                                                    <Target size={18} />
                                                </div>
                                                <div>
                                                    <span className={`text-sm font-black uppercase tracking-tight block ${formData.format === f ? 'text-[#00ff88]' : 'text-white/60'}`}>{f.replace('_', ' ')}</span>
                                                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Automated Bracket Generation</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Competitive Theater</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ff88]" />
                                        <Input placeholder="Search authorized maps..." className="h-16 pl-16 bg-black/40 border-white/5 text-white font-black uppercase rounded-2xl focus:border-[#00ff88]/50" />
                                    </div>
                                    <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-2xl p-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Shield className="text-[#00ff88]" size={20} />
                                            <span className="text-xs font-black text-white uppercase tracking-tight">Active Anti-Cheat Protocol</span>
                                        </div>
                                        <p className="text-[10px] text-[#00ff88]/70 leading-relaxed font-bold uppercase tracking-widest">VANGUARD X-LINK V2: Compulsory deployment for all tournament participants.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in-right">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Strategic Capacity</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[8, 16, 32, 64, 128, 256].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setFormData({ ...formData, maxTeams: n })}
                                                className={`h-16 rounded-2xl font-black transition-all text-sm ${formData.maxTeams === n ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)]' : 'bg-black/40 text-white/40 border border-white/5 hover:border-white/10'}`}
                                            >
                                                {n} UNITS
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest">Elite Requirement</label>
                                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-white uppercase tracking-tight">Min. Player Tier</span>
                                            <span className="text-xl font-black text-[#00ff88]">LEVEL 1</span>
                                        </div>
                                        <input type="range" min="1" max="50" className="w-full accent-[#00ff88]" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-[#00ff88]/10 rounded-[2rem] p-8 space-y-6">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                                    <Layers size={16} className="text-[#00ff88]" /> Permissive Logic
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-[#00ff88]/20 group cursor-pointer hover:bg-[#00ff88]/5 transition-all">
                                        <div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-1">Global Transmission</span>
                                            <span className="text-[8px] text-[#00ff88]/60 font-bold uppercase tracking-widest italic">Publically Visible</span>
                                        </div>
                                        <div className="w-12 h-6 bg-[#00ff88] rounded-full p-1 relative shadow-[0_0_10px_rgba(0,255,136,0.3)]">
                                            <div className="w-4 h-4 bg-black rounded-full absolute right-1" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5 group cursor-pointer hover:border-white/10 transition-all opacity-40">
                                        <div>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Pass-Key Locked</span>
                                            <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest italic">Private Engagement</span>
                                        </div>
                                        <div className="w-12 h-6 bg-white/10 rounded-full p-1 relative">
                                            <div className="w-4 h-4 bg-black/40 rounded-full absolute left-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="animate-fade-in-right">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-[3rem] p-10 text-center relative overflow-hidden group">
                                        <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-150 transition-all duration-[2000ms]">
                                            <Gem size={200} className="text-[#00ff88]" />
                                        </div>
                                        <label className="block text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-4">Total Bounty Contract</label>
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-5xl font-black text-white italic">$</span>
                                            <Input
                                                type="number"
                                                className="w-48 bg-transparent border-none text-7xl font-black text-white p-0 h-auto text-center focus:ring-0 placeholder:text-white/10"
                                                value={formData.prizePool}
                                                onChange={e => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-[#00ff88]/60 uppercase tracking-widest mt-8">Automated distribution through Nexus Protocol</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 group hover:border-[#00ff88]/20 transition-all">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">XP Multiplier</span>
                                            <span className="text-3xl font-black text-white italic">1.0<span className="text-[#00ff88]">X</span></span>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 group hover:border-[#00ff88]/20 transition-all">
                                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-2">VRS Standing</span>
                                            <span className="text-3xl font-black text-[#00ff88] italic">+150</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#141419] border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between shadow-2xl">
                                    <div className="space-y-8">
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-6 flex items-center gap-3">
                                            <Layers className="text-[#00ff88]" size={16} /> Data Manifest
                                        </h4>
                                        <div className="space-y-5">
                                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Designation</span>
                                                <span className="text-sm font-black text-white truncate max-w-[180px] italic underline decoration-[#00ff88]/30">{formData.name || 'UNNAMED'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Host Engine</span>
                                                <span className="text-sm font-black text-[#00ff88] italic">{games.find(g => g._id === formData.gameId)?.title || 'UNCONFIGURED'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Region</span>
                                                    <span className="text-xs font-black text-white italic">{formData.region}</span>
                                                </div>
                                                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Mode</span>
                                                    <span className="text-xs font-black text-[#00ff88] italic">{formData.gameMode}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Slots</span>
                                                <span className="text-sm font-black text-white italic">{formData.maxTeams} CORE UNITS</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 p-5 bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-[1.5rem] relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff88]" />
                                        <p className="text-[9px] font-black text-[#00ff88] leading-relaxed uppercase tracking-widest">FINAL AUTHORIZATION REQUIRED. PROCEEDING WILL INITIALIZE THE TOURNAMENT ACROSS ALL ARENA-CHAIN NODES.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={step === 1 ? onClose : prevStep}
                        className="h-14 gap-3 text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] px-8 rounded-2xl transition-all"
                    >
                        {step === 1 ? 'Abort Session' : <><ChevronLeft size={20} /> Re-Sync Previous Phase</>}
                    </Button>

                    <div className="flex gap-6">
                        {step < 4 ? (
                            <Button
                                onClick={nextStep}
                                className="h-14 px-10 bg-[#00ff88] text-black font-black hover:bg-[#00ff88]/80 shadow-[0_0_30px_rgba(0,255,136,0.2)] transition-all gap-3 rounded-2xl uppercase tracking-widest"
                                disabled={step === 1 && (!formData.name || !formData.gameId || !formData.organizerId)}
                            >
                                Next Phase <ChevronRight size={20} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSumbitFinal}
                                className="h-14 px-14 bg-white text-black font-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all gap-3 rounded-2xl uppercase tracking-[0.2em]"
                            >
                                <Trophy size={22} className="text-yellow-500" /> Initialize Deployment
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTournamentWizard;

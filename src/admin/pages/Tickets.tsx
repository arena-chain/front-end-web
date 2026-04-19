import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Plus, Ticket, Save, Trash2, Edit2, Check, X, Search, ArrowLeft, Settings,
    Cpu, Layers, ShoppingBag, ShieldAlert, Terminal, Bell, 
    ChevronDown, Zap, Fingerprint, Info
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/ui/core';
import { QRCodeCanvas } from 'qrcode.react';
import type { Tournament } from '../../models/tournament';
import type { TicketType } from '../../models/ticket';
import tournamentService from '../../services/tournamentService';
import ticketService from '../../services/ticketService';
import SuccessModal from '../../components/ui/SuccessModal';

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-8 py-4 transition-all border-l-2 ${
        active 
          ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]' 
          : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );
  
  const InputField = ({ label, placeholder, type = "text", value, onChange }: any) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest font-bold">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-zinc-900 border border-[#00FF41]/20 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00FF41]/50 placeholder:text-zinc-700 transition-all font-medium"
        />
      </div>
    </div>
  );

const normalizeTicketType = (ticket: any): TicketType => {
    // If ticket is a string (legacy/unpopulated ID), return a placeholder or handle accordingly
    if (typeof ticket === 'string') {
        return { name: '', price: 0, capacity: 0, bundles: [] };
    }
    
    return {
        name: String(ticket?.name ?? ticket?.type ?? ticket?.ticketType ?? ticket?.label ?? '').trim(),
        price: Number(ticket?.price ?? ticket?.amount ?? ticket?.cost ?? 0) || 0,
        capacity: Number(ticket?.capacity ?? ticket?.maxCapacity ?? ticket?.quantity ?? ticket?.stock ?? 0) || 0,
        bundles: Array.isArray(ticket?.bundles) ? ticket.bundles : [],
        isNft: Boolean(
            ticket?.isNft
            ?? ticket?.nft
            ?? (typeof ticket?.name === 'string' && ticket.name.toUpperCase().includes('NFT'))
        ),
        perks: typeof ticket?.perks === 'string' ? ticket.perks : undefined,
        metadata: ticket?.metadata && typeof ticket.metadata === 'object' ? ticket.metadata : undefined,
    };
};

const isNftTicketType = (ticket: TicketType): boolean => {
    return Boolean(ticket?.isNft) || String(ticket?.name || '').toUpperCase().includes('NFT');
};

const isAllowedAdminTicketType = (ticket: TicketType): boolean => {
    const name = String(ticket?.name || '').trim().toUpperCase();
    if (!name) return false;
    // VIP and ELITE are managed elsewhere; allow STANDARD + NFT variants here.
    if (name === 'VIP' || name === 'ELITE') return false;
    return true;
};

const pickUsableTicketTypes = (input: any): TicketType[] => {
    if (!Array.isArray(input)) return [];
    return input.map(normalizeTicketType).filter((t) => t.name);
};

export default function Tickets() {
    const location = useLocation();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'edit'>('list');

    // Editor State
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [saving, setSaving] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });
    const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);
    const [autoAddOnEnter, setAutoAddOnEnter] = useState(false);

    // Editing Row State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<TicketType | null>(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        const state = location.state as { selectedTournamentId?: string; openEditor?: boolean } | null;
        if (!state?.openEditor || !state.selectedTournamentId) return;
        setSelectedTournamentId(state.selectedTournamentId);
        setView('edit');
    }, [location.state]);

    useEffect(() => {
        const state = location.state as { refreshNow?: boolean } | null;
        if (!state?.refreshNow) return;
        fetchTournaments();
    }, [location.state]);

    // When entering edit mode or changing selection
    // When entering edit mode or changing selection
    useEffect(() => {
        const loadTicketDetails = async () => {
            if (!selectedTournamentId) {
                setTicketTypes([]);
                return;
            }
            setLoadingTicketDetails(true);

            // If not populated (i.e., we have IDs or nothing), fetch from backend
            try {
                // Read both sources because backend implementations may differ.
                const [tournamentResult, availableResult] = await Promise.allSettled([
                    tournamentService.fetchTournamentById(selectedTournamentId),
                    ticketService.getAvailableTickets(selectedTournamentId),
                ]);

                const tournamentTypes =
                    tournamentResult.status === 'fulfilled'
                        ? pickUsableTicketTypes((tournamentResult.value as any)?.ticketTypes)
                        : [];

                const availablePayload = availableResult.status === 'fulfilled' ? availableResult.value : null;
                const availableTypes = pickUsableTicketTypes(
                    Array.isArray((availablePayload as any)?.availableTickets)
                        ? (availablePayload as any).availableTickets
                        : availablePayload
                );

                const finalTypes = tournamentTypes.length > 0 ? tournamentTypes : availableTypes;
                setTicketTypes(finalTypes.filter(isAllowedAdminTicketType));
            } catch (error) {
                console.error('Failed to fetch ticket details', error);
                // Fallback to local state if API fails
                const tournament = tournaments.find(t => t._id === selectedTournamentId);
                setTicketTypes(
                    (Array.isArray(tournament?.ticketTypes) ? tournament!.ticketTypes! : [])
                        .map(normalizeTicketType)
                        .filter(isAllowedAdminTicketType)
                        .filter((t) => t.name)
                );
            } finally {
                setLoadingTicketDetails(false);
            }
        };

        loadTicketDetails();
    }, [selectedTournamentId, tournaments]);

    useEffect(() => {
        if (!autoAddOnEnter || !selectedTournamentId || loadingTicketDetails || view !== 'edit') return;
        const newTicket: TicketType = { name: 'STANDARD', price: 0, capacity: 100, bundles: [], isNft: false };
        setTicketTypes((prev) => {
            const updated = [...prev, newTicket];
            setEditingIndex(updated.length - 1);
            setEditData(newTicket);
            return updated;
        });
        setAutoAddOnEnter(false);
    }, [autoAddOnEnter, selectedTournamentId, loadingTicketDetails, view]);

    useEffect(() => {
        if (editingIndex === null) return;
        if (ticketTypes[editingIndex]) return;
        setEditingIndex(ticketTypes.length > 0 ? 0 : null);
    }, [editingIndex, ticketTypes]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const data = await tournamentService.fetchTournaments();
            setTournaments(data);
        } catch (error) {
            console.error('Failed to fetch tournaments', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Computed ---
    const tournamentsWithTickets = useMemo(() => {
        return tournaments.filter(t => t.ticketTypes && t.ticketTypes.length > 0);
    }, [tournaments]);

    const tournamentsWithoutTickets = useMemo(() => {
        return tournaments.filter(t => !t.ticketTypes || t.ticketTypes.length === 0);
    }, [tournaments]);

    const selectedTournament = tournaments.find(t => t._id === selectedTournamentId);

    // --- Actions ---

    const handleManageClick = (id: string) => {
        setSelectedTournamentId(id);
        setView('edit');
    };

    const handleCreateNewClick = (id: string) => {
        if (!id) return;
        setSelectedTournamentId(id);
        setView('edit');
        // Optionally auto-add a default ticket type here if desired
    };

    const handleQuickAddTicket = (id: string) => {
        if (!id) return;
        setSelectedTournamentId(id);
        setView('edit');
        setAutoAddOnEnter(true);
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedTournamentId('');
        setEditingIndex(null);
        setEditData(null);
        fetchTournaments(); // Refresh data on back
    };

    const handleAddTicketType = () => {
        const newTicket: TicketType = { name: 'STANDARD', price: 0, capacity: 100, bundles: [], isNft: false };
        setTicketTypes([...ticketTypes, newTicket]);
        setEditingIndex(ticketTypes.length);
        setEditData(newTicket);
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditData({ ...ticketTypes[index] });
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditData(null);
    };

    const saveEdit = () => {
        if (editData && editingIndex !== null) {
            const newTypes = [...ticketTypes];
            newTypes[editingIndex] = {
                ...editData,
                price: Number(editData.price) || 0,
                capacity: Number(editData.capacity) || 0
            };
            setTicketTypes(newTypes);
            setEditingIndex(null);
            setEditData(null);
        }
    };

    const handleSaveChangesToBackend = async () => {
        if (!selectedTournamentId) return;

        setSaving(true);
        try {
            const cleanedTicketTypes = ticketTypes
                .map(normalizeTicketType)
                .filter((ticket) => ticket.name && ticket.capacity >= 0 && ticket.price >= 0);
            const result = await ticketService.addTicketTypesToTournament(selectedTournamentId, cleanedTicketTypes);
            
            setSuccessModal({
                isOpen: true,
                title: 'Sequence Initialized',
                message: 'Neural assets have been successfully transmitted to the tournament grid.'
            });

            // 1. Refresh the main tournaments list
            await fetchTournaments();
            
            // 2. If the backend returned the updated tournament with populated ticketTypes, we can sync immediately
            if (result && Array.isArray(result.ticketTypes)) {
                const newTypes = pickUsableTicketTypes(result.ticketTypes);
                if (newTypes.length > 0) {
                    setTicketTypes(newTypes);
                    // Reset editing to the first one if it was null
                    if (editingIndex === null) setEditingIndex(0);
                }
            }
        } catch (error) {
            console.error('Failed to save tickets', error);
            alert('Failed to save tickets');
        } finally {
            setSaving(false);
        }
    };

    // --- Render Views ---

    const renderDashboard = () => (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Ticket Management</h1>
                    <p className="text-text-muted">Manage ticket types and pricing for tournaments.</p>
                </div>
            </div>

            {/* List of Configured Tournaments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map(t => {
                    const totalRevenue = t.ticketTypes?.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.capacity || 0)), 0) || 0;
                    const typeCount = t.ticketTypes?.length || 0;
                    const hasTickets = typeCount > 0;
                    const statusLabel = typeof t.status === 'string' ? t.status.replace('_', ' ') : 'UNKNOWN';
                    const gameTitle =
                        t.gameId && typeof t.gameId === 'object' && 'title' in t.gameId
                            ? (t.gameId as any).title
                            : 'Game';

                    return (
                        <div key={t._id} className="bg-[#1A1D21] border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="h-32 -mx-6 -mt-6 mb-5 overflow-hidden relative">
                                <img
                                    src={t.bannerImageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'}
                                    alt={t.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D21] via-[#1A1D21]/40 to-transparent" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <Badge variant={t.status === 'OPEN_REGISTRATION' ? 'success' : 'secondary'}>
                                    {statusLabel}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 truncate">{t.name}</h3>
                            <p className="text-text-muted text-sm mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                {gameTitle}
                            </p>

                            <div className="mb-6 text-sm text-zinc-400">
                                {typeCount > 0
                                    ? `${typeCount} ticket type(s) configured`
                                    : 'No ticket types configured yet'}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    onClick={() => handleManageClick(t._id)}
                                    variant="outline"
                                    className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 hover:text-white"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    {hasTickets ? 'Manage' : 'Configure'}
                                </Button>
                                <Button
                                    onClick={() => handleQuickAddTicket(t._id)}
                                    className="w-full bg-primary text-black hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {hasTickets ? 'Add Ticket' : 'Initialize'}
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {tournaments.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <Ticket className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No Tournaments Found</h3>
                        <p className="text-text-muted mb-6">Create tournaments first, then configure ticket types here.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderEditor = () => {
        const fallbackTicket: TicketType = { name: 'STANDARD', price: 0, capacity: 0, bundles: [] };
        const selectedTicket =
            (editingIndex !== null ? ticketTypes[editingIndex] : ticketTypes[0]) || fallbackTicket;
        const selectedIsNft =
            Boolean(selectedTicket.isNft)
            || String(selectedTicket.name || '').toUpperCase().includes('NFT');
        
        const updateCurrentTicket = (field: keyof TicketType, value: any) => {
            if (editingIndex === null && ticketTypes.length > 0) {
                setEditingIndex(0);
            }
            const newTypes = [...ticketTypes];
            const index = editingIndex === null || !newTypes[editingIndex] ? 0 : editingIndex;
            if (newTypes[index]) {
                newTypes[index] = { ...newTypes[index], [field]: value };
                setTicketTypes(newTypes);
            } else {
                const newTicket = { name: 'NEW_ASSET', price: 0, capacity: 0, bundles: [] };
                (newTicket as any)[field] = value;
                setTicketTypes([newTicket]);
                setEditingIndex(0);
            }
        };

        const handleProtocolSelect = (protocol: 'STANDARD' | 'NFT') => {
            if (protocol === 'NFT') {
                updateCurrentTicket('isNft', true);
                if (!String(selectedTicket.name || '').toUpperCase().includes('NFT')) {
                    updateCurrentTicket('name', 'VIP NFT');
                }
                return;
            }
            updateCurrentTicket('isNft', false);
            if (String(selectedTicket.name || '').toUpperCase().includes('NFT')) {
                updateCurrentTicket('name', 'STANDARD');
            }
        };

        return (
            <div className="flex-1 grid grid-cols-12 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] min-h-[calc(100vh-120px)] border border-[#00FF41]/10 rounded-xl">
                {/* Form Section */}
                <section className="col-span-12 lg:col-span-5 p-10 border-r border-[#00FF41]/5 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#00FF41] shadow-[0_0_10px_#00FF41]" />
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">Minting_Configuration</h2>
                        </div>
                        <Button variant="ghost" onClick={handleBackToList} className="h-8 w-8 p-0 rounded-full border border-white/10">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest font-bold">League_Identification</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-zinc-900 border border-[#00FF41]/20 rounded-sm px-4 py-3 text-sm appearance-none focus:outline-none focus:border-[#00FF41]/50 text-white"
                                    value={selectedTournamentId}
                                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                                >
                                    {tournaments.map(t => (
                                        <option key={t._id} value={t._id}>{(t.name || 'UNTITLED').toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-[#00FF41]/40" size={16} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <InputField 
                                label="Asset_Title_String" 
                                placeholder="e.g. GRAND_FINAL_2024" 
                                value={selectedTicket.name}
                                onChange={(e: any) => updateCurrentTicket('name', e.target.value)}
                            />
                            <InputField 
                                label="Price_Vector" 
                                type="number"
                                placeholder="0.00" 
                                value={selectedTicket.price}
                                onChange={(e: any) => updateCurrentTicket('price', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <InputField 
                                label="Temporal_Stamp" 
                                type="datetime-local" 
                                value={selectedTournament?.startDate ? new Date(selectedTournament.startDate).toISOString().slice(0, 16) : ''}
                            />
                            <InputField 
                                label="Node_Location" 
                                placeholder="TUNISIA" 
                                value="TUNISIA"
                                readOnly
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <InputField 
                                label="Total_Capacity" 
                                type="number"
                                placeholder="100" 
                                value={selectedTicket.capacity}
                                onChange={(e: any) => updateCurrentTicket('capacity', parseInt(e.target.value))}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest font-bold">Access_Protocol</label>
                                <div className="flex border border-[#00FF41]/20 rounded-sm p-1 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleProtocolSelect('STANDARD')}
                                        className={`flex-1 py-2 text-[10px] font-bold tracking-tighter rounded-sm transition-all ${
                                            !selectedIsNft ? 'bg-[#00FF41] text-black shadow-[0_0_15px_#00FF41]' : 'text-zinc-500 hover:text-zinc-200'
                                        }`}
                                    >
                                        STANDARD
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleProtocolSelect('NFT')}
                                        className={`flex-1 py-2 text-[10px] font-bold tracking-tighter rounded-sm transition-all ${
                                            selectedIsNft ? 'bg-violet-400/25 text-violet-200 border border-violet-300/30' : 'text-zinc-500 hover:text-zinc-200'
                                        }`}
                                    >
                                        NFT
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#00FF41]/5">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest font-bold">Configured_Assets</label>
                                <Button size="sm" onClick={handleAddTicketType} className="h-6 text-[9px] bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20">
                                    + ADD_TYPE
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                {ticketTypes.map((t, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setEditingIndex(idx)}
                                        className={`flex items-center justify-between p-3 rounded-sm border cursor-pointer transition-all ${editingIndex === idx ? 'bg-[#00FF41]/5 border-[#00FF41]/30' : 'bg-black/20 border-white/5 hover:border-[#00FF41]/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-3 ${editingIndex === idx ? 'bg-[#00FF41]' : 'bg-zinc-700'}`} />
                                            <span className={`text-[10px] font-bold tracking-widest ${editingIndex === idx ? 'text-[#00FF41]' : 'text-zinc-400'}`}>{t.name || 'UNTITLED'}</span>
                                            {(Boolean(t.isNft) || String(t.name || '').toUpperCase().includes('NFT')) && (
                                                <span className="px-1.5 py-0.5 rounded border border-amber-300/40 bg-amber-400/15 text-amber-300 text-[8px] font-black tracking-widest">
                                                    NFT
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-mono text-zinc-500">${t.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveChangesToBackend}
                            disabled={saving}
                            className={`w-full py-5 bg-[#00FF41] text-black font-black tracking-[0.2em] uppercase rounded-sm shadow-[0_0_30px_rgba(0,255,65,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-8 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {saving ? 'Processing_Transmission...' : 'Initialize_Mint_Sequence'}
                        </button>
                    </div>
                </section>

                {/* Preview Section */}
                <section className="col-span-12 lg:col-span-7 p-10 bg-zinc-950/30 flex flex-col relative overflow-hidden min-h-[600px]">
                    {/* Visual background decoration */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FF41]/5 rounded-full blur-[120px] -z-10" />
                    {selectedIsNft && (
                        <div className="absolute top-10 right-12 w-[340px] h-[340px] bg-violet-500/20 rounded-full blur-[120px] -z-10" />
                    )}
                    
                    <div className="flex-1 flex items-center justify-center">
                        <div className={`w-full max-w-[450px] aspect-[4/5] border rounded-sm relative overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col group transition-all duration-700 ${
                            selectedIsNft
                                ? 'bg-gradient-to-br from-[#140f2c] via-[#1b183d] to-[#0f1230] border-violet-400/25 hover:border-violet-300/40'
                                : 'bg-zinc-900/80 border-[#00FF41]/10 hover:border-[#00FF41]/30'
                        }`}>
                            
                            {/* Tournament Image Background */}
                            <div className={`absolute inset-0 z-0 transition-opacity duration-700 ${
                                selectedIsNft ? 'opacity-35 group-hover:opacity-45' : 'opacity-20 group-hover:opacity-30'
                            }`}>
                                {selectedTournament?.bannerImageUrl ? (
                                    <img 
                                        src={selectedTournament.bannerImageUrl} 
                                        alt="" 
                                        className="w-full h-full object-cover grayscale brightness-50"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
                                )}
                            </div>

                            <div className="p-8 flex-1 relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div className={`text-[10px] font-bold tracking-widest uppercase italic font-mono ${
                                        selectedIsNft ? 'text-violet-200/70' : 'text-[#00FF41]/40'
                                    }`}>
                                        {selectedIsNft ? 'NFT Ticket // Premium Access' : 'Arena_Protocol // Asset'}
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest -rotate-12 shadow-[0_0_15px_rgba(168,85,247,0.3)] border ${
                                        selectedIsNft
                                        ? 'bg-amber-500/15 text-amber-300 border-amber-300/40'
                                        : (selectedTicket.name || '').toUpperCase().includes('VIP') 
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-400/30' 
                                        : 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/30 shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                                    }`}>
                                        {selectedIsNft ? 'NFT_SPECIAL' : (selectedTicket.name || 'STANDARD').toUpperCase()}_TIER
                                    </div>
                                </div>

                                {selectedIsNft && (
                                    <div className="rounded-2xl border border-violet-300/30 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-blue-500/15 p-4 mb-8 shadow-[0_0_30px_rgba(139,92,246,0.25)]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] text-violet-100/80 font-black uppercase tracking-[0.2em]">NFT Ticket</p>
                                                <p className="text-white text-lg font-black leading-tight mt-1 line-clamp-2">
                                                    {selectedTournament?.name || 'Arena Championship'}
                                                </p>
                                                <p className="text-[11px] text-violet-100/80 mt-2">
                                                    {selectedTicket.name || 'VIP NFT'} • ${selectedTicket.price}
                                                </p>
                                            </div>
                                            <div className="p-2 rounded-xl bg-white/90 shadow-lg shrink-0">
                                                <QRCodeCanvas
                                                    value={`NFT_TICKET:${selectedTournament?._id}:${selectedTicket.name}:SPECIAL`}
                                                    size={62}
                                                    level="M"
                                                    includeMargin={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-4xl font-black tracking-tighter text-zinc-100 uppercase leading-none mb-12 group-hover:text-[#00FF41] transition-colors">
                                    {(selectedTournament?.name || 'ARENA_CHAMPIONSHIP').split(' ').map((word, i) => (
                                        <span key={i}>{word}{i === 1 ? <br/> : ' '}</span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-y-8">
                                    <div>
                                        <div className="text-[10px] text-[#00FF41]/40 uppercase tracking-widest font-bold mb-1">Event_ID</div>
                                        <div className="text-zinc-100 font-bold truncate pr-4">{selectedTournament?._id?.toUpperCase() || 'E_NULL_00'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[#00FF41]/40 uppercase tracking-widest font-bold mb-1">Temporal_Node</div>
                                        <div className="text-zinc-100 font-bold uppercase">{selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'DEC 12'} // {selectedTournament?.startDate ? new Date(selectedTournament.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '21:00'} UTC</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[#00FF41]/40 uppercase tracking-widest font-bold mb-1">Geographic_Lock</div>
                                        <div className="text-zinc-100 font-bold uppercase italic font-mono">Tunisia_Arena</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[#00FF41]/40 uppercase tracking-widest font-bold mb-1">Asset_Value</div>
                                        <div className={`font-black uppercase italic text-xl ${
                                            selectedIsNft ? 'text-violet-200' : 'text-[#00FF41]'
                                        }`}>
                                            ${selectedTicket.price}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 border-t bg-zinc-950/50 flex justify-between items-end relative z-10 ${
                                selectedIsNft ? 'border-violet-300/20' : 'border-[#00FF41]/10'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white rounded-sm">
                                        <QRCodeCanvas 
                                            value={`TICKET:${selectedTournament?._id}:${selectedTicket.name}`} 
                                            size={48}
                                            level="L"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div>
                                        <div className={`text-[8px] uppercase font-bold tracking-widest mb-0.5 ${
                                            selectedIsNft ? 'text-violet-200/60' : 'text-[#00FF41]/40'
                                        }`}>
                                            Asset_Token_ID
                                        </div>
                                        <div className={`text-[10px] font-mono tracking-tighter ${
                                            selectedIsNft ? 'text-violet-200' : 'text-[#00FF41]'
                                        }`}>
                                            0x{Math.random().toString(16).slice(2, 6).toUpperCase()}...{Math.random().toString(16).slice(2, 6).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[8px] uppercase font-bold tracking-widest mb-0.5 ${
                                        selectedIsNft ? 'text-violet-200/60' : 'text-[#00FF41]/40'
                                    }`}>
                                        Encryption_Status
                                    </div>
                                    <div className={`text-[10px] font-bold tracking-tight uppercase ${
                                        selectedIsNft ? 'text-violet-200' : 'text-[#00FF41]'
                                    }`}>
                                        SECURED_BY_ARENA
                                    </div>
                                </div>
                            </div>

                            {/* Biometric Lock Overlay */}
                            <div className="absolute top-8 right-8 flex items-center gap-2 bg-black/60 border border-[#00FF41]/20 px-4 py-2 rounded-sm backdrop-blur-sm z-20">
                                <Fingerprint size={14} className="text-[#00FF41]" />
                                <span className="text-[8px] text-zinc-100 font-bold uppercase tracking-widest">Biometric_Locked</span>
                            </div>

                            {/* Scan Line Effect */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#00FF41]/0 via-[#00FF41]/5 to-[#00FF41]/0 h-20 w-full animate-scan-slow opacity-20" />
                        </div>
                    </div>
                </section>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #00FF4122;
                        border-radius: 2px;
                    }
                    @keyframes scan-slow {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(500%); }
                    }
                    .animate-scan-slow {
                        animation: scan-slow 4s linear infinite;
                    }
                `}</style>
            </div>
        );
    };

    return (
        <div className="pb-10">
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF41]"></div>
                </div>
            ) : view === 'list' ? renderDashboard() : renderEditor()}

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
            />
        </div>
    );
}

import { useState, useEffect, useMemo } from 'react';
import { Plus, Ticket, Save, Trash2, Edit2, Check, X, Search, ArrowLeft, Settings } from 'lucide-react';
import { Button, Input, Badge } from '../../components/ui/core';
import type { Tournament } from '../../models/tournament';
import type { TicketType } from '../../models/ticket';
import tournamentService from '../../services/tournamentService';
import ticketService from '../../services/ticketService';
import SuccessModal from '../../components/ui/SuccessModal';

export default function Tickets() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'edit'>('list');

    // Editor State
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [saving, setSaving] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

    // Editing Row State
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editData, setEditData] = useState<TicketType | null>(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    // When entering edit mode or changing selection
    // When entering edit mode or changing selection
    useEffect(() => {
        const loadTicketDetails = async () => {
            if (!selectedTournamentId) {
                setTicketTypes([]);
                return;
            }

            // First, check if we already have populated data in the local state (optimization)
            const tournament = tournaments.find(t => t._id === selectedTournamentId);

            // Debug check: see if we have objects or strings
            const hasPopulatedTickets = tournament?.ticketTypes &&
                tournament.ticketTypes.length > 0 &&
                typeof tournament.ticketTypes[0] === 'object';

            if (hasPopulatedTickets) {
                setTicketTypes(tournament.ticketTypes!);
                return;
            }

            // If not populated (i.e., we have IDs or nothing), fetch from backend
            try {
                // Try to get available tickets first (as per doc)
                const data = await ticketService.getAvailableTickets(selectedTournamentId);

                // The endpoint might return { result: ..., availableTickets: ... } or just the array or the tournament object
                // Based on doc: Returns: { tournament: {...}, availableTickets: [...] }
                if (data.availableTickets) {
                    setTicketTypes(data.availableTickets);
                } else if (Array.isArray(data)) {
                    setTicketTypes(data);
                } else {
                    // Fallback: maybe the tournament object was returned with populated types?
                    if (data.ticketTypes) {
                        setTicketTypes(data.ticketTypes);
                    } else {
                        console.warn('Unexpected response structure for tickets:', data);
                        setTicketTypes([]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch ticket details', error);
                // Fallback to empty if fail
                setTicketTypes([]);
            }
        };

        loadTicketDetails();
    }, [selectedTournamentId, tournaments]);

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

    const handleBackToList = () => {
        setView('list');
        setSelectedTournamentId('');
        setEditingIndex(null);
        setEditData(null);
        fetchTournaments(); // Refresh data on back
    };

    const handleAddTicketType = () => {
        const newTicket: TicketType = { name: 'Standard', price: 0, capacity: 100, bundles: [] };
        setTicketTypes([...ticketTypes, newTicket]);
        setEditingIndex(ticketTypes.length);
        setEditData(newTicket);
    };

    const handleRemoveTicketType = (index: number) => {
        if (window.confirm('Are you sure you want to remove this ticket type?')) {
            const newTypes = [...ticketTypes];
            newTypes.splice(index, 1);
            setTicketTypes(newTypes);
        }
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
            await ticketService.addTicketTypesToTournament(selectedTournamentId, ticketTypes);
            setSuccessModal({
                isOpen: true,
                title: 'Changes Saved!',
                message: 'Tournament ticket configuration has been updated successfully.'
            });
            // We don't fetch immediately here to keep the user in the flow, 
            // but we update the local touraments state potentially?
            // Safer to just re-fetch on back or now.
            await fetchTournaments();
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

                {/* Quick Add for New Tournaments */}
                <div className="flex gap-2">
                    <div className="relative">
                        <select
                            className="h-11 bg-primary text-black font-bold uppercase tracking-wider pl-4 pr-10 rounded-lg cursor-pointer outline-none hover:bg-primary/90 transition-colors appearance-none"
                            onChange={(e) => handleCreateNewClick(e.target.value)}
                            value=""
                        >
                            <option value="" disabled>+ Configure New Tournament</option>
                            {tournamentsWithoutTickets.map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                            {tournamentsWithoutTickets.length === 0 && (
                                <option disabled>All tournaments configured</option>
                            )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Plus className="w-4 h-4 text-black" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Configured Tournaments */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournamentsWithTickets.map(t => {
                    const totalRevenue = t.ticketTypes?.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.capacity || 0)), 0) || 0;
                    const typeCount = t.ticketTypes?.length || 0;

                    return (
                        <div key={t._id} className="bg-[#1A1D21] border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <Badge variant={t.status === 'OPEN_REGISTRATION' ? 'success' : 'secondary'}>
                                    {t.status.replace('_', ' ')}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 truncate">{t.name}</h3>
                            <p className="text-text-muted text-sm mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                {typeof t.gameId === 'object' ? t.gameId.title : 'Game'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <span className="text-xs text-text-muted block uppercase tracking-wider mb-1">Types</span>
                                    <span className="text-lg font-bold text-white">{typeCount}</span>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <span className="text-xs text-text-muted block uppercase tracking-wider mb-1">Est. Rev</span>
                                    <span className="text-lg font-bold text-green-400">${totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button onClick={() => handleManageClick(t._id)} variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:border-white/20 hover:text-white">
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Tickets
                            </Button>
                        </div>
                    );
                })}

                {tournamentsWithTickets.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <Ticket className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No Configured Tournaments</h3>
                        <p className="text-text-muted mb-6">Select a tournament from the button above to start selling tickets.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="space-y-6 animate-fade-in-up pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={handleBackToList} className="h-10 w-10 p-0 rounded-full border border-white/10">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black uppercase text-white">{selectedTournament?.name}</h1>
                    <p className="text-text-muted flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Editing Ticket Configuration
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1D21] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Ticket className="w-5 h-5" /></div>
                    <div>
                        <p className="text-text-muted text-xs uppercase font-bold">Total Types</p>
                        <p className="text-2xl font-black text-white">{ticketTypes.length}</p>
                    </div>
                </div>
                <div className="bg-[#1A1D21] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Check className="w-5 h-5" /></div>
                    <div>
                        <p className="text-text-muted text-xs uppercase font-bold">Total Capacity</p>
                        <p className="text-2xl font-black text-white">
                            {ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="bg-[#1A1D21] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500"><Search className="w-5 h-5" /></div>
                    <div>
                        <p className="text-text-muted text-xs uppercase font-bold">Potential Revenue</p>
                        <p className="text-2xl font-black text-white">
                            ${ticketTypes.reduce((acc, t) => acc + ((t.price || 0) * (t.capacity || 0)), 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor Table */}
            <div className="bg-[#1A1D21] border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="font-bold text-white">Ticket Types</h3>
                    <Button onClick={handleAddTicketType} className="gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> Add New Type
                    </Button>
                </div>

                {ticketTypes.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ticket className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-lg font-bold text-white">No Tickets Configured</h3>
                        <p className="text-text-muted mb-6">Add a ticket type to get started.</p>
                        <Button onClick={handleAddTicketType} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Create First Ticket
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black/40 text-xs font-bold uppercase text-text-muted tracking-wider border-b border-white/5">
                                    <th className="p-4 pl-6">Name</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Capacity</th>
                                    <th className="p-4">Est. Revenue</th>
                                    <th className="p-4 text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ticketTypes.map((ticket, index) => {
                                    const isEditing = editingIndex === index;

                                    if (isEditing && editData) {
                                        return (
                                            <tr key={index} className="bg-primary/5">
                                                <td className="p-4 pl-6">
                                                    <Input
                                                        value={editData.name}
                                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                        className="bg-black border-primary/50 text-white font-bold h-9"
                                                        placeholder="Name"
                                                        autoFocus
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="relative w-32">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                        <Input
                                                            type="number"
                                                            value={editData.price}
                                                            onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                                                            className="bg-black border-primary/50 text-white pl-6 h-9"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        value={editData.capacity}
                                                        onChange={(e) => setEditData({ ...editData, capacity: parseInt(e.target.value) })}
                                                        className="bg-black border-primary/50 text-white w-32 h-9"
                                                    />
                                                </td>
                                                <td className="p-4 text-text-muted font-mono">
                                                    ${((editData.price || 0) * (editData.capacity || 0)).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0 rounded-full">
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-full">
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={index} className="group hover:bg-white/[0.02]">
                                            <td className="p-4 pl-6 font-bold text-white">{ticket.name}</td>
                                            <td className="p-4">
                                                <Badge variant="success" className="text-sm">
                                                    ${ticket.price?.toLocaleString() ?? 0}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-white">
                                                {ticket.capacity?.toLocaleString() ?? 0}
                                            </td>
                                            <td className="p-4 text-text-muted font-mono">
                                                ${((ticket.price || 0) * (ticket.capacity || 0)).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(index)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleRemoveTicketType(index)} className="hover:text-red-500">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Floating Save */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#121212]/90 backdrop-blur-md border-t border-white/5 z-50 flex justify-between items-center md:pl-80">
                <p className="text-text-muted text-sm hidden md:block">
                    Remember to save your changes before leaving.
                </p>
                <div className="flex gap-4 ml-auto">
                    <Button variant="ghost" onClick={handleBackToList}>Cancel</Button>
                    <Button
                        onClick={handleSaveChangesToBackend}
                        disabled={saving}
                        className="bg-primary text-black hover:bg-primary/90 font-bold px-8"
                    >
                        {saving ? (
                            'Saving...'
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="pb-20">
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

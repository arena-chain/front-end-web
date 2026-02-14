import { useState, useEffect } from 'react';
import { Plus, Trophy, Search, Loader2, Award, Users, Globe, Calendar } from 'lucide-react';
import { Button, Input } from '../../components/ui/core';
import { leagueService, type League } from '../../services/leagueService';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import StandingsModal from '../components/leagues/StandingsModal';
import { cn } from '../../lib/utils';

export default function AdminLeagues() {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingLeague, setEditingLeague] = useState<League | null>(null);
    const [isStandingsModalOpen, setIsStandingsModalOpen] = useState(false);
    const [selectedLeagueForStandings, setSelectedLeagueForStandings] = useState<{ id: string, name: string } | null>(null);
    const [tierFilter, setTierFilter] = useState<'all' | 'OFFICIAL' | 'COMMUNITY'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'UPCOMING' | 'ONGOING' | 'FINISHED'>('all');

    useEffect(() => {
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        setLoading(true);
        try {
            const data = await leagueService.getAllLeagues();
            setLeagues(data);
        } catch (error) {
            console.error('Failed to fetch leagues:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeague = async (data: any) => {
        try {
            const token = localStorage.getItem('token');

            if (token === 'bypass_token_dev_only') {
                alert('Attention: Vous utilisez le mode démo sans mot de passe. Pour enregistrer dans la base de données, déconnectez-vous et connectez-vous avec l\'email admin@admin.com et le mot de passe 123456.');
                return;
            }

            if (!token) {
                alert('Session expirée. Veuillez vous reconnecter.');
                return;
            }

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const method = editingLeague ? 'PATCH' : 'POST';
            const url = editingLeague
                ? `${baseUrl}/leagues/${editingLeague._id}`
                : `${baseUrl}/leagues`;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert(editingLeague ? 'League updated successfully!' : 'League created successfully!');
                fetchLeagues();
                setIsCreateModalOpen(false);
                setEditingLeague(null);
            } else {
                const errData = await response.json();
                // Return errors to the modal instead of alerting
                throw errData;
            }
        } catch (error) {
            console.error('Failed to save league:', error);
            throw error; // Rethrow to be caught by modal
        }
    };

    const handleEditLeague = (league: League) => {
        setEditingLeague(league);
        setIsCreateModalOpen(true);
    };

    const handleViewStandings = (league: League) => {
        setSelectedLeagueForStandings({ id: league._id, name: league.name });
        setIsStandingsModalOpen(true);
    };

    const handleDeleteLeague = async (id: string) => {
        if (!confirm('Are you sure you want to delete this league? This will remove all participants as well.')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:3000/leagues/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchLeagues();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDistributeRewards = async (leagueId: string) => {
        if (!confirm('Are you sure you want to distribute rewards for this league? This will credit points to all winners.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/leagues/${leagueId}/distribute-rewards`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Rewards distributed successfully!');
                fetchLeagues();
            } else {
                const data = await response.json();
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Reward distribution failed:', error);
        }
    };

    const filteredLeagues = leagues.filter((l: League) => {
        const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = tierFilter === 'all' || l.tier === tierFilter;
        const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchesSearch && matchesTier && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Official Leagues</h1>
                    <p className="text-text-muted">Manage seasonal platform-controlled ranking competitions.</p>
                </div>
                <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Create League
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-surface border border-white/5 p-4 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search leagues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value as any)}
                        className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                        <option value="all">Tous les Tiers</option>
                        <option value="OFFICIAL">Officiel</option>
                        <option value="COMMUNITY">Communauté</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                        <option value="all">Tous les Statuts</option>
                        <option value="UPCOMING">À venir</option>
                        <option value="ONGOING">En cours</option>
                        <option value="FINISHED">Terminé</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            ) : filteredLeagues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeagues.map((league: League) => (
                        <div key={league._id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all duration-300 flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest border border-primary/30">
                                        {league.tier}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest",
                                        league.status === 'ONGOING' ? 'text-green-500' :
                                            league.status === 'UPCOMING' ? 'text-blue-500' : 'text-text-muted'
                                    )}>
                                        {league.status}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 group-hover:text-primary transition-colors leading-none">
                                    {league.name}
                                </h3>

                                <div className="flex flex-col gap-4 mb-8">
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Globe className="w-4 h-4 text-primary/80" />
                                        <span className="uppercase">{league.regionFilter}: {league.regionValue || 'Global'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Users className="w-4 h-4 text-blue-400/80" />
                                        <span className="uppercase">{league.mode}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                        <Calendar className="w-4 h-4 text-orange-400/80" />
                                        <span>{new Date(league.startDate).toLocaleDateString()} - {new Date(league.endDate).toLocaleDateString()}</span>
                                    </div>
                                    {league.supervisedBy && league.supervisedBy.length > 0 && (
                                        <div className="flex items-center gap-3 text-xs text-text-muted font-bold tracking-tight">
                                            <Award className="w-4 h-4 text-yellow-400/80" />
                                            <span>MODERATORS: {league.supervisedBy.length}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest"
                                        onClick={() => handleViewStandings(league)}
                                    >
                                        <Trophy className="w-3 h-3 mr-1" /> Standings
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest"
                                        onClick={() => handleEditLeague(league)}
                                    >
                                        Edit
                                    </Button>
                                    {league.status === 'FINISHED' && !league.rewardsDistributed && (
                                        <Button
                                            size="sm"
                                            className="col-span-2 bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-widest"
                                            onClick={() => handleDistributeRewards(league._id)}
                                        >
                                            Distribute Rewards
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="col-span-2 text-red-500 hover:bg-red-500/10 font-bold uppercase tracking-widest mt-2"
                                        onClick={() => handleDeleteLeague(league._id)}
                                    >
                                        Delete League
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <Trophy className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">No leagues found</h3>
                    <p className="text-text-muted">Create your first official league to start a new season.</p>
                </div>
            )}

            <CreateLeagueModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingLeague(null);
                }}
                onSubmit={handleCreateLeague}
                league={editingLeague || undefined}
            />

            <StandingsModal
                isOpen={isStandingsModalOpen}
                onClose={() => {
                    setIsStandingsModalOpen(false);
                    setSelectedLeagueForStandings(null);
                }}
                leagueId={selectedLeagueForStandings?.id || null}
                leagueName={selectedLeagueForStandings?.name || null}
            />
        </div>
    );
}

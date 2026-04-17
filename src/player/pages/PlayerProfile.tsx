import { useState, useEffect } from 'react';
import { User, Edit2, Share2, Trophy, Target, Sparkles, RefreshCw, Upload } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface UserProfile {
    _id: string;
    nickname: string;
    email: string;
    region?: string;
    avatar?: string;
    role: string;
}

const REGIONS = [
    { code: 'EUROPE', name: 'Europe' },
    { code: 'AFRICA', name: 'Afrique' },
    { code: 'ASIA', name: 'Asie' },
    { code: 'AMERICAS', name: 'Amériques' },
    { code: 'OCEANIA', name: 'Océanie' }
];

const TABS = [
    { id: 'resume', label: 'Résumé' },
    { id: 'matches', label: 'Historique de match' },
    { id: 'stats', label: 'Statistiques' },
    { id: 'leagues', label: 'Ligues' },
    { id: 'tournaments', label: 'Tournois' },
];

export default function PlayerProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('resume');
    const [nickname, setNickname] = useState('');
    const [region, setRegion] = useState('EUROPE');
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            setNickname(response.data.nickname);
            setRegion(response.data.region || 'EUROPE');
            setAvatar(response.data.avatar || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/auth/profile`, {
                nickname,
                region,
                avatar
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditing(false);
            fetchProfile();
        } catch (error: unknown) {
            console.error('Error updating profile:', error);
        }
    };

    const generateRandomAvatar = () => {
        const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'adventurer', 'miniavs', 'big-easel'];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        const newAvatar = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
        setAvatar(newAvatar);
        toast.success('Nouvel avatar généré !');
    };

    const AVATAR_PRESETS = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Dusty',
        'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mario',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha',
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const regionData = REGIONS.find(r => r.code === region);

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                <div className="flex border-b border-white/5">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === tab.id
                                ? 'text-primary bg-primary/5'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Profile Card */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3">
                    <div className="bg-surface border border-white/5 rounded-2xl p-6 sticky top-6">
                        {/* Avatar */}
                        <div className="relative mb-6 group flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-[#2a2a2a] border-4 border-[#1a1a1a] flex items-center justify-center overflow-hidden relative">
                                {avatar ? (
                                    <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <User className="w-16 h-16 text-[#4a4a4a]" />
                                )}
                                {editing && (
                                    <div
                                        onClick={generateRandomAvatar}
                                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white gap-1"
                                    >
                                        <RefreshCw className="w-6 h-6" />
                                        <span className="text-[10px] font-bold uppercase">Générer</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Username */}
                        {editing ? (
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full text-xl font-bold text-white text-center bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-primary"
                            />
                        ) : (
                            <h1 className="text-xl font-bold text-white mb-4 text-center">{profile?.nickname}</h1>
                        )}

                        {/* Region */}
                        {editing ? (
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary mb-4"
                            >
                                {REGIONS.map(r => (
                                    <option key={r.code} value={r.code}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-text-muted text-sm mb-4 text-center">
                                {regionData?.name}
                            </p>
                        )}

                        {/* Avatar Settings (when editing) */}
                        {editing && (
                            <div className="mb-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-primary" />
                                        Presets d'Avatars
                                    </label>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {AVATAR_PRESETS.map((p, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setAvatar(p);
                                                    toast.success('Avatar sélectionné !');
                                                }}
                                                className={`w-10 h-10 rounded-full border-2 transition-all overflow-hidden ${avatar === p ? 'border-primary scale-110' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                <img src={p} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
                                        Importer une Image
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => document.getElementById('avatar-upload')?.click()}
                                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-white text-xs hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Upload className="w-3.5 h-3.5 text-primary" />
                                            Choisir un fichier
                                        </button>
                                        <button
                                            type="button"
                                            onClick={generateRandomAvatar}
                                            className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg border border-primary/20 transition-all"
                                            title="Générer aléatoirement"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mb-6">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold py-2.5 px-4 rounded-lg uppercase text-xs tracking-wider transition-all"
                                    >
                                        Sauvegarder
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditing(false);
                                            setNickname(profile?.nickname || '');
                                            setRegion(profile?.region || 'EUROPE');
                                            setAvatar(profile?.avatar || '');
                                        }}
                                        className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-bold py-2.5 px-4 rounded-lg uppercase text-xs tracking-wider transition-all border border-white/10"
                                    >
                                        Annuler
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-bold py-2.5 px-4 rounded-lg uppercase text-xs tracking-wider transition-all border border-white/10 flex items-center justify-center gap-2"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Editer
                                    </button>
                                    <button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-bold py-2.5 px-4 rounded-lg transition-all border border-white/10">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Annonces Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Annonces</h3>
                            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-white/5">
                                <p className="text-text-muted text-xs text-center">Aucune annonce</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats & Activity */}
                <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-6">
                    {activeTab === 'resume' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Matchs */}
                                <div className="bg-surface border border-white/5 rounded-xl p-6 hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Trophy className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Matchs</p>
                                            <p className="text-3xl font-black text-white">0</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Victoires */}
                                <div className="bg-surface border border-white/5 rounded-xl p-6 hover:border-green-500/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Target className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Victoires</p>
                                            <p className="text-3xl font-black text-white">0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-surface border border-white/5 rounded-xl p-6">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Activité Récente</h2>
                                <div className="text-center py-12">
                                    <p className="text-text-muted text-sm">Aucune activité récente</p>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'matches' && (
                        <div className="bg-surface border border-white/5 rounded-xl p-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Historique de Match</h2>
                            <div className="text-center py-12">
                                <p className="text-text-muted text-sm">Aucun match joué</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="bg-surface border border-white/5 rounded-xl p-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Statistiques</h2>
                            <div className="text-center py-12">
                                <p className="text-text-muted text-sm">Aucune statistique disponible</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'leagues' && (
                        <div className="bg-surface border border-white/5 rounded-xl p-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Ligues</h2>
                            <div className="text-center py-12">
                                <p className="text-text-muted text-sm">Aucune ligue rejointe</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tournaments' && (
                        <div className="bg-surface border border-white/5 rounded-xl p-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6">Tournois</h2>
                            <div className="text-center py-12">
                                <p className="text-text-muted text-sm">Aucun tournoi rejoint</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

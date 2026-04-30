import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Plus, Ticket, Search, ArrowLeft, Settings,
    ChevronDown, Zap, Fingerprint, User as UserIcon, Shield, Edit3, Save, X
} from 'lucide-react';
import { Button, Badge } from '../../components/ui/core';
import { QRCodeCanvas } from 'qrcode.react';
import type { League } from '../../services/leagueService';
import { TicketCategory, type CreateTicketDto, type Ticket as TicketModel } from '../../models/ticket';
import { leagueService } from '../../services/leagueService';
import ticketService from '../../services/ticketService';
import { UserService, type User } from '../../services/userService';
import SuccessModal from '../../components/ui/SuccessModal';

const InputField = ({ label, placeholder, type = "text", value, onChange, readOnly = false }: any) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest font-bold">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full bg-zinc-900 border border-[#00FF41]/20 rounded-sm px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00FF41]/50 placeholder:text-zinc-700 transition-all font-medium ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
);

export default function Tickets() {
    const location = useLocation();
    const [leagues, setLeagues] = useState<League[]>([]);
    const [templates, setTemplates] = useState<TicketModel[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'edit-template'>('list');

    // Minting State removed

    // Template Editing State
    const [editingTemplate, setEditingTemplate] = useState<TicketModel | null>(null);

    const [saving, setSaving] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [leaguesData, usersData, templatesData] = await Promise.all([
                leagueService.getAllLeagues(),
                UserService.getAllUsers(),
                ticketService.getTemplates()
            ]);
            setLeagues(leaguesData);
            setUsers(usersData);
            setTemplates(templatesData);
            
        } catch (error) {
            console.error('Failed to fetch initial data', error);
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateTemplate = async () => {
        if (!editingTemplate) return;
        
        setSaving(true);
        try {
            const leagueId = typeof editingTemplate.league === 'string' ? editingTemplate.league : editingTemplate.league._id;
            await ticketService.updateTemplate(leagueId, {
                price: editingTemplate.price,
                type: editingTemplate.type
            });

            setSuccessModal({
                isOpen: true,
                title: 'Template Updated',
                message: `Standard ticket template for ${editingTemplate.type} has been updated.`
            });
            
            await fetchInitialData();
            setView('list');
        } catch (error: any) {
            console.error('Failed to update template', error);
            alert(error.message || 'Failed to update ticket template');
        } finally {
            setSaving(false);
        }
    };


    const renderDashboard = () => (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">League Tickets</h1>
                    <p className="text-text-muted">Manage standard tickets and mint manual NFT passes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leagues.map(l => {
                    const template = templates.find(t => {
                        const tLeagueId = typeof t.league === 'string' ? t.league : t.league._id;
                        return tLeagueId === l._id;
                    });

                    return (
                        <div key={l._id} className="bg-[#1A1D21] border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col">
                            <div className="h-32 -mx-6 -mt-6 mb-5 overflow-hidden relative shrink-0">
                                <img
                                    src={l.logoUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200'}
                                    alt={l.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D21] via-[#1A1D21]/40 to-transparent" />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <Badge variant="success">
                                    {l.level}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1 truncate">{l.name}</h3>
                             <div className="flex items-center justify-between mb-6">
                                <p className="text-text-muted text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                                    {l.regionId || 'Global'}
                                </p>
                                <div className="text-right space-y-1">
                                    {template && (
                                        <div>
                                            <p className="text-[8px] text-primary font-black uppercase tracking-widest">Standard</p>
                                            <p className="text-sm font-black text-white">${template.price}</p>
                                        </div>
                                    )}
                                    {Array.isArray(l.ticketTypes) && l.ticketTypes.filter((t: any) => (t.name || t.type).includes('NFT')).map((t: any, idx) => (
                                        <div key={idx} className="pt-1 border-t border-white/5">
                                            <p className="text-[8px] text-violet-400 font-black uppercase tracking-widest">{t.name || t.type}</p>
                                            <p className="text-sm font-black text-white">${t.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/5">
                                <Button
                                    onClick={() => {
                                        if (template) {
                                            setEditingTemplate(template);
                                            setView('edit-template');
                                        }
                                    }}
                                    variant="ghost"
                                    className="w-full border border-white/5 text-text-muted hover:text-primary hover:border-primary/30 text-[10px] font-black uppercase tracking-widest px-2"
                                >
                                    <Edit3 className="w-3 h-3 mr-1.5" />
                                    Edit Std
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderTemplateEditor = () => (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up py-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary shadow-[0_0_15px_rgba(0,255,65,0.4)]" />
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">Modify_Standard_Ticket</h2>
                        <p className="text-text-muted text-xs mt-1 uppercase tracking-widest font-bold opacity-60">League: {editingTemplate && (typeof editingTemplate.league === 'object' ? editingTemplate.league.name : 'Unknown')}</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={() => setView('list')} className="h-10 w-10 p-0 rounded-full border border-white/10 hover:bg-white/5">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="bg-[#1A1D21] border border-white/5 rounded-2xl p-10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -z-0" />
                
                <div className="relative z-10 space-y-6">
                    <InputField 
                        label="Ticket_Label" 
                        placeholder="Standard Entry" 
                        value={editingTemplate?.type || ''}
                        onChange={(e: any) => setEditingTemplate(prev => prev ? {...prev, type: e.target.value} : null)}
                    />
                    
                    <div className="grid grid-cols-2 gap-6">
                        <InputField 
                            label="Price_Vector ($)" 
                            type="number"
                            placeholder="0" 
                            value={editingTemplate?.price || 0}
                            onChange={(e: any) => setEditingTemplate(prev => prev ? {...prev, price: parseFloat(e.target.value)} : null)}
                        />
                        <InputField 
                            label="League_Capacity" 
                            type="number"
                            value={typeof editingTemplate?.league === 'object' ? editingTemplate.league.maxParticipants : 0}
                            readOnly
                        />
                    </div>

                    <div className="pt-6">
                        <Button 
                            onClick={handleUpdateTemplate}
                            disabled={saving}
                            className="w-full py-6 bg-primary text-black font-black tracking-[0.2em] uppercase rounded-sm shadow-[0_0_30px_rgba(0,255,65,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {saving ? 'UPDATING_RECORD...' : 'SAVE_MODIFICATIONS'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <div className="pb-10">
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {view === 'list' && renderDashboard()}
                    {view === 'edit-template' && renderTemplateEditor()}
                </>
            )}

            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
            />
        </div>
    );
}

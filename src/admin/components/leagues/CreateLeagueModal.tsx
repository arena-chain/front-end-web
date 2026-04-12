import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, Upload, X, Globe, Gamepad2, AlertCircle } from 'lucide-react';
import { leagueService, LeagueLevel, type League, type CreateLeaguePayload } from '../../../services/leagueService';
import { default as catalogService } from '../../../services/catalogService';
import type { Game } from '../../../models/game';
import { cn } from '../../../lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAGUE_LEVELS: { value: LeagueLevel; label: string; desc: string }[] = [
    { value: 'INTERNATIONAL', label: 'International', desc: 'Global — region locked to "Global"' },
    { value: 'CONTINENTAL', label: 'Continental', desc: 'Geographic continent or Esports region (EMEA, Americas, Pacific, CN)' },
    { value: 'NATIONAL', label: 'National', desc: 'A specific country' },
    { value: 'REGIONAL', label: 'Regional', desc: 'Any sub-national region' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputCls = 'w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder-white/20';
const selectCls = `${inputCls} appearance-none`;
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const errCls = 'flex items-center gap-1 text-red-400 text-[10px] font-bold mt-1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateLeagueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateLeaguePayload | FormData) => Promise<void>;
    league?: League | null;
}

interface FormState {
    name: string;
    level: LeagueLevel;
    regionId: string;
    gameId: string;
    description: string;
    logoUrl: string;
}

const DEFAULT_FORM: FormState = {
    name: '',
    level: 'CONTINENTAL',
    regionId: '',
    gameId: '',
    description: '',
    logoUrl: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ isOpen, onClose, onSubmit, league }) => {
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [submitting, setSubmitting] = useState(false);

    // region enums
    const [continents, setContinents] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [enumsLoaded, setEnumsLoaded] = useState(false);

    // catalog
    const [games, setGames] = useState<Game[]>([]);
    const [gamesLoading, setGamesLoading] = useState(false);

    // logo file
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // ── Load data when open ──────────────────────────────────────────────────

    useEffect(() => {
        if (!isOpen) return;

        // Load games
        setGamesLoading(true);
        catalogService.fetchGames()
            .then(setGames)
            .catch(console.error)
            .finally(() => setGamesLoading(false));

        // Load region enums
        if (!enumsLoaded) {
            leagueService.getRegionEnums().then(d => {
                setContinents(d.continents);
                setCountries(d.countries);
                setEnumsLoaded(true);
            });
        }
    }, [isOpen]);

    // ── Populate form when editing ───────────────────────────────────────────

    useEffect(() => {
        if (!isOpen) return;
        if (league) {
            setForm({
                name: league.name || '',
                level: league.level || 'CONTINENTAL',
                regionId: league.regionId || '',
                gameId: (typeof league.gameId === 'string' ? league.gameId : ''),
                description: league.description || '',
                logoUrl: league.logoUrl || '',
            });
        } else {
            setForm(DEFAULT_FORM);
        }
        setErrors({});
        clearLogoFile();
    }, [isOpen, league]);

    // ── Reset regionId when level changes ────────────────────────────────────

    const handleLevelChange = (level: LeagueLevel) => {
        let regionId = '';
        if (level === 'INTERNATIONAL') regionId = 'Global';
        else if (level === 'CONTINENTAL') regionId = continents[0] || '';
        else if (level === 'NATIONAL') regionId = countries[0] || '';
        setForm(f => ({ ...f, level, regionId }));
        setErrors(e => { const n = { ...e }; delete n.regionId; return n; });
    };

    // ── Region options ───────────────────────────────────────────────────────

    const regionOptions = useMemo((): { value: string; label: string; group: string }[] => {
        if (form.level === 'INTERNATIONAL') return [{ value: 'Global', label: 'Global', group: '' }];
        if (form.level === 'CONTINENTAL') {
            const geo = continents.map(c => ({ value: c, label: c, group: 'Geographic' }));
            const esports = [
                { value: 'EMEA', label: 'EMEA — Europe, Middle East & Africa', group: 'Esports' },
                { value: 'Americas', label: 'Americas — North + South America', group: 'Esports' },
                { value: 'Pacific', label: 'Pacific — Asia-Pacific (excl. CN)', group: 'Esports' },
                { value: 'CN', label: 'CN — China', group: 'Esports' },
            ];
            return [...geo, ...esports];
        }
        if (form.level === 'NATIONAL') return countries.map(c => ({ value: c, label: c, group: '' }));
        return [];
    }, [form.level, continents, countries]);

    // ── Logo file helpers ────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        setLogoFile(file);
        setLogoPreviewUrl(URL.createObjectURL(file));
        setForm(f => ({ ...f, logoUrl: '' }));
    };

    const clearLogoFile = () => {
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        setLogoFile(null);
        setLogoPreviewUrl('');
        if (fileRef.current) fileRef.current.value = '';
    };

    // ── Validation ───────────────────────────────────────────────────────────

    const validate = (): boolean => {
        const errs: Partial<Record<keyof FormState, string>> = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.gameId.trim()) errs.gameId = 'Please select a game';
        if (form.level === 'CONTINENTAL' && !form.regionId) errs.regionId = 'Please select a continent';
        if (form.level === 'NATIONAL' && !form.regionId) errs.regionId = 'Please select a country';
        if (form.level === 'REGIONAL' && !form.regionId.trim()) errs.regionId = 'Region name is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            // Resolve logo — if a local file was picked, read it as base64 data URL
            let resolvedLogoUrl = form.logoUrl.trim();
            if (logoFile) {
                resolvedLogoUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(logoFile);
                });
            }

            // Always send plain JSON — backend POST /leagues only accepts JSON
            const payload: CreateLeaguePayload = {
                name: form.name.trim(),
                level: form.level,
                gameId: form.gameId,
            };
            const rid = form.level === 'INTERNATIONAL' ? 'Global' : form.regionId;
            if (rid) payload.regionId = rid;
            if (form.description.trim()) payload.description = form.description.trim();
            if (resolvedLogoUrl) payload.logoUrl = resolvedLogoUrl;

            await onSubmit(payload);
            onClose();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = e?.response?.data?.message || e?.message || 'Something went wrong';
            setErrors({ name: Array.isArray(msg) ? msg.join(', ') : msg });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // ── Render ───────────────────────────────────────────────────────────────

    const selectedGame = games.find(g => g._id === form.gameId);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="pointer-events-auto w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/[0.015]">
                        <div>
                            <h2 className="text-base font-black text-white uppercase tracking-tight">
                                {league ? 'Edit League' : 'Create League'}
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                                {league ? 'Update league details' : 'Set up a new league brand'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/8 transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">

                        {/* Global error */}
                        {errors.name && errors.name.length > 30 && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                                <AlertCircle size={14} /> {errors.name}
                            </div>
                        )}

                        {/* Name */}
                        <div>
                            <label className={labelCls}>League Name <span className="text-red-400">*</span></label>
                            <input
                                className={cn(inputCls, errors.name && 'border-red-500/50')}
                                placeholder="e.g. VCT EMEA, ESL Pro League…"
                                value={form.name}
                                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: undefined })); }}
                            />
                            {errors.name && errors.name.length <= 30 && <p className={errCls}><AlertCircle size={10} />{errors.name}</p>}
                        </div>

                        {/* Game */}
                        <div>
                            <label className={labelCls}>Game <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <select
                                    className={cn(selectCls, errors.gameId && 'border-red-500/50')}
                                    value={form.gameId}
                                    onChange={e => { setForm(f => ({ ...f, gameId: e.target.value })); setErrors(v => ({ ...v, gameId: undefined })); }}
                                >
                                    <option value="">Select a game…</option>
                                    {gamesLoading
                                        ? <option disabled>Loading…</option>
                                        : games.map(g => <option key={g._id} value={g._id}>{g.title}</option>)
                                    }
                                </select>
                                {selectedGame?.logoUrl || selectedGame?.coverImageUrl ? (
                                    <img
                                        src={(selectedGame as { logoUrl?: string }).logoUrl || selectedGame.coverImageUrl}
                                        alt=""
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded object-cover pointer-events-none"
                                    />
                                ) : (
                                    <Gamepad2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                )}
                            </div>
                            {errors.gameId && <p className={errCls}><AlertCircle size={10} />{errors.gameId}</p>}
                        </div>

                        {/* Level + Region row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Level <span className="text-red-400">*</span></label>
                                <select
                                    className={selectCls}
                                    value={form.level}
                                    onChange={e => handleLevelChange(e.target.value as LeagueLevel)}
                                >
                                    {LEAGUE_LEVELS.map(l => (
                                        <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-600 mt-1 leading-tight">
                                    {LEAGUE_LEVELS.find(l => l.value === form.level)?.desc}
                                </p>
                            </div>

                            <div>
                                <label className={labelCls}>
                                    {form.level === 'NATIONAL' ? 'Country' : form.level === 'CONTINENTAL' ? 'Continent' : form.level === 'REGIONAL' ? 'Region' : 'Region'}
                                    {form.level !== 'INTERNATIONAL' && <span className="text-red-400 ml-1">*</span>}
                                </label>
                                {form.level === 'INTERNATIONAL' ? (
                                    <div className={cn(inputCls, 'flex items-center gap-2 text-slate-500 cursor-not-allowed')}>
                                        <Globe size={13} /> Global
                                    </div>
                                ) : form.level === 'REGIONAL' ? (
                                    <input
                                        className={cn(inputCls, errors.regionId && 'border-red-500/50')}
                                        placeholder="e.g. Île-de-France, Midwest…"
                                        value={form.regionId}
                                        onChange={e => { setForm(f => ({ ...f, regionId: e.target.value })); setErrors(v => ({ ...v, regionId: undefined })); }}
                                    />
                                ) : (
                                    <select
                                        className={cn(selectCls, errors.regionId && 'border-red-500/50')}
                                        value={form.regionId}
                                        onChange={e => { setForm(f => ({ ...f, regionId: e.target.value })); setErrors(v => ({ ...v, regionId: undefined })); }}
                                    >
                                        <option value="">Select…</option>
                                        {form.level === 'CONTINENTAL' ? (
                                            <>
                                                <optgroup label="── Geographic ──">
                                                    {regionOptions.filter(o => o.group === 'Geographic').map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="── Esports (VCT / Riot) ──">
                                                    {regionOptions.filter(o => o.group === 'Esports').map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </optgroup>
                                            </>
                                        ) : (
                                            regionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                                        )}
                                    </select>
                                )}
                                {errors.regionId && <p className={errCls}><AlertCircle size={10} />{errors.regionId}</p>}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelCls}>Description <span className="text-slate-600 font-normal normal-case tracking-normal">(optional)</span></label>
                            <textarea
                                className={cn(inputCls, 'resize-none')}
                                rows={2}
                                placeholder="Short description of this league…"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </div>

                        {/* Logo */}
                        <div>
                            <label className={labelCls}>Logo <span className="text-slate-600 font-normal normal-case tracking-normal">(optional)</span></label>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Preview or drop zone */}
                            <div
                                className="relative flex items-center gap-4 border border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:border-emerald-500/30 hover:bg-white/[0.02] transition-all"
                                onClick={() => fileRef.current?.click()}
                            >
                                {logoPreviewUrl || form.logoUrl ? (
                                    <>
                                        <img
                                            src={logoPreviewUrl || form.logoUrl}
                                            alt=""
                                            className="w-14 h-14 rounded-xl object-contain bg-white/5 border border-white/10 flex-shrink-0"
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">
                                                {logoFile ? logoFile.name : 'Current logo'}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Click to replace</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); clearLogoFile(); setForm(f => ({ ...f, logoUrl: '' })); }}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center flex-shrink-0">
                                            <Upload size={18} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">Upload logo</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG or GIF · click to browse</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* URL fallback — only when no file selected */}
                            {!logoFile && (
                                <div className="mt-2">
                                    <input
                                        type="url"
                                        className={cn(inputCls, 'text-xs')}
                                        placeholder="…or paste a logo URL"
                                        value={form.logoUrl}
                                        onClick={e => e.stopPropagation()}
                                        onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50 transition-all"
                            >
                                {submitting && <Loader2 size={13} className="animate-spin" />}
                                {league ? 'Save Changes' : 'Create League'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateLeagueModal;

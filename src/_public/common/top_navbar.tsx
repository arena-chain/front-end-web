import { Link } from 'react-router-dom';
import { Gamepad2, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export function TopNavbar() {
    const [menuOpen,  setMenuOpen]  = useState(false);
    const [scrolled,  setScrolled]  = useState(false);
    const [showDlBadge, setDlBadge] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Flash download badge once after 2s
    useEffect(() => {
        const t = setTimeout(() => setDlBadge(true), 2000);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
                style={{
                    background: scrolled ? 'rgba(4,4,4,0.95)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(24px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
                    borderBottom: `1px solid ${scrolled ? 'rgba(0,255,0,0.14)' : 'transparent'}`,
                    boxShadow: scrolled ? '0 2px 48px rgba(0,0,0,0.7), 0 1px 0 rgba(0,255,0,0.08)' : 'none',
                }}
            >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,0,0.5) 25%, rgba(0,255,0,0.9) 50%, rgba(0,255,0,0.5) 75%, transparent)' }} />

                <div className="max-w-7xl mx-auto px-6 h-[66px] flex items-center gap-6">

                    {/* ── Logo ───────────────────────────────────────── */}
                    <Link to="/" onClick={() => window.scrollTo(0, 0)}
                        className="flex items-center gap-2.5 shrink-0 group">
                        <div className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
                            style={{ background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.3)' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 0 22px rgba(0,255,0,0.45)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                            <Gamepad2 className="w-[18px] h-[18px]" style={{ color: '#00ff00' }} />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                                style={{ background: '#00ff00', boxShadow: '0 0 8px rgba(0,255,0,0.55)' }} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[18px] font-black tracking-tighter uppercase italic text-white leading-none">
                                Arena<span style={{ color: '#00ff00' }}>Chain</span>
                            </span>
                            <span className="text-[7px] font-black uppercase tracking-[0.3em] leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Esports Platform</span>
                        </div>
                    </Link>

                    <div className="hidden lg:block flex-1 min-w-0" aria-hidden />

                    {/* ── Right cluster ──────────────────────────────── */}
                    <div className="hidden md:flex items-center gap-2.5 shrink-0 ml-auto">

                        {/* Live badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                            style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.14)' }}>
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="relative w-full h-full rounded-full" style={{ background: '#00ff00', boxShadow: '0 0 6px rgba(0,255,0,0.55)' }} />
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: '#00ff00' }}>12.8K Live</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

                        {/* Download — navigates to /download */}
                        <Link to="/download" className="relative group inline-flex rounded-xl">
                            <button
                                type="button"
                                className="relative flex items-center gap-2 pl-3.5 pr-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-widest text-black transition-all duration-200 border border-black/10"
                                style={{ background: 'linear-gradient(135deg, #00ff00 0%, #00cc44 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
                            >
                                <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none" aria-hidden>
                                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                                </span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="relative shrink-0 text-black">
                                    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                                </svg>
                                <span className="relative flex items-center gap-1.5">
                                    <span>Download</span>
                                    {showDlBadge && (
                                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none bg-black/18 text-black border border-black/10">
                                            Free
                                        </span>
                                    )}
                                </span>
                            </button>
                        </Link>

                        {/* Divider */}
                        <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

                        {/* Log In — more visible outline */}
                        <Link to="/login">
                            <button
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-widest transition-all duration-200"
                                style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,255,0,0.35)' }}
                                onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(0,255,0,0.1)'; el.style.borderColor = 'rgba(0,255,0,0.5)'; el.style.color = '#00ff00'; }}
                                onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.06)'; el.style.borderColor = 'rgba(0,255,0,0.35)'; el.style.color = '#fff'; }}
                            >
                                <LogIn size={11} />
                                Log In
                            </button>
                        </Link>

                        {/* Register */}
                        <Link to="/register">
                            <button
                                className="relative overflow-hidden flex items-center gap-1.5 px-5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-widest text-black transition-all duration-200 group"
                                style={{ background: 'linear-gradient(135deg, #00ff00 0%, #00cc44 100%)', boxShadow: '0 0 18px rgba(0,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' }}
                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(0,255,0,0.65), inset 0 1px 0 rgba(255,255,255,0.25)')}
                                onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 18px rgba(0,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)')}>
                                {/* shimmer */}
                                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} />
                                <UserPlus size={11} />
                                Register
                            </button>
                        </Link>
                    </div>

                    {/* ── Mobile toggle ── */}
                    <button
                        className="md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setMenuOpen(v => !v)}>
                        {menuOpen ? <X size={17} className="text-white" /> : <Menu size={17} className="text-white" />}
                    </button>
                </div>
            </nav>

            {/* ── Mobile drawer ─────────────────────────────────────── */}
            <div className={cn(
                'fixed inset-x-0 top-[66px] z-40 transition-all duration-300 md:hidden',
                menuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-3 pointer-events-none'
            )} style={{ background: 'rgba(4,4,4,0.98)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,255,0,0.1)' }}>
                <div className="px-5 py-5 flex flex-col gap-1">
                    <div className="flex flex-col gap-2.5">
                        {/* Download mobile — navigates to /download */}
                        <Link to="/download" onClick={() => setMenuOpen(false)}>
                            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest text-black transition-all border border-black/10"
                                style={{ background: 'linear-gradient(135deg, #00ff00, #00cc44)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.551H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                                Download for Windows
                            </button>
                        </Link>
                        <Link to="/login" onClick={() => setMenuOpen(false)}>
                            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <LogIn size={14} /> Log In
                            </button>
                        </Link>
                        <Link to="/register" onClick={() => setMenuOpen(false)}>
                            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest text-black border border-black/10"
                                style={{ background: 'linear-gradient(135deg,#00ff00,#00cc44)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                                <UserPlus size={14} /> Register Free
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../components/ui/core';
import { Link } from 'react-router-dom';
import { TopNavbar } from './common/top_navbar';
import { BottomNavbar } from './common/bottom_navbar';
import { Shield, Trophy, Users, Sword, MessageSquare, Zap, Globe, Star } from 'lucide-react';
import valorantCover from '../assets/valorant_cover.jpg';
import lolCover from '../assets/lol.jpg';
import riotLogo from '../assets/riot-games-logo.svg';
import steamLogo from '../assets/steam.png';
import { NewsSection } from './components/NewsSection';
import { HomeTournaments } from './components/HomeTournaments';
import { TypewriterText } from './components/TypewriterText';
import { HeroLeagueSpotlight } from './components/HeroLeagueSpotlight';

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [val, setVal] = useState(0);
    const { ref, visible } = useReveal(0.1);
    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const step = target / 60;
        const id = setInterval(() => {
            start += step;
            if (start >= target) { setVal(target); clearInterval(id); }
            else setVal(Math.floor(start));
        }, 16);
        return () => clearInterval(id);
    }, [visible, target]);
    return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Particle dot ─────────────────────────────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
    return <div className="absolute rounded-full pointer-events-none" style={{ width: 2, height: 2, background: 'rgba(0,255,0,0.6)', ...style }} />;
}

const PARTICLES = Array.from({ length: 40 }, () => ({
    left: `${Math.random() * 100}%`,
    top:  `${Math.random() * 100}%`,
    opacity: 0.1 + Math.random() * 0.5,
    animationName: 'float',
    animationDuration: `${4 + Math.random() * 8}s`,
    animationDelay: `${Math.random() * 6}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    width: `${1 + Math.random() * 3}px`,
    height: `${1 + Math.random() * 3}px`,
}));

// ─── Ticker items ─────────────────────────────────────────────────────────────
const TICKER = [
    '🏆 TOURNAMENT LIVE — CS2 WORLD CUP',
    '⚡ 12,847 PLAYERS ONLINE NOW',
    '🎮 VALORANT CHAMPIONSHIP — FINALS TODAY',
    '🌍 ARENA CHAIN — SEASON 4 OPEN',
    '👑 TOP PRIZE — $50,000 POOL',
    '🔥 LEAGUE OF LEGENDS — PLAYOFFS STARTING',
    '✅ BLOCKCHAIN REWARDS DISTRIBUTED',
];

export default function Home() {
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const handle = (e: MouseEvent) => {
            const r = hero.getBoundingClientRect();
            setMousePos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
        };
        hero.addEventListener('mousemove', handle);
        return () => hero.removeEventListener('mousemove', handle);
    }, []);

    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-black overflow-x-hidden">
            <TopNavbar />

            <main>
                {/* ══════════════════════════════════════════════════════
                    1. HERO
                ══════════════════════════════════════════════════════ */}
                <section
                    ref={heroRef}
                    className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden"
                    style={{ background: '#030303' }}
                >
                    {/* ── Layer 1: Photo background, more visible ── */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')",
                        backgroundSize: 'cover', backgroundPosition: 'center 30%',
                        opacity: 0.22,
                        filter: 'saturate(0.2) brightness(0.9)',
                    }} />

                    {/* ── Layer 2: Green color tint over photo ── */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'linear-gradient(180deg, rgba(0,40,0,0.55) 0%, rgba(0,15,0,0.3) 40%, rgba(3,3,3,0.75) 85%, #030303 100%)',
                    }} />

                    {/* ── Layer 3: Strong center spotlight (makes text pop) ── */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,60,0,0.45) 0%, transparent 70%)',
                    }} />

                    {/* ── Layer 4: Dot grid ── */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'radial-gradient(circle, rgba(0,255,0,0.18) 1px, transparent 1px)',
                        backgroundSize: '38px 38px',
                        animation: 'grid-move 7s ease-in-out infinite alternate',
                        mixBlendMode: 'screen',
                    }} />

                    {/* ── Layer 5: Diagonal hairlines ── */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.04 }}>
                        {[-30,-10,10,30,50,70,90,110].map((d, i) => (
                            <div key={i} className="absolute" style={{
                                left: `${d}%`, top: '-100%',
                                width: '1px', height: '300%',
                                background: 'linear-gradient(180deg, transparent, rgba(0,255,0,1), transparent)',
                                transform: 'rotate(-35deg)',
                                transformOrigin: 'top left',
                            }} />
                        ))}
                    </div>

                    {/* ── Layer 6: Fine scanlines ── */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px)',
                    }} />

                    {/* ── Layer 7: Rotating conic spotlight ── */}
                    <div className="absolute pointer-events-none" style={{
                        left: '50%', top: '50%',
                        width: 1100, height: 1100,
                        transform: 'translate(-50%,-50%)',
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,0,0.04) 30deg, transparent 60deg)',
                        borderRadius: '50%',
                        animation: 'radar-scan 14s linear infinite',
                    }} />

                    {/* ── Layer 8: Pulsing rings ── */}
                    {[480, 680, 900].map((size, i) => (
                        <div key={i} className="absolute pointer-events-none rounded-full" style={{
                            left: '50%', top: '50%',
                            width: size, height: size,
                            transform: 'translate(-50%,-50%)',
                            border: `1px solid rgba(0,255,0,${0.07 - i * 0.02})`,
                            animation: `glow-breathe ${4 + i}s ease-in-out infinite ${i * 0.8}s`,
                        }} />
                    ))}

                    {/* ── Layer 9: Prominent floating orbs ── */}
                    {/* Main green center orb */}
                    <div className="absolute pointer-events-none rounded-full" style={{
                        left: '50%', top: '40%',
                        width: 800, height: 800,
                        transform: 'translate(-50%,-50%)',
                        background: 'radial-gradient(circle, rgba(0,255,0,0.12) 0%, rgba(0,200,0,0.04) 40%, transparent 70%)',
                        filter: 'blur(40px)',
                        animation: 'float 9s ease-in-out infinite',
                    }} />
                    {/* Top-right accent */}
                    <div className="absolute pointer-events-none rounded-full" style={{
                        left: '72%', top: '18%', width: 500, height: 500,
                        background: 'radial-gradient(circle, rgba(0,255,80,0.1) 0%, transparent 65%)',
                        filter: 'blur(60px)',
                        animation: 'float 7s ease-in-out infinite 1s',
                    }} />
                    {/* Bottom-left blue */}
                    <div className="absolute pointer-events-none rounded-full" style={{
                        left: '8%', top: '55%', width: 420, height: 420,
                        background: 'radial-gradient(circle, rgba(20,120,255,0.08) 0%, transparent 65%)',
                        filter: 'blur(70px)',
                        animation: 'float 11s ease-in-out infinite 2.5s',
                    }} />
                    {/* Bottom-right green */}
                    <div className="absolute pointer-events-none rounded-full" style={{
                        left: '80%', top: '68%', width: 300, height: 300,
                        background: 'radial-gradient(circle, rgba(0,255,120,0.07) 0%, transparent 65%)',
                        filter: 'blur(50px)',
                        animation: 'float 8s ease-in-out infinite 4s',
                    }} />

                    {/* ── Layer 10: Mouse-parallax orbs ── */}
                    <div className="absolute pointer-events-none" style={{
                        left: `${18 + mousePos.x * 14}%`, top: `${12 + mousePos.y * 12}%`,
                        width: 650, height: 650,
                        background: 'radial-gradient(circle, rgba(0,255,0,0.11) 0%, transparent 60%)',
                        transform: 'translate(-50%,-50%)',
                        transition: 'left 1s cubic-bezier(0.23,1,0.32,1), top 1s cubic-bezier(0.23,1,0.32,1)',
                        filter: 'blur(30px)',
                    }} />
                    <div className="absolute pointer-events-none" style={{
                        right: `${8 + (1-mousePos.x) * 16}%`, bottom: `${8 + (1-mousePos.y) * 14}%`,
                        width: 480, height: 480,
                        background: 'radial-gradient(circle, rgba(0,160,255,0.07) 0%, transparent 60%)',
                        transition: 'right 1s cubic-bezier(0.23,1,0.32,1), bottom 1s cubic-bezier(0.23,1,0.32,1)',
                        filter: 'blur(30px)',
                    }} />

                    {/* ── Layer 11: Dual beam sweeps ── */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div style={{
                            position: 'absolute', top: 0, bottom: 0, width: '7%',
                            background: 'linear-gradient(90deg, transparent, rgba(0,255,0,0.07), transparent)',
                            animation: 'beam-sweep 8s ease-in-out infinite 0.5s',
                        }} />
                        <div style={{
                            position: 'absolute', top: 0, bottom: 0, width: '4%',
                            background: 'linear-gradient(90deg, transparent, rgba(0,180,255,0.05), transparent)',
                            animation: 'beam-sweep 11s ease-in-out infinite 4s',
                        }} />
                    </div>

                    {/* ── Layer 12: Brighter particles ── */}
                    {PARTICLES.map((p, i) => (
                        <div key={i} className="absolute rounded-full pointer-events-none" style={{
                            ...p,
                            background: i % 3 === 0 ? 'rgba(0,255,0,0.8)' : 'rgba(0,255,0,0.5)',
                            boxShadow: i % 5 === 0 ? '0 0 4px rgba(0,255,0,0.9)' : 'none',
                        }} />
                    ))}

                    {/* ── HUD corner brackets ── */}
                    {[
                        { top: 100, left: 32, borderTop: '2px solid', borderLeft: '2px solid' },
                        { top: 100, right: 32, borderTop: '2px solid', borderRight: '2px solid' },
                        { bottom: 80, left: 32, borderBottom: '2px solid', borderLeft: '2px solid' },
                        { bottom: 80, right: 32, borderBottom: '2px solid', borderRight: '2px solid' },
                    ].map((s, i) => (
                        <div key={i} className="absolute pointer-events-none" style={{
                            ...s, width: 32, height: 32, borderColor: 'rgba(0,255,0,0.4)',
                            opacity: 0, animation: 'fadeInUp 0.8s ease-out 0.5s forwards',
                            boxShadow: '0 0 8px rgba(0,255,0,0.15)',
                        }} />
                    ))}

                    {/* — Main content — */}
                    <div className="container relative z-10 px-6 mx-auto text-center">
                        {/* Live badge */}
                        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10"
                            style={{
                                background: 'rgba(0,255,0,0.05)',
                                border: '1px solid rgba(0,255,0,0.2)',
                                opacity: 0,
                                animation: 'fadeInUp 0.7s ease-out 0.1s forwards',
                            }}>
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00ff00', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
                                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#00ff00' }} />
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: '#00ff00' }}>Live · Season 4 Active</span>
                        </div>

                        {/* Main title */}
                        <h1 className="font-black tracking-tighter uppercase leading-[0.9] mb-6 select-none"
                            style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
                            <span className="block text-white"
                                style={{ opacity: 0, animation: 'slide-left 0.7s ease-out 0.25s forwards' }}>
                                Collaborate
                            </span>

                            <span className="block relative"
                                style={{ opacity: 0, animation: 'scale-in 0.6s ease-out 0.45s forwards' }}>
                                <span style={{
                                    color: '#00ff00',
                                    animation: 'text-flicker 5s linear 2s infinite',
                                    textShadow: '0 0 30px rgba(0,255,0,0.6), 0 0 80px rgba(0,255,0,0.2)',
                                    display: 'inline-block',
                                }}>
                                    <TypewriterText
                                        lines={['Elevate', 'Compete', 'Dominate', 'Conquer']}
                                        className=""
                                        typingSpeed={90}
                                        deletingSpeed={45}
                                        pauseDuration={1800}
                                    />
                                </span>
                            </span>

                            <span className="block text-white"
                                style={{ opacity: 0, animation: 'slide-left 0.7s ease-out 0.65s forwards' }}>
                                Tournaments
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.38)', opacity: 0, animation: 'fadeInUp 0.7s ease-out 0.8s forwards' }}>
                            The next-generation esports platform powered by blockchain. Compete, earn, and rise to the top.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                            style={{ opacity: 0, animation: 'fadeInUp 0.7s ease-out 0.95s forwards' }}>
                            <Link to="/login">
                                <button className="relative group min-w-[200px] px-8 py-4 font-black text-sm uppercase tracking-widest text-black overflow-hidden rounded-xl transition-all duration-300"
                                    style={{
                                        background: '#00ff00',
                                        animation: 'glow-breathe 2.5s ease-in-out infinite',
                                    }}>
                                    <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }} />
                                    </span>
                                    <span className="relative flex items-center justify-center gap-2">
                                        <Zap size={15} /> Play Now
                                    </span>
                                </button>
                            </Link>
                            <Link to="/tournaments">
                                <button className="group min-w-[200px] px-8 py-4 font-black text-sm uppercase tracking-widest text-white rounded-xl transition-all duration-300"
                                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,0,0.4)'; e.currentTarget.style.background = 'rgba(0,255,0,0.06)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'transparent'; }}>
                                    View Tournaments
                                </button>
                            </Link>
                        </div>

                        {/* Live stats bar */}
                        <div className="flex flex-wrap items-center justify-center gap-3"
                            style={{ opacity: 0, animation: 'fadeInUp 0.7s ease-out 1.1s forwards' }}>
                            {[
                                { label: 'Players Online', value: 12847, suffix: '', icon: '🟢' },
                                { label: 'Active Tournaments', value: 34, suffix: '', icon: '🏆' },
                                { label: 'Prize Pool (USD)', value: 50000, suffix: '+', icon: '💰' },
                                { label: 'Matches Today', value: 1293, suffix: '', icon: '⚡' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <span className="text-base">{s.icon}</span>
                                    <div className="text-left">
                                        <div className="text-xs font-black text-white tabular-nums">
                                            <Counter target={s.value} suffix={s.suffix} />
                                        </div>
                                        <div className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* — Scroll hint — */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                        style={{ opacity: 0, animation: 'fadeInUp 0.7s ease-out 1.5s forwards' }}>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.2)' }}>Scroll</span>
                        <div className="w-px h-8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div className="w-full h-4 rounded-full" style={{ background: '#00ff00', animation: 'float 1.5s ease-in-out infinite' }} />
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    LIVE TICKER
                ══════════════════════════════════════════════════════ */}
                <div className="relative overflow-hidden py-3" style={{ background: 'rgba(0,255,0,0.05)', borderTop: '1px solid rgba(0,255,0,0.12)', borderBottom: '1px solid rgba(0,255,0,0.12)' }}>
                    <div className="flex gap-12 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
                        {[...TICKER, ...TICKER].map((t, i) => (
                            <span key={i} className="text-[11px] font-black uppercase tracking-widest shrink-0" style={{ color: 'rgba(0,255,0,0.7)' }}>
                                {t}
                                <span className="ml-12 opacity-30">◆</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    2. FEATURES
                ══════════════════════════════════════════════════════ */}
                <RevealSection className="py-32 relative overflow-hidden" style={{ background: '#080808' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }} />

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="text-center mb-20">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                                style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.15)' }}>
                                <Star size={11} style={{ color: '#00ff00' }} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#00ff00' }}>Why Arena Chain</span>
                            </div>
                            <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Built for <span style={{ color: '#00ff00' }}>Champions</span></h2>
                            <p className="text-text-muted max-w-lg mx-auto text-sm leading-relaxed">Dominate the competition with our state-of-the-art matchmaking and tournament systems.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: <Sword size={28} />, title: 'Book Matches', desc: 'Instant matchmaking with ELO-balanced lobbies. Find your perfect opponents in seconds.', stat: '< 30s', statLabel: 'avg match found', delay: '0s' },
                                { icon: <Trophy size={28} />, title: 'Tournaments', desc: 'Daily, weekly, and monthly tournaments with automated bracket generation and prize pools.', stat: '34', statLabel: 'active tournaments', delay: '0.15s' },
                                { icon: <Shield size={28} />, title: 'Secure & Fair', desc: 'Blockchain-verified results and industry-leading anti-cheat integration.', stat: '100%', statLabel: 'verified outcomes', delay: '0.3s' },
                            ].map((f, i) => (
                                <EnhancedFeatureCard key={i} {...f} />
                            ))}
                        </div>

                        {/* Stats strip */}
                        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { n: 48200, suffix: '+', label: 'Registered Players', icon: <Users size={16}/> },
                                { n: 1840, suffix: '+', label: 'Tournaments Hosted', icon: <Trophy size={16}/> },
                                { n: 250000, suffix: '$', label: 'Total Prizes Paid', icon: <Globe size={16}/>, prefix: '$' },
                                { n: 99, suffix: '%', label: 'Uptime SLA', icon: <Zap size={16}/> },
                            ].map((s, i) => (
                                <StatCard key={i} {...s} />
                            ))}
                        </div>
                    </div>
                </RevealSection>

                {/* ══════════════════════════════════════════════════════
                    3. TOURNAMENTS
                ══════════════════════════════════════════════════════ */}
                <HomeTournaments />

                {/* ══════════════════════════════════════════════════════
                    4. PARTNERS (infinite scroll carousel)
                ══════════════════════════════════════════════════════ */}
                <PartnersCarousel />

                {/* ══════════════════════════════════════════════════════
                    5. MOBILE APP
                ══════════════════════════════════════════════════════ */}
                <MobileAppSection />

                {/* ══════════════════════════════════════════════════════
                    6. NEWS
                ══════════════════════════════════════════════════════ */}
                <NewsSection />

                {/* ══════════════════════════════════════════════════════
                    6. SUPPORT / CTA
                ══════════════════════════════════════════════════════ */}
                <RevealSection className="py-32 relative overflow-hidden" style={{ background: '#080808' }}>
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle, rgba(0,255,0,0.08) 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }} />
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.05) 0%, transparent 70%)' }} />
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Glow corner */}
                            <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle at top left, rgba(0,255,0,0.08) 0%, transparent 60%)' }} />

                            <div className="max-w-xl relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                                    style={{ background: 'rgba(0,255,0,0.07)', border: '1px solid rgba(0,255,0,0.2)' }}>
                                    <MessageSquare size={13} style={{ color: '#00ff00' }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#00ff00' }}>24/7 Support</span>
                                </div>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-5">Need <span style={{ color: '#00ff00' }}>Assistance?</span></h2>
                                <p className="text-text-muted text-base mb-8 leading-relaxed">
                                    Our dedicated support team is here 24/7 — from match disputes to account recovery. We've got you covered.
                                </p>
                                <div className="flex gap-4 flex-wrap">
                                    <Button className="shadow-[0_0_20px_rgba(0,255,0,0.2)]">Contact Support</Button>
                                    <Button variant="ghost">Join Discord</Button>
                                </div>
                            </div>

                            {/* Chat card */}
                            <div className="relative shrink-0">
                                <div className="absolute -inset-6 rounded-full pointer-events-none" style={{ background: 'rgba(0,255,0,0.07)', filter: 'blur(30px)' }} />
                                <div className="relative rounded-2xl p-6 max-w-xs"
                                    style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(2deg)' }}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,255,0,0.1)', border: '1px solid rgba(0,255,0,0.2)' }}>
                                            <Users size={18} style={{ color: '#00ff00' }} />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-white">Player Support</div>
                                            <div className="text-xs font-bold flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow: '0 0 6px #4ade80' }} />
                                                <span style={{ color: '#4ade80' }}>Online Now</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                        "Hey! How can I help you with your tournament registration today?"
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        {['Match Issue', 'Account', 'Prizes'].map(tag => (
                                            <span key={tag} className="text-[9px] font-black uppercase px-2 py-1 rounded-lg"
                                                style={{ background: 'rgba(0,255,0,0.08)', color: 'rgba(0,255,0,0.6)', border: '1px solid rgba(0,255,0,0.15)' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealSection>
            </main>

            <BottomNavbar />
        </div>
    );
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function RevealSection({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    const { ref, visible } = useReveal(0.1);
    return (
        <section ref={ref} className={className} style={{
            ...style,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}>
            {children}
        </section>
    );
}

// ─── Enhanced feature card ────────────────────────────────────────────────────
function EnhancedFeatureCard({ icon, title, desc, stat, statLabel, delay }: {
    icon: React.ReactNode; title: string; desc: string; stat: string; statLabel: string; delay: string;
}) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative rounded-2xl p-8 overflow-hidden cursor-default transition-all duration-400"
            style={{
                background: hovered ? 'rgba(0,255,0,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hovered ? 'rgba(0,255,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: hovered ? '0 0 40px rgba(0,255,0,0.08)' : 'none',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                opacity: 0,
                animation: `fadeInUp 0.7s ease-out ${delay} forwards`,
            }}>
            {/* Top corner glow on hover */}
            {hovered && <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none" style={{ background: 'radial-gradient(circle at top left, rgba(0,255,0,0.15) 0%, transparent 70%)' }} />}

            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 transition-all duration-300"
                style={{
                    background: hovered ? 'rgba(0,255,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${hovered ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: hovered ? '#00ff00' : 'rgba(255,255,255,0.5)',
                    boxShadow: hovered ? '0 0 20px rgba(0,255,0,0.2)' : 'none',
                }}>
                {icon}
            </div>

            <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white">{title}</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{desc}</p>

            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black" style={{ color: '#00ff00' }}>{stat}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{statLabel}</span>
            </div>
        </div>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ n, suffix, label, icon, prefix = '' }: { n: number; suffix: string; label: string; icon: React.ReactNode; prefix?: string }) {
    const { ref, visible } = useReveal(0.1);
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!visible) return;
        let s = 0;
        const step = n / 50;
        const id = setInterval(() => { s += step; if (s >= n) { setVal(n); clearInterval(id); } else setVal(Math.floor(s)); }, 20);
        return () => clearInterval(id);
    }, [visible, n]);
    return (
        <div ref={ref} className="rounded-2xl p-6 text-center transition-all duration-300 hover:border-green-500/20"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-center mb-3" style={{ color: 'rgba(0,255,0,0.5)' }}>{icon}</div>
            <div className="text-3xl font-black mb-1" style={{ color: '#00ff00' }}>{prefix}{val.toLocaleString()}{suffix}</div>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</div>
        </div>
    );
}

// ─── Partners data ────────────────────────────────────────────────────────────

interface GamePartner  { title: string; image: string; type: 'cover' | 'logo'; glow: string; category: string; }
interface BrandPartner { title: string; logo: string; color: string; bg: string; category: string; }

// Simple Icons CDN — returns colored SVG: https://cdn.simpleicons.org/{slug}/{hex}
const si = (slug: string, hex: string) => `https://cdn.simpleicons.org/${slug}/${hex}`;

const GAME_PARTNERS: GamePartner[] = [
    { title: 'Riot Games',        image: riotLogo,      type: 'logo',  glow: 'rgba(211,41,54,0.6)',   category: 'Publisher' },
    { title: 'Valorant',          image: valorantCover, type: 'cover', glow: 'rgba(255,70,85,0.55)',  category: 'FPS'       },
    { title: 'League of Legends', image: lolCover,      type: 'cover', glow: 'rgba(180,145,0,0.55)',  category: 'MOBA'      },
    { title: 'Steam',             image: steamLogo,     type: 'logo',  glow: 'rgba(100,180,255,0.5)', category: 'Platform'  },
    { title: 'Epic Games',        image: si('epicgames','ffffff'),    type: 'logo', glow: 'rgba(255,255,255,0.35)', category: 'Platform'  },
    { title: 'EA Sports',         image: si('ea','ff4747'),           type: 'logo', glow: 'rgba(255,71,71,0.5)',   category: 'Publisher' },
    { title: 'Ubisoft',           image: si('ubisoft','ffffff'),      type: 'logo', glow: 'rgba(255,255,255,0.3)', category: 'Publisher' },
    { title: 'Blizzard',          image: si('battledotnet','148eff'), type: 'logo', glow: 'rgba(20,142,255,0.55)', category: 'Publisher' },
    { title: 'Discord',           image: si('discord','5865f2'),      type: 'logo', glow: 'rgba(88,101,242,0.6)',  category: 'Community' },
    // duplicates for seamless loop
    { title: 'Riot Games',        image: riotLogo,      type: 'logo',  glow: 'rgba(211,41,54,0.6)',   category: 'Publisher' },
    { title: 'Valorant',          image: valorantCover, type: 'cover', glow: 'rgba(255,70,85,0.55)',  category: 'FPS'       },
    { title: 'League of Legends', image: lolCover,      type: 'cover', glow: 'rgba(180,145,0,0.55)',  category: 'MOBA'      },
    { title: 'Steam',             image: steamLogo,     type: 'logo',  glow: 'rgba(100,180,255,0.5)', category: 'Platform'  },
    { title: 'Epic Games',        image: si('epicgames','ffffff'),    type: 'logo', glow: 'rgba(255,255,255,0.35)', category: 'Platform'  },
    { title: 'EA Sports',         image: si('ea','ff4747'),           type: 'logo', glow: 'rgba(255,71,71,0.5)',   category: 'Publisher' },
    { title: 'Ubisoft',           image: si('ubisoft','ffffff'),      type: 'logo', glow: 'rgba(255,255,255,0.3)', category: 'Publisher' },
    { title: 'Blizzard',          image: si('battledotnet','148eff'), type: 'logo', glow: 'rgba(20,142,255,0.55)', category: 'Publisher' },
    { title: 'Discord',           image: si('discord','5865f2'),      type: 'logo', glow: 'rgba(88,101,242,0.6)',  category: 'Community' },
];

const BRAND_PARTNERS: BrandPartner[] = [
    { title: 'Alienware',   logo: si('alienware','00baff'),   color: '#00baff', bg: 'rgba(0,186,255,0.07)',  category: 'Gaming PCs'    },
    { title: 'ASUS ROG',    logo: si('asus','cc0000'),        color: '#cc0000', bg: 'rgba(204,0,0,0.07)',    category: 'Hardware'      },
    { title: 'Razer',       logo: si('razer','44d62c'),       color: '#44d62c', bg: 'rgba(68,214,44,0.07)',  category: 'Peripherals'   },
    { title: 'NVIDIA',      logo: si('nvidia','76b900'),      color: '#76b900', bg: 'rgba(118,185,0,0.07)',  category: 'GPU'           },
    { title: 'Intel',       logo: si('intel','0068b5'),       color: '#0068b5', bg: 'rgba(0,104,181,0.07)',  category: 'CPU'           },
    { title: 'AMD',         logo: si('amd','ed1c24'),         color: '#ed1c24', bg: 'rgba(237,28,36,0.07)',  category: 'CPU / GPU'     },
    { title: 'HyperX',        logo: si('hyperx','e20813'),     color: '#e20813', bg: 'rgba(226,8,19,0.07)',   category: 'Peripherals'   },
    { title: 'SteelSeries', logo: si('steelseries','ff6600'), color: '#ff6600', bg: 'rgba(255,102,0,0.07)',  category: 'Peripherals'   },
    { title: 'Corsair',     logo: si('corsair','ffd700'),     color: '#ffd700', bg: 'rgba(255,215,0,0.07)',  category: 'Hardware'      },
    { title: 'Kingston',    logo: si('kingstontechnology','cc0000'),    color: '#cc0000', bg: 'rgba(204,0,0,0.07)',    category: 'Memory'        },
    // duplicates
    { title: 'Alienware',   logo: si('alienware','00baff'),   color: '#00baff', bg: 'rgba(0,186,255,0.07)',  category: 'Gaming PCs'    },
    { title: 'ASUS ROG',    logo: si('asus','cc0000'),        color: '#cc0000', bg: 'rgba(204,0,0,0.07)',    category: 'Hardware'      },
    { title: 'Razer',       logo: si('razer','44d62c'),       color: '#44d62c', bg: 'rgba(68,214,44,0.07)',  category: 'Peripherals'   },
    { title: 'NVIDIA',      logo: si('nvidia','76b900'),      color: '#76b900', bg: 'rgba(118,185,0,0.07)',  category: 'GPU'           },
    { title: 'Intel',       logo: si('intel','0068b5'),       color: '#0068b5', bg: 'rgba(0,104,181,0.07)',  category: 'CPU'           },
    { title: 'AMD',         logo: si('amd','ed1c24'),         color: '#ed1c24', bg: 'rgba(237,28,36,0.07)',  category: 'CPU / GPU'     },
    { title: 'HyperX',        logo: si('hyperx','e20813'),     color: '#e20813', bg: 'rgba(226,8,19,0.07)',   category: 'Peripherals'   },
    { title: 'SteelSeries', logo: si('steelseries','ff6600'), color: '#ff6600', bg: 'rgba(255,102,0,0.07)',  category: 'Peripherals'   },
    { title: 'Corsair',     logo: si('corsair','ffd700'),     color: '#ffd700', bg: 'rgba(255,215,0,0.07)',  category: 'Hardware'      },
    { title: 'Kingston',    logo: si('kingstontechnology','cc0000'),    color: '#cc0000', bg: 'rgba(204,0,0,0.07)',    category: 'Memory'        },
];

// ─── Partners carousel ────────────────────────────────────────────────────────

function PartnersCarousel() {
    const [pausedTop, setPausedTop]       = useState(false);
    const [pausedBottom, setPausedBottom] = useState(false);

    return (
        <section className="relative py-24 overflow-hidden" style={{ background: '#060606' }}>
            {/* Ambient center glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,0,0.035) 0%, transparent 60%)' }} />

            {/* Edge fades */}
            <div className="absolute inset-y-0 left-0 w-40 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #060606 0%, transparent 100%)' }} />
            <div className="absolute inset-y-0 right-0 w-40 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left,  #060606 0%, transparent 100%)' }} />

            {/* Header */}
            <div className="text-center mb-16 relative z-10 px-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                    style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.15)' }}>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: '#00ff00' }}>Official Partners</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                    Trusted by <span style={{ color: '#00ff00' }}>Industry Leaders</span>
                </h2>
                <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Publishers, platforms and hardware brands powering the Arena Chain ecosystem.
                </p>
            </div>

            {/* ── Row 1: Game publishers — scrolls LEFT ── */}
            <div className="relative mb-5">
                <div
                    className="flex gap-5 px-5"
                    onMouseEnter={() => setPausedTop(true)}
                    onMouseLeave={() => setPausedTop(false)}
                    style={{
                        width: 'max-content',
                        animationName: 'mc-left',
                        animationDuration: '38s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationPlayState: pausedTop ? 'paused' : 'running',
                    }}
                >
                    {GAME_PARTNERS.map((p, i) => <GameCard key={i} {...p} />)}
                </div>
            </div>

            {/* ── Row 2: Hardware brands — scrolls RIGHT ── */}
            <div className="relative">
                <div
                    className="flex gap-4 px-5"
                    onMouseEnter={() => setPausedBottom(true)}
                    onMouseLeave={() => setPausedBottom(false)}
                    style={{
                        width: 'max-content',
                        animationName: 'mc-right',
                        animationDuration: '30s',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationPlayState: pausedBottom ? 'paused' : 'running',
                    }}
                >
                    {BRAND_PARTNERS.map((p, i) => <BrandCard key={i} {...p} />)}
                </div>
            </div>

            <style>{`
                @keyframes mc-left  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
                @keyframes mc-right { from { transform: translateX(-50%); } to { transform: translateX(0); }    }
            `}</style>
        </section>
    );
}

// ─── Game partner card (tall) ─────────────────────────────────────────────────
function GameCard({ title, image, type, glow, category }: GamePartner) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative overflow-hidden rounded-2xl shrink-0 cursor-pointer select-none"
            style={{
                width: 240, height: 300,
                border: `1px solid ${hovered ? glow : 'rgba(255,255,255,0.07)'}`,
                boxShadow: hovered ? `0 0 50px ${glow}` : 'none',
                transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
                transition: 'all 0.4s cubic-bezier(0.23,1,0.32,1)',
                background: '#0a0a0a',
            }}>

            {/* Bg image/logo */}
            <div className="absolute inset-0" style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.5s ease' }}>
                {type === 'cover'
                    ? <img src={image} alt={title} className="w-full h-full object-cover" style={{ opacity: hovered ? 0.9 : 0.4, transition: 'opacity 0.4s' }} />
                    : <div className="w-full h-full flex items-center justify-center p-10">
                        <img src={image} alt={title} className="w-full h-full object-contain" style={{ opacity: hovered ? 0.95 : 0.4, transition: 'opacity 0.4s', filter: 'brightness(1.1)' }} />
                      </div>
                }
            </div>

            {/* Vignette */}
            <div className="absolute inset-0" style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 45%, transparent 100%)',
                transition: 'opacity 0.4s',
                opacity: hovered ? 0.8 : 1,
            }} />

            {/* Top glow on hover */}
            {hovered && <div className="absolute inset-0 pointer-events-none" style={{
                background: `radial-gradient(ellipse at 50% 0%, ${glow.replace(/[\d.]+\)$/, '0.2)')} 0%, transparent 65%)`,
            }} />}

            {/* Category pill */}
            <div className="absolute top-3 left-3">
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                    {category}
                </span>
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 w-full p-4" style={{ transform: hovered ? 'translateY(0)' : 'translateY(4px)', transition: 'transform 0.3s' }}>
                <p className="text-xs font-black uppercase tracking-widest text-white mb-2">{title}</p>
                <div className="h-px rounded-full" style={{
                    width: hovered ? '100%' : '0%',
                    background: `linear-gradient(90deg, #00ff00, ${glow.replace(/[\d.]+\)$/, '0.8)')})`,
                    boxShadow: hovered ? '0 0 8px rgba(0,255,0,0.8)' : 'none',
                    transition: 'width 0.5s ease',
                }} />
            </div>
        </div>
    );
}

// ─── Brand / hardware card (redesigned) ──────────────────────────────────────
function BrandCard({ title, logo, color, bg, category }: BrandPartner) {
    const [hovered, setHovered] = useState(false);
    const [imgOk, setImgOk]     = useState(true);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="relative flex flex-col items-center justify-center rounded-2xl shrink-0 cursor-pointer select-none overflow-hidden"
            style={{
                width: 190, height: 130,
                background: hovered ? bg : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hovered ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: hovered ? `0 8px 32px ${color}25, 0 0 0 1px ${color}20` : 'none',
                transform: hovered ? 'translateY(-7px) scale(1.04)' : 'translateY(0) scale(1)',
                transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
            }}>

            {/* Top color bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: hovered ? 1 : 0 }} />

            {/* Radial glow bg */}
            <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ background: `radial-gradient(ellipse at 50% 30%, ${color}14 0%, transparent 65%)`, opacity: hovered ? 1 : 0 }} />

            {/* Logo */}
            <div className="relative z-10 flex items-center justify-center mb-3"
                style={{ width: 56, height: 56 }}>
                {imgOk
                    ? <img
                        src={logo} alt={title}
                        className="object-contain w-full h-full"
                        style={{
                            opacity: hovered ? 1 : 0.5,
                            filter: hovered ? `drop-shadow(0 0 10px ${color}cc)` : 'grayscale(0.3)',
                            transition: 'all 0.3s ease',
                        }}
                        onError={() => setImgOk(false)}
                      />
                    : <span className="text-2xl font-black" style={{ color }}>{title.charAt(0)}</span>
                }
            </div>

            {/* Text */}
            <p className="relative z-10 text-[11px] font-black uppercase tracking-widest leading-none transition-colors duration-300"
                style={{ color: hovered ? color : 'rgba(255,255,255,0.55)' }}>
                {title}
            </p>
            <p className="relative z-10 text-[8px] font-bold uppercase tracking-[0.2em] mt-1 transition-colors duration-300"
                style={{ color: hovered ? `${color}80` : 'rgba(255,255,255,0.2)' }}>
                {category}
            </p>

            {/* Bottom bar sweep */}
            <div className="absolute bottom-0 left-0 h-0.5 rounded-full"
                style={{
                    width: hovered ? '100%' : '0%',
                    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    boxShadow: hovered ? `0 0 8px ${color}` : 'none',
                    transition: 'width 0.45s ease',
                }} />
        </div>
    );
}

// ─── Mobile App Section ───────────────────────────────────────────────────────

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.arenachain';
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(PLAY_STORE_URL)}&size=300x300&bgcolor=ffffff&color=0a0a0a&margin=14&format=png`;

// ── Small Phone Screen components ──

function PhoneScreenHome() {
    return (
        <div className="w-full h-full flex flex-col" style={{ background: '#080808', padding: '14px 10px 10px' }}>
            {/* Status bar */}
            <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>9:41</span>
                <div className="flex gap-1 items-center">
                    {[3,2,3].map((h,i) => <div key={i} style={{ width: 3, height: h+2, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />)}
                    <div style={{ width: 12, height: 6, border: '1px solid rgba(255,255,255,0.4)', borderRadius: 2, marginLeft: 2, position: 'relative' }}>
                        <div style={{ width: '70%', height: '100%', background: '#00ff00', borderRadius: 1 }} />
                    </div>
                </div>
            </div>
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
                <div>
                    <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>Welcome back,</p>
                    <p style={{ fontSize: 10, color: '#fff', fontWeight: 900, letterSpacing: '-0.3px' }}>Player_01</p>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#00ff00' }}>P</span>
                </div>
            </div>
            {/* XP bar */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 4, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #00cc00, #00ff00)', borderRadius: 99, boxShadow: '0 0 6px rgba(0,255,0,0.6)' }} />
            </div>
            {/* Live card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(0,255,0,0.12), rgba(0,200,0,0.05))', border: '1px solid rgba(0,255,0,0.2)', borderRadius: 10, padding: '8px 8px', marginBottom: 8 }}>
                <div className="flex justify-between items-start">
                    <div>
                        <div style={{ fontSize: 7, color: '#00ff00', fontWeight: 900, letterSpacing: '0.1em', marginBottom: 3 }}>🔴 LIVE TOURNAMENT</div>
                        <div style={{ fontSize: 9, color: '#fff', fontWeight: 900, lineHeight: 1.2 }}>CS2 World Cup</div>
                        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Finals · 128 players</div>
                    </div>
                    <div style={{ background: '#00ff00', color: '#000', fontSize: 7, fontWeight: 900, padding: '3px 6px', borderRadius: 6 }}>JOIN</div>
                </div>
                <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 6, height: 3, overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: '#00ff00', borderRadius: 6 }} />
                </div>
            </div>
            {/* Stats row */}
            <div className="flex gap-1.5" style={{ marginBottom: 8 }}>
                {[{ v: '2,840', l: 'ELO' }, { v: '#142', l: 'Rank' }, { v: '34W', l: 'Wins' }].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '5px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#fff', fontWeight: 900 }}>{s.v}</div>
                        <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{s.l}</div>
                    </div>
                ))}
            </div>
            {/* Bottom nav */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 7 }}>
                {['🏠','🏆','⚔️','💎','👤'].map((icon, i) => (
                    <div key={i} style={{ fontSize: 11, opacity: i === 0 ? 1 : 0.3 }}>{icon}</div>
                ))}
            </div>
        </div>
    );
}

function PhoneScreenNFT() {
    return (
        <div className="w-full h-full flex flex-col" style={{ background: '#080808', padding: '14px 10px 10px' }}>
            {/* Status bar */}
            <div className="flex justify-between items-center mb-3">
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>9:41</span>
                <div className="flex gap-1 items-center">
                    {[3,2,3].map((h,i) => <div key={i} style={{ width: 3, height: h+2, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />)}
                </div>
            </div>
            <p style={{ fontSize: 10, color: '#fff', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.3px' }}>My NFTs</p>
            {/* NFT Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                {[
                    { name: 'Shadow Warrior', rarity: 'EPIC', color: '#9C27B0' },
                    { name: 'Dragon Blade', rarity: 'LEGENDARY', color: '#FF9800' },
                    { name: 'Void Armor', rarity: 'RARE', color: '#2196F3' },
                    { name: 'Fire Spirit', rarity: 'MYTHIC', color: '#F44336' },
                ].map((nft, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${nft.color}30`, background: `linear-gradient(135deg, ${nft.color}15, rgba(0,0,0,0.5))`, padding: 6 }}>
                        <div style={{ width: '100%', aspectRatio: '1', background: `radial-gradient(circle, ${nft.color}30, transparent)`, borderRadius: 6, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {i === 0 ? '🥷' : i === 1 ? '⚔️' : i === 2 ? '🛡️' : '🔥'}
                        </div>
                        <div style={{ fontSize: 7, color: '#fff', fontWeight: 900, lineHeight: 1.2 }}>{nft.name}</div>
                        <div style={{ fontSize: 6, color: nft.color, fontWeight: 700, marginTop: 1 }}>{nft.rarity}</div>
                    </div>
                ))}
            </div>
            {/* Bottom nav */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 7 }}>
                {['🏠','🏆','⚔️','💎','👤'].map((icon, i) => (
                    <div key={i} style={{ fontSize: 11, opacity: i === 3 ? 1 : 0.3 }}>{icon}</div>
                ))}
            </div>
        </div>
    );
}

// ── Phone Frame ──
function PhoneFrame({ children, tilt = 0, scale = 1, zIndex = 0, style = {} }: {
    children: React.ReactNode; tilt?: number; scale?: number; zIndex?: number; style?: React.CSSProperties;
}) {
    return (
        <div style={{
            width: 200, height: 400,
            borderRadius: 36,
            background: 'linear-gradient(145deg, #1c1c1e, #0a0a0a)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
            transform: `rotate(${tilt}deg) scale(${scale})`,
            position: 'absolute',
            overflow: 'hidden',
            zIndex,
            ...style,
        }}>
            {/* Side buttons */}
            <div style={{ position: 'absolute', right: -2, top: 80, width: 3, height: 28, background: 'rgba(255,255,255,0.1)', borderRadius: '0 2px 2px 0' }} />
            <div style={{ position: 'absolute', left: -2, top: 70, width: 3, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: '2px 0 0 2px' }} />
            <div style={{ position: 'absolute', left: -2, top: 100, width: 3, height: 20, background: 'rgba(255,255,255,0.08)', borderRadius: '2px 0 0 2px' }} />
            {/* Notch */}
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 56, height: 14, background: '#0a0a0a', borderRadius: 99, border: '1px solid rgba(255,255,255,0.06)', zIndex: 10 }}>
                <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
            </div>
            {/* Screen */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 34, overflow: 'hidden', background: '#080808' }}>
                {children}
            </div>
        </div>
    );
}

function MobileAppSection() {
    return (
        <RevealSection
            className="relative overflow-hidden"
            style={{ background: '#030303', paddingTop: 100, paddingBottom: 120 }}
        >
            {/* ── Backgrounds ── */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(0,255,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.02) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
            }} />
            {/* Big green glow — behind phones */}
            <div className="absolute pointer-events-none" style={{
                right: '10%', top: '50%', transform: 'translateY(-50%)',
                width: 600, height: 700,
                background: 'radial-gradient(ellipse, rgba(0,255,0,0.07) 0%, transparent 65%)',
                filter: 'blur(30px)',
            }} />
            {/* Top-left accent glow */}
            <div className="absolute pointer-events-none" style={{
                left: '-5%', top: '20%',
                width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(0,100,255,0.05) 0%, transparent 65%)',
                filter: 'blur(50px)',
            }} />

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">

                    {/* ════ LEFT COLUMN ════ */}
                    <div className="flex-1 lg:pr-16 text-center lg:text-left">

                        {/* Eyebrow */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
                            style={{ background: 'rgba(0,255,0,0.06)', border: '1px solid rgba(0,255,0,0.15)' }}>
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00ff00', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#00ff00' }} />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: '#00ff00' }}>Now on Android</span>
                        </div>

                        {/* Heading */}
                        <h2 className="font-black uppercase tracking-tighter leading-[0.92] mb-6"
                            style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)' }}>
                            Your arena.<br />
                            <span style={{ color: '#00ff00', textShadow: '0 0 40px rgba(0,255,0,0.3)' }}>Always live.</span><br />
                            Always with you.
                        </h2>

                        <p className="text-sm leading-relaxed mb-10 max-w-sm mx-auto lg:mx-0"
                            style={{ color: 'rgba(255,255,255,0.32)' }}>
                            Compete, manage your NFTs, track live matches, and connect with your squad —
                            all from one blazing-fast mobile app.
                        </p>

                        {/* App metrics */}
                        <div className="flex items-center gap-6 justify-center lg:justify-start mb-10">
                            {[
                                { v: '4.9', s: '★', l: 'Rating' },
                                { v: '50K+', s: '', l: 'Downloads' },
                                { v: '#1', s: '', l: 'Esports App' },
                            ].map((m, i) => (
                                <React.Fragment key={i}>
                                    <div className="text-center lg:text-left">
                                        <div className="font-black text-white" style={{ fontSize: 22, lineHeight: 1 }}>
                                            {m.v}<span style={{ color: '#00ff00', fontSize: 14 }}>{m.s}</span>
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{m.l}</div>
                                    </div>
                                    {i < 2 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Download row — side by side */}
                        <div className="flex flex-col sm:flex-row items-stretch gap-4 justify-center lg:justify-start">

                            {/* ── Google Play badge (tall) ── */}
                            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_36px_rgba(0,255,0,0.2)]"
                                style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px', minWidth: 180 }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,0,0.35)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                            >
                                <svg width="44" height="44" viewBox="0 0 24 24" style={{ color: '#00ff00' }} fill="currentColor">
                                    <path d="M3.18 23.76c.3.17.65.2.98.1l11.93-6.9-2.65-2.65-10.26 9.45ZM.5 1.4A1.5 1.5 0 0 0 0 2.5v19a1.5 1.5 0 0 0 .5 1.1l.06.06 10.64-10.64v-.25L.56 1.34l-.06.06ZM21.3 10.28l-2.87-1.66-2.96 2.96 2.96 2.96 2.89-1.67a1.5 1.5 0 0 0 0-2.59ZM3.18.24 14.44 7.14l-2.65 2.65L.2.34A1.18 1.18 0 0 1 3.18.24Z"/>
                                </svg>
                                <div className="text-center">
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>GET IT ON</div>
                                    <div style={{ fontSize: 20, color: '#fff', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>Google Play</div>
                                </div>
                            </a>

                            {/* ── QR card ── */}
                            <div className="flex items-center gap-5 rounded-2xl"
                                style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px' }}>
                                {/* QR image */}
                                <div className="relative rounded-xl overflow-hidden shrink-0"
                                    style={{ background: '#ffffff', padding: 6, border: '1px solid rgba(0,255,0,0.2)', lineHeight: 0 }}>
                                    <img
                                        src={QR_URL}
                                        alt="Scan to download Arena Chain"
                                        width={140}
                                        height={140}
                                        className="block rounded-md"
                                    />
                                    {/* Center logo */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div style={{
                                            width: 26, height: 26, borderRadius: 6,
                                            background: '#ffffff', border: '1.5px solid rgba(0,180,0,0.6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <span style={{ fontSize: 10, fontWeight: 900, color: '#00bb00' }}>A</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Label */}
                                <div className="flex flex-col gap-1">
                                    <div style={{ fontSize: 11, color: '#fff', fontWeight: 900, letterSpacing: '0.04em' }}>Scan to Download</div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, lineHeight: 1.6 }}>
                                        Open your camera &amp;<br />point it at the code
                                    </div>
                                    <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
                                    <a
                                        href={PLAY_STORE_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 10, color: 'rgba(0,255,0,0.6)', fontWeight: 700, textDecoration: 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#00ff00')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,0,0.6)')}
                                    >
                                        Or tap to open Play Store →
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ════ RIGHT COLUMN — Phone showcase ════ */}
                    <div className="relative flex-shrink-0" style={{ width: 420, height: 480 }}>

                        {/* ── Back phone (NFT screen, tilted) ── */}
                        <PhoneFrame tilt={8} scale={0.82} zIndex={1} style={{ top: 60, right: 10 }}>
                            <PhoneScreenNFT />
                        </PhoneFrame>

                        {/* ── Front phone (Home screen) ── */}
                        <PhoneFrame tilt={-4} scale={1} zIndex={2} style={{ top: 20, left: 20 }}>
                            <PhoneScreenHome />
                        </PhoneFrame>

                        {/* ── Floating notification card (top right) ── */}
                        <div className="absolute z-10" style={{
                            top: -10, right: -20,
                            background: 'rgba(10,10,10,0.92)',
                            border: '1px solid rgba(0,255,0,0.25)',
                            borderRadius: 14,
                            padding: '10px 14px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,255,0,0.08)',
                            animation: 'float 4s ease-in-out infinite',
                            minWidth: 170,
                        }}>
                            <div className="flex items-center gap-2.5">
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏆</div>
                                <div>
                                    <div style={{ fontSize: 9, color: '#00ff00', fontWeight: 900, letterSpacing: '0.05em' }}>QUALIFIED!</div>
                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 1 }}>You're in the Finals</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Floating win card (bottom left) ── */}
                        <div className="absolute z-10" style={{
                            bottom: -10, left: -10,
                            background: 'rgba(10,10,10,0.92)',
                            border: '1px solid rgba(255,152,0,0.25)',
                            borderRadius: 14,
                            padding: '10px 14px',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            animation: 'float 5s ease-in-out infinite 1.5s',
                            minWidth: 155,
                        }}>
                            <div className="flex items-center gap-2.5">
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💰</div>
                                <div>
                                    <div style={{ fontSize: 9, color: '#FF9800', fontWeight: 900 }}>PRIZE EARNED</div>
                                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 900, marginTop: 1 }}>+ $250.00</div>
                                </div>
                            </div>
                        </div>

                        {/* ── Floating match live pill (middle right) ── */}
                        <div className="absolute z-10" style={{
                            top: '45%', right: -35,
                            background: 'rgba(10,10,10,0.9)',
                            border: '1px solid rgba(255,50,50,0.3)',
                            borderRadius: 99,
                            padding: '6px 12px',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', gap: 6,
                            animation: 'float 6s ease-in-out infinite 0.5s',
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 6px #ff4444', display: 'inline-block' }} />
                            <span style={{ fontSize: 8, color: '#ff4444', fontWeight: 900, letterSpacing: '0.1em' }}>LIVE MATCH</span>
                        </div>

                        {/* Glow beneath phone stack */}
                        <div className="absolute pointer-events-none" style={{
                            bottom: -30, left: '25%', transform: 'translateX(-50%)',
                            width: 240, height: 50,
                            background: 'rgba(0,255,0,0.12)',
                            filter: 'blur(25px)',
                            borderRadius: '50%',
                        }} />
                    </div>

                </div>
            </div>
        </RevealSection>
    );
}

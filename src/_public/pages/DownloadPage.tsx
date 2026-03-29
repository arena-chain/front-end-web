import { Link } from 'react-router-dom';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { Download, Monitor, Shield, Zap } from 'lucide-react';

export default function DownloadPage() {
    return (
        <div className="min-h-screen bg-[#040404] text-white">
            <TopNavbar />
            <main className="pt-[66px] pb-24">
                <div className="max-w-4xl mx-auto px-6 py-16">
                    <div className="text-center mb-14">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
                            Download <span className="text-primary">ArenaChain</span>
                        </h1>
                        <p className="text-white/60 text-lg max-w-xl mx-auto">
                            Get the desktop client for the best experience. Compete, track stats, and join tournaments.
                        </p>
                    </div>

                    {/* Main download card */}
                    <div
                        className="rounded-3xl overflow-hidden border border-primary/20 mb-12"
                        style={{ background: 'linear-gradient(180deg, rgba(0,255,0,0.06) 0%, rgba(0,0,0,0.4) 100%)', boxShadow: '0 0 60px rgba(0,255,0,0.08)' }}
                    >
                        <div className="p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/20 border border-primary/30">
                                        <Monitor className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Windows Client</h2>
                                        <p className="text-sm text-white/50">Windows 10 / 11 · 64-bit</p>
                                    </div>
                                </div>
                                <ul className="space-y-3 text-white/70 text-sm mb-6">
                                    <li className="flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-primary shrink-0" /> Low latency, native performance
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary shrink-0" /> Secure, no account required to download
                                    </li>
                                </ul>
                                <div className="flex flex-wrap gap-4 text-xs text-white/40">
                                    <span><strong className="text-white/60">Version</strong> v2.4.1 — Latest</span>
                                    <span><strong className="text-white/60">Size</strong> 148 MB</span>
                                    <span><strong className="text-white/60">Format</strong> .exe Installer</span>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <a
                                    href="#"
                                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-black uppercase tracking-widest text-black transition-all duration-200"
                                    style={{ background: 'linear-gradient(135deg, #00ff00 0%, #00cc44 100%)', boxShadow: '0 0 24px rgba(0,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 36px rgba(0,255,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
                                >
                                    <Download size={20} />
                                    Download for Windows · Free
                                </a>
                                <p className="text-center text-xs text-white/40 mt-3">No account required</p>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-white/40 text-sm">
                        Other platforms coming soon. <Link to="/" className="text-primary hover:underline">Back to home</Link>
                    </p>
                </div>
            </main>
            <BottomNavbar />
        </div>
    );
}

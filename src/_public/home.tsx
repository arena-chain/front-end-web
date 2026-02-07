import { Button } from '../components/ui/core'; // Import from outside _public for now, assuming ui/core is shared
import { TopNavbar } from './common/top_navbar';
import { BottomNavbar } from './common/bottom_navbar';
import { Shield, Trophy, Users, Sword, MessageSquare } from 'lucide-react';
import valorantCover from '../assets/valorant_cover.jpg';
import lolCover from '../assets/lol.jpg';
import riotLogo from '../assets/riot-games-logo.svg';
import steamLogo from '../assets/steam.png';

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-black">
            <TopNavbar />

            <main>
                {/* 1. Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
                    </div>

                    <div className="container relative z-10 px-6 mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-medium text-primary tracking-wider uppercase">Next Gen Gaming</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none">
                            Collaborate <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary bg-300% animate-gradient">
                                Elevate
                            </span> <br />
                            Tournaments
                        </h1>

                        <p className="max-w-2xl mx-auto text-text-muted text-lg md:text-xl mb-10 leading-relaxed">
                            Join the ultimate competitive ecosystem. Book matches, participate in global tournaments, and rise through the ranks to become a legend.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button size="lg" className="min-w-[200px] shadow-[0_0_20px_rgba(0,255,0,0.3)] shadow-primary/20">
                                Play Now
                            </Button>
                            <Button variant="outline" size="lg" className="min-w-[200px]">
                                View Tournaments
                            </Button>
                        </div>
                    </div>
                </section>

                {/* 2. About / Features Section */}
                <section id="about" className="py-24 bg-surface/50 border-y border-white/5 relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Why Arena Chain?</h2>
                            <p className="text-text-muted max-w-xl mx-auto">Dominate the competition with our state-of-the-art matchmaking and tournament systems.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Sword className="w-8 h-8 text-primary" />}
                                title="Book Matches"
                                description="Instant matchmaking with ELO-balanced lobbies. Find your perfect opponents in seconds."
                            />
                            <FeatureCard
                                icon={<Trophy className="w-8 h-8 text-primary" />}
                                title="Tournaments"
                                description="Daily, weekly, and monthly tournaments with automated bracket generation and prize pools."
                            />
                            <FeatureCard
                                icon={<Shield className="w-8 h-8 text-primary" />}
                                title="Secure & Fair"
                                description="Blockchain-verified results and industry-leading anti-cheat integration."
                            />
                        </div>
                    </div>
                </section>

                {/* 3. Partners Section */}
                <section id="partners" className="py-24 bg-black relative overflow-hidden">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-12">Trusted by Industry Leaders</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            <PartnerCard
                                title="Riot Games"
                                image={riotLogo}
                                type="logo"
                                className="hover:shadow-[0_0_30px_rgba(211,41,54,0.3)] hover:border-[#D32936]/50" /* Riot Red Glow on Hover */
                            />
                            <PartnerCard
                                title="Valorant"
                                image={valorantCover}
                                type="cover"
                            />
                            <PartnerCard
                                title="League of Legends"
                                image={lolCover}
                                type="cover"
                            />
                            <PartnerCard
                                title="Steam"
                                image={steamLogo}
                                type="logo"
                                className="hover:shadow-[0_0_30px_rgba(23,26,33,0.5)] hover:border-[#171a21]/50" /* Steam Blue-ish Glow on Hover */
                            />
                        </div>
                    </div>
                </section>

                {/* 4. Support Section */}
                <section id="support" className="py-24 relative">
                    <div className="container mx-auto px-6">
                        <div className="bg-gradient-to-r from-surface to-surface/50 border border-white/10 rounded-2xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl">
                                <div className="inline-flex items-center gap-2 text-primary mb-4">
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="font-bold uppercase tracking-wider text-sm">24/7 Support</span>
                                </div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">Need Assistance?</h2>
                                <p className="text-text-muted text-lg mb-8">
                                    Our dedicated support team is here to help you with any issues, from match disputes to account recovery.
                                </p>
                                <div className="flex gap-4">
                                    <Button>Contact Support</Button>
                                    <Button variant="ghost">Join Discord</Button>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Decor */}
                                <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full" />
                                <div className="relative bg-black border border-white/10 p-6 rounded-xl max-w-xs rotate-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">Player Support</div>
                                            <div className="text-xs text-green-500">Online Now</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-muted">"Hey! How can I help you with your tournament registration today?"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNavbar />
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group p-8 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all duration-300">
            <div className="mb-6 p-4 rounded-lg bg-black inline-block group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-primary/50 text-primary">
                {icon}
            </div>
            <h3 className="text-xl font-bold uppercase tracking-wide mb-3">{title}</h3>
            <p className="text-text-muted leading-relaxed">{description}</p>
        </div>
    );
}

function PartnerCard({ title, image, type, className = "" }: { title: string, image: string, type: 'cover' | 'logo', className?: string }) {
    return (
        <div className={`group relative h-64 overflow-hidden rounded-xl border border-white/5 transition-all duration-500 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] ${className}`}>
            {/* Background Content */}
            <div className="absolute inset-0 transition-all duration-500 group-hover:scale-110">
                {type === 'cover' ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-8">
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-contain filter drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                        />
                    </div>
                )}
            </div>

            {/* Overlay Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500 ${type === 'logo' ? 'via-transparent' : ''}`} />

            {/* Text Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-xl font-black uppercase tracking-wider text-white drop-shadow-md">
                    {title}
                </h3>
                <div className="h-1 w-0 group-hover:w-full bg-primary mt-2 transition-all duration-500 ease-out" />
            </div>
        </div>
    );
}

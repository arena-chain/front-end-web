import { Gamepad2, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';

export function BottomNavbar() {
    return (
        <footer className="bg-black border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Gamepad2 className="w-8 h-8 text-primary" />
                            <span className="text-2xl font-black tracking-tighter uppercase italic text-white">
                                Arena<span className="text-primary">Chain</span>
                            </span>
                        </div>
                        <p className="text-text-muted text-sm leading-relaxed">
                            The ultimate competitive gaming platform. Join tournaments, climb the ranks, and earn rewards on the blockchain.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="p-2 bg-surface rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-surface rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-surface rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 bg-surface rounded-lg text-text-muted hover:text-primary hover:bg-white/5 transition-all">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wider mb-4">Platform</h3>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-primary transition-colors">Play</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Tournaments</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Leaderboards</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Teams</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wider mb-4">Support</h3>
                        <ul className="space-y-3 text-sm text-text-muted">
                            <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Rules & Regulations</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Newsletter or Contact */}
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wider mb-4">Stay User</h3>
                        <p className="text-text-muted text-sm mb-4">
                            Subscribe to our newsletter for the latest tournament updates.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="bg-surface border border-white/10 rounded px-4 py-2 text-sm text-white w-full focus:border-primary outline-none"
                            />
                            <button className="bg-primary hover:bg-primary-dark text-black font-bold px-4 py-2 rounded transition-colors">
                                GO
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                    <p>&copy; 2024 Arena-Chain. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

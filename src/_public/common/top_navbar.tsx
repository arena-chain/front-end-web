import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/core';
import { Gamepad2, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export function TopNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group" onClick={() => window.scrollTo(0, 0)}>
                    <Gamepad2 className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-2xl font-black tracking-tighter uppercase italic">
                        Arena<span className="text-primary">Chain</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors" onClick={() => window.scrollTo(0, 0)}>Home</Link>
                    <a href="#about" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors">About</a>
                    <a href="#tournaments" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors">Tournaments</a>
                    <a href="#partners" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors">Partners</a>
                    <a href="#news" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors">News</a>
                    <a href="#support" className="text-sm font-bold uppercase tracking-wider text-text-muted hover:text-white transition-colors">Support</a>
                </div>

                {/* Auth Buttons */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login">
                        <Button variant="ghost" className="font-bold">Log In</Button>
                    </Link>
                    <Link to="/register">
                        <Button variant="primary">Register</Button>
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu className="w-8 h-8" />
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={cn(
                "md:hidden fixed inset-x-0 top-20 bg-background border-b border-white/5 p-6 space-y-4 transition-all duration-300 origin-top",
                isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
            )}>
                <Link to="/" className="block text-lg font-bold text-white">Home</Link>
                <a href="#about" className="block text-lg font-bold text-white">About</a>
                <a href="#tournaments" className="block text-lg font-bold text-white">Tournaments</a>
                <a href="#partners" className="block text-lg font-bold text-white">Partners</a>
                <a href="#news" className="block text-lg font-bold text-white">News</a>
                <a href="#support" className="block text-lg font-bold text-white">Support</a>
                <div className="pt-4 flex flex-col gap-3">
                    <Link to="/login"><Button className="w-full" variant="secondary">Log In</Button></Link>
                    <Link to="/register"><Button className="w-full" variant="primary">Register</Button></Link>
                </div>
            </div>
        </nav>
    );
}

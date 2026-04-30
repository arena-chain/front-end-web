import { Calendar, ArrowRight, Newspaper } from 'lucide-react';
import { Button } from '../../components/ui/core';
import { Link } from 'react-router-dom';

export function NewsSection() {
    return (
        <section id="news" className="min-h-screen flex flex-col justify-center py-24 bg-surface border-y border-white/5 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-primary mb-4">
                            <Newspaper className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-wider text-sm">Latest Updates</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                            Gaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">News</span>
                        </h2>
                    </div>
                    <Link to="/news">
                        <Button variant="outline" className="gap-2">
                            View All News <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                    {/* Main Featured News */}
                    <div className="lg:col-span-2 group relative rounded-2xl overflow-hidden h-[400px] border border-white/10">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <div className="flex gap-3 mb-3">
                                <span className="px-3 py-1 bg-primary text-black text-xs font-bold uppercase rounded-full">Esports</span>
                                <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold uppercase rounded-full backdrop-blur-sm">5 Min Read</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                Global Championship 2024: The Qualified Teams
                            </h3>
                            <p className="text-gray-300 line-clamp-2 mb-4">
                                The road to the finals has been intense. Here are the top 16 teams that have secured their spot in the biggest tournament of the year.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-text-muted">
                                <Calendar className="w-4 h-4" />
                                <span>Oct 15, 2024</span>
                            </div>
                        </div>
                    </div>

                    {/* Side News List */}
                    <div className="space-y-4">
                        <NewsCard
                            image="https://images.unsplash.com/photo-1593305841991-05c29736ce37?q=80&w=800&auto=format&fit=crop"
                            category="Patch Notes"
                            title="Valorant Update 8.04: Agent Balances & Map Changes"
                            date="Oct 14, 2024"
                        />
                        <NewsCard
                            image="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop"
                            category="Tech"
                            title="Next-Gen Consoles: What We Know So Far"
                            date="Oct 12, 2024"
                        />
                        <NewsCard
                            image="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800&auto=format&fit=crop"
                            category="Community"
                            title="Arena Chain Charity Event Raises $1M"
                            date="Oct 10, 2024"
                        />
                    </div>
                </div>


            </div>

            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        </section>
    );
}

function NewsCard({ image, category, title, date }: { image: string, category: string, title: string, date: string }) {
    return (
        <div className="group flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer">
            <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-between">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 block">{category}</span>
                    <h4 className="font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                    </h4>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>{date}</span>
                </div>
            </div>
        </div>
    );
}

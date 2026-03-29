import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/core';
import { Calendar, Clock, ArrowRight, X, User } from 'lucide-react';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { MOCK_NEWS } from '../data/newsData';

export default function NewsPage() {
    const [selectedArticle, setSelectedArticle] = useState<typeof MOCK_NEWS[0] | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <TopNavbar />

            <main className="flex-grow pt-32 pb-12">
                <div className="container mx-auto px-6 max-w-5xl">
                    <div className="space-y-6">
                        {MOCK_NEWS.map((news) => (
                            <div
                                key={news.id}
                                className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all duration-300"
                            >
                                <div className="w-full md:w-64 h-48 md:h-auto shrink-0 rounded-xl overflow-hidden relative">
                                    <img
                                        src={news.image}
                                        alt={news.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 bg-black/80 text-primary text-[10px] font-bold uppercase rounded backdrop-blur-md">
                                            {news.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between py-2 flex-grow">
                                    <div>
                                        <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{news.date}</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-white/20" />
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{news.readTime}</span>
                                            </div>
                                        </div>

                                        <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                            {news.title}
                                        </h2>

                                        <p className="text-text-muted line-clamp-2 md:line-clamp-3 mb-6">
                                            {news.snippet}
                                        </p>
                                    </div>

                                    <div>
                                        <Button
                                            className="group/btn"
                                            onClick={() => setSelectedArticle(news)}
                                        >
                                            Read Full Article <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <BottomNavbar />

            {/* Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        onClick={() => setSelectedArticle(null)}
                    />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="absolute top-4 right-4 z-20">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedArticle(null)}
                                className="bg-black/50 hover:bg-black/80 text-white rounded-full p-2 h-auto backdrop-blur-md"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar flex-grow">
                            <div className="relative h-[300px] md:h-[400px] shrink-0">
                                <img
                                    src={selectedArticle.image}
                                    alt={selectedArticle.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />
                                <div className="absolute bottom-0 left-0 p-8 w-full">
                                    <span className="px-3 py-1 bg-primary text-black text-xs font-bold uppercase rounded-full mb-4 inline-block shadow-lg">
                                        {selectedArticle.category}
                                    </span>
                                    <h1 className="text-2xl md:text-4xl font-black uppercase leading-tight drop-shadow-md">
                                        {selectedArticle.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center gap-6 text-sm text-text-muted mb-8 border-b border-white/10 pb-8">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span>{selectedArticle.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        <span>{selectedArticle.readTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        <span>{selectedArticle.author}</span>
                                    </div>
                                </div>

                                <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:uppercase prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary">
                                    {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx} className="mb-6">
                                            {paragraph}
                                        </p>
                                    ))}
                                </article>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

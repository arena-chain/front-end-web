import { useParams, Link } from 'react-router-dom';
import { Button } from '../../components/ui/core';
import { Calendar, ArrowLeft, Clock, User } from 'lucide-react';
import { TopNavbar } from '../common/top_navbar';
import { BottomNavbar } from '../common/bottom_navbar';
import { MOCK_NEWS } from '../data/newsData';

export default function NewsArticlePage() {
    const { id } = useParams();
    const article = MOCK_NEWS.find(n => n.id === Number(id));

    if (!article) {
        return (
            <div className="min-h-screen bg-background text-white flex flex-col">
                <TopNavbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
                        <Link to="/news">
                            <Button>Back to News</Button>
                        </Link>
                    </div>
                </div>
                <BottomNavbar />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white flex flex-col">
            <TopNavbar />

            <main className="flex-grow pt-24 pb-12">
                <div className="container mx-auto px-6 max-w-4xl">
                    <Link to="/news">
                        <Button
                            variant="ghost"
                            className="mb-8 hover:bg-white/5"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
                        </Button>
                    </Link>

                    <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-primary/10">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                            <span className="px-3 py-1 bg-primary text-black text-xs font-bold uppercase rounded-full mb-4 inline-block shadow-lg">
                                {article.category}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight drop-shadow-md">
                                {article.title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-text-muted mb-8 border-b border-white/10 pb-8">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{article.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{article.readTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span>{article.author}</span>
                        </div>
                    </div>

                    <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:uppercase prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-primary">
                        {article.content.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-6">
                                {paragraph}
                            </p>
                        ))}
                    </article>
                </div>
            </main>

            <BottomNavbar />
        </div>
    );
}

import { Trash2 } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/core';
import { addReelComment, deleteReelComment, type ReelEngagementState } from '../lib/scouterReelEngagement';

type SetEngagement = Dispatch<SetStateAction<ReelEngagementState>>;

interface Props {
    videoId: string | null;
    videoTitle: string;
    engagement: ReelEngagementState;
    setEngagement: SetEngagement;
    onClose: () => void;
}

export function ScouterReelCommentsModal({ videoId, videoTitle, engagement, setEngagement, onClose }: Props) {
    const [draft, setDraft] = useState('');

    const comments = videoId ? engagement.comments[videoId] ?? [] : [];

    const handleClose = () => {
        setDraft('');
        onClose();
    };

    const submit = () => {
        if (!videoId || !draft.trim()) return;
        setEngagement((s) => addReelComment(s, videoId, draft));
        setDraft('');
        toast.success('Comment added');
    };

    return (
        <Modal isOpen={Boolean(videoId)} onClose={handleClose} title={`Comments · ${videoTitle}`} size="md">
            <div className="p-4 sm:p-6 space-y-4 border-t border-white/5">
                <p className="text-xs text-white/45">
                    Private scouting notes on this clip. Stored locally for your account until API sync exists.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submit()}
                        placeholder="Add a comment…"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!draft.trim()}
                        className="px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/35 text-primary font-bold text-sm hover:bg-primary/30 disabled:opacity-40"
                    >
                        Post
                    </button>
                </div>
                <ul className="space-y-3 max-h-[min(50vh,320px)] overflow-y-auto custom-scrollbar">
                    {comments.length === 0 ? (
                        <li className="text-sm text-white/40 py-6 text-center">No comments yet.</li>
                    ) : (
                        [...comments].reverse().map((c) => (
                            <li
                                key={c.id}
                                className="flex gap-3 items-start rounded-xl border border-white/8 bg-white/[0.03] p-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/90 whitespace-pre-wrap break-words">{c.text}</p>
                                    <p className="text-[10px] text-white/35 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        videoId &&
                                        setEngagement((s) => deleteReelComment(s, videoId, c.id))
                                    }
                                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                                    aria-label="Delete comment"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </Modal>
    );
}

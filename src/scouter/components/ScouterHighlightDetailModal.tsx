import React from 'react';

export const ScouterHighlightDetailModal: React.FC<{
    highlights: any[];
    activeHighlightId: string | null;
    onClose: () => void;
    onNavigate: (id: string | null) => void;
}> = ({ highlights, activeHighlightId, onClose }) => {
    if (!activeHighlightId) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-slate-900 p-6 rounded-xl border border-white/10" onClick={e => e.stopPropagation()}>
                <h2 className="text-white">Highlight Details (Stub)</h2>
                <p className="text-white/40 text-sm">Browsing {highlights.length} clips</p>
                <button onClick={onClose} className="mt-4 text-primary font-bold">Close</button>
            </div>
        </div>
    );
};

export default ScouterHighlightDetailModal;

import React from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentStatus } from '../../../models/tournament';
import { Trophy, Trash2, Ban, LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { resolveBackendAssetUrl } from '../../../lib/apiBase';
import { placeholderImage } from '../../../lib/placeholderImage';


interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
  isOfficial?: boolean;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onBlock?: (id: string, isBlocked: boolean) => void;
  isSelected?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onClick, isOfficial = false, onDelete, onCancel, onBlock, isSelected = false }: TournamentCardProps) => {
  const isBlocked = tournament.status === TournamentStatus.BLOCKED;
  const getImageUrl = (url?: string) => {
    if (!url) return placeholderImage(800, 450, 'Tournament');
    if (url.startsWith('http')) return url;
    return resolveBackendAssetUrl(url);
  };

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN_REGISTRATION:
        return <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-tighter border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> OPEN
        </span>;
      case TournamentStatus.ONGOING:
        return <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#00ff88]/20 text-[#00ff88] text-[10px] font-black uppercase tracking-tighter border border-[#00ff88]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> LIVE
        </span>;
      case TournamentStatus.COMPLETED:
        return <span className="px-2 py-1 rounded-md bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-tighter border border-white/10">ENDED</span>;
      case TournamentStatus.BLOCKED:
        return <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-tighter border border-red-500/30">
          <LockKeyhole size={9} /> BLOCKED
        </span>;
      default:
        return <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-tighter border border-blue-500/20">UPCOMING</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const progress = (tournament.currentTeams / tournament.maxTeams) * 100;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#141419] border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col hover:translate-y-[-4px] ${isSelected ? 'border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'border-[#2a2a35] hover:border-[#00ff88]/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
        }`}
    >
      {/* Top Image Section */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url(${getImageUrl(tournament.bannerImageUrl)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141419] via-[#141419]/20 to-transparent" />

        <div className="absolute top-3 left-3 flex gap-2">
          {getStatusBadge(tournament.status)}
          {isOfficial && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-tighter border border-yellow-500/20">
              <Trophy size={10} /> Official
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[10px] font-black text-[#00ff88] uppercase tracking-tighter bg-[#00ff88]/10 px-2 py-0.5 rounded border border-[#00ff88]/10">
            {typeof tournament.gameId === 'object' && tournament.gameId?.title ? tournament.gameId.title : 'Game'}
          </span>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
            {tournament.format?.replace('_', ' ') || 'Single Elimination'}
          </span>
          {tournament.region && (
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest border-l border-white/10 pl-2">
              {tournament.region}
            </span>
          )}
          {tournament.gameMode && (
            <span className="text-[8px] font-black text-[#00ff88]/40 uppercase tracking-widest ml-auto">
              {tournament.gameMode}
            </span>
          )}
        </div>

        <h3 className="text-base font-black text-white leading-tight mb-3 line-clamp-2 min-h-[3rem] group-hover:text-[#00ff88] transition-colors">
          {tournament.name}
        </h3>

        {/* Progress Bar */}
        <div className="mt-auto">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Participants</span>
            <span className="text-xs font-black text-white">{tournament.currentTeams}/{tournament.maxTeams} <span className="text-white/40 text-[10px]">Teams</span></span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[#00cc00] to-[#00ff88] rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Prize Pool</span>
              <span className="text-sm font-black text-[#00ff88]">{formatPrize(tournament.prizePool)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Start Date</span>
              <span className="text-xs font-bold text-white/70">{formatDate(tournament.startDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions Overlay (Hidden by default, shown on hover) */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onBlock?.(tournament._id, isBlocked); }}
          className={`p-1.5 bg-[#141419]/80 backdrop-blur-md border rounded-lg transition-all ${isBlocked
              ? 'border-green-400/50 text-green-400 hover:bg-green-500/10'
              : 'border-white/10 text-white/60 hover:text-red-400 hover:border-red-400/50'
            }`}
          title={isBlocked ? 'Unblock tournament' : 'Block tournament'}
        >
          {isBlocked ? <LockKeyholeOpen size={14} /> : <LockKeyhole size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCancel?.(tournament._id); }}
          className="p-1.5 bg-[#141419]/80 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-yellow-400 hover:border-yellow-400/50 transition-all"
          title="Cancel"
        >
          <Ban size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(tournament._id); }}
          className="p-1.5 bg-[#141419]/80 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-red-400 hover:border-red-400/50 transition-all"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Fill-on-hover primary button indicator (Glow effect at bottom) */}
      <div className="h-1 w-0 group-hover:w-full bg-[#00ff88] transition-all duration-300 shadow-[0_0_15px_rgba(0,255,136,0.8)]" />
    </div>
  );
};

export default TournamentCard;

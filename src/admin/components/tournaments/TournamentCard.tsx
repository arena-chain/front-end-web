import React from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentStatus } from '../../../models/tournament';
import { Trophy, Calendar, Users, DollarSign, Trash2, Ban } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
  isOfficial?: boolean;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
  isSelected?: boolean;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onClick, isOfficial = false, onDelete, onCancel, isSelected = false }: TournamentCardProps) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/800x400/121212/222222?text=Tournament';
    if (url.startsWith('http')) return url;
    // Assuming relative paths from backend like 'uploads/...'
    return `${API_URL}/${url.startsWith('/') ? url.slice(1) : url}`;
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.OPEN_REGISTRATION: return 'text-green-400 border-green-400/30 bg-green-400/10';
      case TournamentStatus.ONGOING: return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case TournamentStatus.COMPLETED: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      case TournamentStatus.CANCELLED: return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-[#1A1D21] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 w-full flex items-center hover:bg-white/5 ${isSelected
        ? 'border-primary shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.3)]'
        : 'border-white/5 hover:border-white/10'
        }`}
    >
      {/* Left: Compact Image */}
      <div className="w-32 h-24 flex-shrink-0 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={{
            backgroundImage: `url(${getImageUrl(tournament.bannerImageUrl)})`,
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Middle: Info */}
      <div className="flex-1 px-4 py-3 min-w-0 flex flex-col justify-center h-full">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-1.5 py-0.5 rounded">
            {typeof tournament.gameId === 'object' && tournament.gameId?.title
              ? tournament.gameId.title
              : 'Game'}
          </span>
          {isOfficial && (
            <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase bg-yellow-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Trophy size={10} /> Official
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-white truncate group-hover:text-primary transition-colors mb-1">
          {tournament.name}
        </h3>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>{formatDate(tournament.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span>{tournament.currentTeams}/{tournament.maxTeams} Teams</span>
          </div>
        </div>
      </div>

      {/* Right: Status & Prize */}
      <div className="px-6 py-3 flex flex-col items-end gap-2 border-l border-white/5 h-24 justify-center bg-black/20 min-w-[140px]">
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(tournament.status)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {tournament.status.replace('_', ' ')}
        </div>

        {tournament.prizePool > 0 && (
          <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
            <DollarSign size={14} />
            {formatPrize(tournament.prizePool)}
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 bg-[#1A1D21] pl-4 border-l border-white/10 shadow-xl z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onCancel?.(tournament._id); }}
          className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-yellow-400 transition-colors"
          title="Cancel"
        >
          <Ban size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(tournament._id); }}
          className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;

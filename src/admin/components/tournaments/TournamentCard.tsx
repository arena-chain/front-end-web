import React from 'react';
import type { Tournament } from '../../../models/tournament';
import { TournamentStatus } from '../../../models/tournament';
import { Trophy, Calendar, Users, DollarSign, Trash2, Ban } from 'lucide-react';
import { Badge } from '../../../components/ui/core';

interface TournamentCardProps {
  tournament: Tournament;
  onClick: () => void;
  isOfficial?: boolean;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onClick, isOfficial = false, onDelete, onCancel }: TournamentCardProps) => {
  const getStatusBadgeVariant = (status: TournamentStatus): 'primary' | 'success' | 'info' | 'secondary' | 'danger' => {
    switch (status) {
      case TournamentStatus.OPEN_REGISTRATION:
        return 'primary';
      case TournamentStatus.ONGOING:
        return 'info';
      case TournamentStatus.COMPLETED:
        return 'secondary';
      case TournamentStatus.CANCELLED:
        return 'danger';
      default:
        return 'warning' as any;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrize = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-surface border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all duration-300"
    >
      {/* Banner Image */}
      <div
        className="h-48 relative overflow-hidden"
        style={{
          backgroundImage: `url(${tournament.bannerImageUrl || 'https://via.placeholder.com/800x400/121212/00ff00?text=Tournament'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent" />

        {/* Type Badge - Moved to bottom right or removed if actions are top left */}
        <div className="absolute bottom-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isOfficial
            ? 'bg-primary/20 text-primary border-primary/40'
            : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40'
            }`}>
            {isOfficial ? 'OFFICIAL' : 'RANKED'}
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge variant={getStatusBadgeVariant(tournament.status)}>
            {tournament.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Game Icon/Logo */}
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-black rounded-lg border-2 border-primary/20 flex items-center justify-center overflow-hidden">
          {tournament.gameId.coverImageUrl ? (
            <img src={tournament.gameId.coverImageUrl} alt={tournament.gameId.title} className="w-full h-full object-cover" />
          ) : (
            <Trophy className="w-8 h-8 text-primary" />
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Only show actions if not cancelled or completed (optional logic, but user wants buttons) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.(tournament._id);
            }}
            className="p-2 bg-surface/90 backdrop-blur-sm border border-white/10 rounded-lg text-yellow-500 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all duration-200"
            title="Cancel Tournament"
          >
            <Ban className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(tournament._id);
            }}
            className="p-2 bg-surface/90 backdrop-blur-sm border border-white/10 rounded-lg text-red-500 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200"
            title="Delete Tournament"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
          {tournament.name}
        </h3>

        <p className="text-sm text-text-muted mb-4 line-clamp-2">
          {tournament.gameId.title} • {tournament.description || 'No description available'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Teams */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Users className="w-4 h-4" />
            <span className="text-white font-bold">{tournament.currentTeams}</span>
            <span>/ {tournament.maxTeams}</span>
          </div>

          {/* Prize Pool */}
          {tournament.prizePool > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <DollarSign className="w-4 h-4" />
              <span className="text-primary font-bold">{formatPrize(tournament.prizePool)}</span>
            </div>
          )}

          {/* Start Date */}
          <div className="flex items-center gap-2 text-sm text-text-muted col-span-2">
            <Calendar className="w-4 h-4 text-white" />
            <span>{formatDate(tournament.startDate)}</span>
          </div>
        </div>

        {/* Progress Bar (for registration) */}
        {tournament.registrationOpen && (
          <div className="mt-4">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(tournament.currentTeams / tournament.maxTeams) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Registration: {tournament.currentTeams} / {tournament.maxTeams} teams
            </p>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      </div>
    </div>
  );
};

export default TournamentCard;

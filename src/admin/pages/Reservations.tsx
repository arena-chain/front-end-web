import React, { useState, useEffect } from 'react';
import { Search, Calendar, DollarSign, Eye } from 'lucide-react';
import { Input, Select } from '../../components/ui/core';
import type { Reservation } from '../../models/ticket';
import { ReservationStatus } from '../../models/ticket';
import reservationService from '../../services/reservationService';

export default function Reservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const data = await reservationService.getAllReservations();
            setReservations(data);
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReservations = reservations.filter((reservation) => {
        const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
        // Add more filters as needed (search by user email, tournament name, etc.)
        return matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case ReservationStatus.CONFIRMED: return 'text-green-400 bg-green-400/10 border-green-400/20';
            case ReservationStatus.PENDING: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case ReservationStatus.CANCELLED: return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-text-muted bg-white/5 border-white/10';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                        Reservations
                    </h1>
                    <p className="text-text-muted">
                        Manage all ticket reservations and bookings
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input
                        placeholder="Search by reservation ID or user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-48"
                >
                    <option value="all">All Status</option>
                    <option value={ReservationStatus.PENDING}>Pending</option>
                    <option value={ReservationStatus.CONFIRMED}>Confirmed</option>
                    <option value={ReservationStatus.CANCELLED}>Cancelled</option>
                </Select>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Reservations"
                    value={reservations.length}
                    icon={<Calendar className="w-5 h-5" />}
                    color="primary"
                />
                <StatCard
                    title="Confirmed"
                    value={reservations.filter(r => r.status === ReservationStatus.CONFIRMED).length}
                    icon={<Calendar className="w-5 h-5" />}
                    color="green"
                />
                <StatCard
                    title="Total Revenue"
                    value={formatPrice(
                        reservations
                            .filter(r => r.status === ReservationStatus.CONFIRMED)
                            .reduce((sum, r) => sum + r.totalPrice, 0)
                    )}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="green"
                />
            </div>

            {/* Reservations Table */}
            {loading ? (
                <div className="bg-surface border border-white/5 rounded-xl p-8">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-white/5 rounded" />
                        ))}
                    </div>
                </div>
            ) : filteredReservations.length > 0 ? (
                <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Tournament
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    User
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Tickets
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredReservations.map((reservation) => (
                                <tr key={reservation._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono text-text-muted">
                                            {reservation._id.slice(-8)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-white">
                                            {typeof reservation.tournament === 'string'
                                                ? reservation.tournament
                                                : reservation.tournament?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-text-muted">
                                            {typeof reservation.user === 'string' ? reservation.user : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-white font-medium">
                                            {Array.isArray(reservation.tickets) ? reservation.tickets.length : 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-primary">
                                            {formatPrice(reservation.totalPrice)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(reservation.status)}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-text-muted">
                                            {formatDate(reservation.reservedAt)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                            <Eye className="w-4 h-4 text-primary" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 bg-surface border border-white/5 rounded-xl">
                    <Calendar className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white mb-2">No Reservations Found</h3>
                    <p className="text-text-muted">
                        {statusFilter !== 'all' ? 'Try adjusting your filters' : 'No reservations have been made yet'}
                    </p>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'primary' | 'green' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };

    return (
        <div className="bg-surface border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-muted">{title}</span>
                <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );
}

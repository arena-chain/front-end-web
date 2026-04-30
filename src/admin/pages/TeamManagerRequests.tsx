import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, Check, X } from 'lucide-react';
import {
    adminTeamManagerService,
    type PendingTeamManagerRow,
} from '../../services/adminTeamManager.service';

function extractUserId(userId: unknown): string {
    if (userId != null && typeof userId === 'object' && '_id' in (userId as object)) {
        return String((userId as { _id: unknown })._id);
    }
    return userId != null ? String(userId) : '';
}

function displayName(row: PendingTeamManagerRow): string {
    const org = row.organizationName?.trim();
    if (org) return org;
    const parts = [row.firstName, row.lastName].filter(Boolean).join(' ');
    return parts || extractUserId(row.userId) || 'Unknown';
}

export default function TeamManagerRequests() {
    const [rows, setRows] = useState<PendingTeamManagerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminTeamManagerService.getPending();
            setRows(data.filter((r) => (r.status || '').toLowerCase() === 'pending'));
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (e instanceof Error ? e.message : 'Failed to load');
            setError(msg);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const act = async (row: PendingTeamManagerRow, mode: 'approve' | 'reject') => {
        const id = extractUserId(row.userId);
        setBusyId(id + mode);
        try {
            if (mode === 'approve') await adminTeamManagerService.approve(row);
            else await adminTeamManagerService.reject(row);
            setRows((prev) => prev.filter((r) => extractUserId(r.userId) !== id));
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (e instanceof Error ? e.message : 'Action failed');
            setError(msg);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-primary w-7 h-7" />
                        Team manager verification
                    </h1>
                    <p className="text-text-muted text-sm mt-1">
                        Approve or reject manager applications (`GET /api/team-manager/pending`). Approving updates the
                        user role and links the team per backend rules.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
                {loading ? (
                    <p className="p-8 text-text-muted text-sm">Loading pending requests…</p>
                ) : rows.length === 0 ? (
                    <p className="p-8 text-text-muted text-sm">No pending manager requests.</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-text-muted">
                                <th className="px-4 py-3 font-medium">Organization / applicant</th>
                                <th className="px-4 py-3 font-medium">User ID</th>
                                <th className="px-4 py-3 font-medium w-[200px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const uid = extractUserId(row.userId);
                                return (
                                    <tr key={row._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 text-white">{displayName(row)}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-text-muted">{uid}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() => void act(row, 'approve')}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 disabled:opacity-50"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    {busyId === uid + 'approve' ? '…' : 'Approve'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() => void act(row, 'reject')}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-300 text-xs font-semibold hover:bg-red-500/25 disabled:opacity-50"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    {busyId === uid + 'reject' ? '…' : 'Reject'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

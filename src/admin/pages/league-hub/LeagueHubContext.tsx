import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { leagueRulesService, type LeagueRule } from '../../../services/leagueRulesService';

interface LeagueHubCtx {
    // Leagues
    leagues: League[];
    leaguesLoading: boolean;
    selectedLeague: League | null;
    setSelectedLeague: (l: League | null) => void;
    refetchLeagues: () => void;

    // Seasons
    seasons: Season[];
    seasonsLoading: boolean;
    selectedSeason: Season | null;
    setSelectedSeason: (s: Season | null) => void;
    refetchSeasons: () => void;

    // Rules (global, needed for season creation)
    rules: LeagueRule[];
    rulesLoading: boolean;
    refetchRules: () => void;

    // Toast
    toast: { msg: string; type: 'ok' | 'err' } | null;
    notify: (msg: string, type?: 'ok' | 'err') => void;
}

const LeagueHubContext = createContext<LeagueHubCtx | null>(null);

export function useLeagueHub() {
    const ctx = useContext(LeagueHubContext);
    if (!ctx) throw new Error('useLeagueHub must be used inside LeagueHubProvider');
    return ctx;
}

export function LeagueHubProvider({ children }: { children: ReactNode }) {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [leaguesLoading, setLeaguesLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

    const [seasons, setSeasons] = useState<Season[]>([]);
    const [seasonsLoading, setSeasonsLoading] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

    const [rules, setRules] = useState<LeagueRule[]>([]);
    const [rulesLoading, setRulesLoading] = useState(false);

    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

    const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    };

    const refetchLeagues = useCallback(async () => {
        setLeaguesLoading(true);
        try {
            const data = await leagueService.getAllLeagues();
            setLeagues(data);
        } catch { notify('Failed to load leagues', 'err'); }
        finally { setLeaguesLoading(false); }
    }, []);

    const refetchSeasons = useCallback(async () => {
        if (!selectedLeague) { setSeasons([]); return; }
        setSeasonsLoading(true);
        try {
            const data = await seasonService.getByLeague(selectedLeague._id);
            setSeasons(data);
        } catch { notify('Failed to load seasons', 'err'); }
        finally { setSeasonsLoading(false); }
    }, [selectedLeague]);

    const refetchRules = useCallback(async () => {
        setRulesLoading(true);
        try { setRules(await leagueRulesService.getAll()); }
        catch { notify('Failed to load rules', 'err'); }
        finally { setRulesLoading(false); }
    }, []);

    // Initial load
    useEffect(() => { refetchLeagues(); refetchRules(); }, []);

    // When league changes, re-load seasons and reset season selection
    useEffect(() => {
        setSelectedSeason(null);
        setSeasons([]);
        if (selectedLeague) refetchSeasons();
    }, [selectedLeague?._id]);

    return (
        <LeagueHubContext.Provider value={{
            leagues, leaguesLoading, selectedLeague, setSelectedLeague, refetchLeagues,
            seasons, seasonsLoading, selectedSeason, setSelectedSeason, refetchSeasons,
            rules, rulesLoading, refetchRules,
            toast, notify,
        }}>
            {children}
        </LeagueHubContext.Provider>
    );
}

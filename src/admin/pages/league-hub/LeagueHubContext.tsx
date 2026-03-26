import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { leagueService, type League } from '../../../services/leagueService';
import { seasonService, type Season } from '../../../services/seasonService';
import { leagueRulesService, type SeasonRule } from '../../../services/leagueRulesService';
import { stageService, type Stage } from '../../../services/stageService';

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

    // Rules — scoped to the selected season
    seasonRules: SeasonRule[];
    seasonRulesLoading: boolean;
    refetchSeasonRules: () => void;
    /** @deprecated use seasonRules */
    rules: SeasonRule[];
    /** @deprecated use seasonRulesLoading */
    rulesLoading: boolean;
    /** @deprecated use refetchSeasonRules */
    refetchRules: () => void;

    // Stages — scoped to the selected season
    stages: Stage[];
    stagesLoading: boolean;
    refetchStages: () => void;

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

    const [seasonRules, setSeasonRules] = useState<SeasonRule[]>([]);
    const [seasonRulesLoading, setSeasonRulesLoading] = useState(false);

    const [stages, setStages] = useState<Stage[]>([]);
    const [stagesLoading, setStagesLoading] = useState(false);

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

    const refetchSeasonRules = useCallback(async () => {
        if (!selectedSeason) { setSeasonRules([]); return; }
        setSeasonRulesLoading(true);
        try { setSeasonRules(await leagueRulesService.getBySeasonId(selectedSeason._id)); }
        catch { notify('Failed to load season rules', 'err'); }
        finally { setSeasonRulesLoading(false); }
    }, [selectedSeason]);

    const refetchStages = useCallback(async () => {
        if (!selectedSeason) { setStages([]); return; }
        setStagesLoading(true);
        try { setStages(await stageService.getBySeason(selectedSeason._id)); }
        catch { notify('Failed to load stages', 'err'); }
        finally { setStagesLoading(false); }
    }, [selectedSeason]);

    // Initial load
    useEffect(() => { refetchLeagues(); }, []);

    // When league changes, re-load seasons and reset season selection
    useEffect(() => {
        setSelectedSeason(null);
        setSeasons([]);
        setSeasonRules([]);
        if (selectedLeague) refetchSeasons();
    }, [selectedLeague?._id]);

    // When season changes, load its rules and stages
    useEffect(() => {
        setSeasonRules([]);
        setStages([]);
        if (selectedSeason) {
            refetchSeasonRules();
            refetchStages();
        }
    }, [selectedSeason?._id]);

    return (
        <LeagueHubContext.Provider value={{
            leagues, leaguesLoading, selectedLeague, setSelectedLeague, refetchLeagues,
            seasons, seasonsLoading, selectedSeason, setSelectedSeason, refetchSeasons,
            seasonRules, seasonRulesLoading, refetchSeasonRules,
            // backward-compat aliases
            rules: seasonRules,
            rulesLoading: seasonRulesLoading,
            refetchRules: refetchSeasonRules,
            // Stages
            stages, stagesLoading, refetchStages,
            toast, notify,
        }}>
            {children}
        </LeagueHubContext.Provider>
    );
}

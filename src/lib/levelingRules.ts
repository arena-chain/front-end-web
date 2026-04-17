/**
 * Leveling & XP Rules for Arena-Chain
 * Formula: XP = 1000 * (Level ^ 1.5)
 */

export const LEVEL_FORMULA_BASE = 1000;
export const LEVEL_FORMULA_GROWTH = 1.5;

export const computeXpToNextLevel = (level: number): number => {
    return Math.floor(LEVEL_FORMULA_BASE * Math.pow(level, LEVEL_FORMULA_GROWTH));
};

export const TIERS = [
    { min: 1, max: 10, label: 'Bronze', color: '#cd7f32', bg: 'linear-gradient(135deg, #cd7f32, #8b4513)', glow: 'rgba(205, 127, 50, 0.3)' },
    { min: 11, max: 20, label: 'Silver', color: '#c0c0c0', bg: 'linear-gradient(135deg, #c0c0c0, #808080)', glow: 'rgba(192, 192, 192, 0.3)' },
    { min: 21, max: 30, label: 'Gold', color: '#ffd700', bg: 'linear-gradient(135deg, #ffd700, #ff8c00)', glow: 'rgba(255, 215, 0, 0.4)' },
    { min: 31, max: 40, label: 'Platinum', color: '#3eb489', bg: 'linear-gradient(135deg, #3eb489, #2e8b57)', glow: 'rgba(62, 180, 137, 0.3)' },
    { min: 41, max: 49, label: 'Diamond', color: '#b9f2ff', bg: 'linear-gradient(135deg, #b9f2ff, #00ced1)', glow: 'rgba(185, 242, 255, 0.4)' },
    { min: 50, max: 50, label: 'Master', color: '#ff0055', bg: 'linear-gradient(135deg, #ff0055, #ff00ff)', glow: 'rgba(255, 0, 85, 0.6)', animated: true },
];

export const getTierForLevel = (level: number) => {
    return TIERS.find(t => level >= t.min && level <= t.max) || TIERS[0];
};

export const XP_REWARDS = {
    PARTICIPATION: 50,
    MATCH_WIN: 100,
    TOURNAMENT_WIN: 500,
    PLACE_2: 300,
    PLACE_3: 200,
    WIN_STREAK: 50, // per stack
    ANTI_CHEAT_CLEAN: 25,
    REPORT_VALIDATED: 30,
    INVITE_FRIEND: 100,
};

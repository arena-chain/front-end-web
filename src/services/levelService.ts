const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LevelProgression {
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    totalXP: number;
    progressPct: number;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const LevelService = {
    async getMyLevel(): Promise<LevelProgression> {
        const response = await fetch(`${API_URL}/me/level`, {
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch level progression');
        return response.json();
    }
};

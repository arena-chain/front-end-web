const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
    _id: string;
    nickname: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    avatar?: string;
    region?: string;
}

export const userService = {
    async getAllUsers(): Promise<User[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch users');
        }

        return response.json();
    },

    async blockUser(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}/block`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to block user');
        }
    },

    async unblockUser(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}/unblock`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to unblock user');
        }
    },

    async deleteUser(id: string): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete user');
        }
    }
};

import { getApiBase } from '../lib/apiBase';

const API_URL = getApiBase();

type ConfirmPaymentPayload = {
    paymentIntentId: string;
    amount: number;
    currency?: string;
    context?: 'ticket' | 'subscription';
    ticketData?: {
        tournamentId?: string;
        ticketName?: string;
    };
};

const paymentService = {
    async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<{ clientSecret: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/payment/create-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ amount, currency }),
        });

        if (!response.ok) {
            let errorMessage = 'Failed to create payment intent';
            try {
                const error = await response.json();
                errorMessage = error?.message || errorMessage;
            } catch {
                // Keep default message when response isn't JSON.
            }

            // Stripe secret keys must only live on the backend.
            if (errorMessage.includes('Invalid API Key provided: sk_')) {
                throw new Error(
                    'Stripe server key is invalid. Update STRIPE_SECRET_KEY on the backend and restart the API server.'
                );
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        const clientSecret = data?.clientSecret || data?.client_secret;

        if (!clientSecret || typeof clientSecret !== 'string') {
            throw new Error('Payment intent created but client secret is missing in API response.');
        }

        return { clientSecret };
    },

    async confirmPayment(payload: ConfirmPaymentPayload): Promise<any> {
        const token = localStorage.getItem('token');
        const endpoints = [
            `${API_URL}/payment/confirm`,
            `${API_URL}/payments/confirm`,
            `${API_URL}/payment/record`,
            `${API_URL}/payments`,
        ];

        let lastErrorMessage = 'Failed to record payment on server';
        let sawNon404Error = false;

        for (const endpoint of endpoints) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    paymentIntentId: payload.paymentIntentId,
                    amount: payload.amount,
                    currency: payload.currency || 'usd',
                    status: 'succeeded',
                    context: payload.context,
                    ticketData: payload.ticketData,
                }),
            });

            if (response.ok) {
                try {
                    return await response.json();
                } catch {
                    return { ok: true };
                }
            }

            if (response.status === 404) {
                continue;
            }

            sawNon404Error = true;

            try {
                const error = await response.json();
                lastErrorMessage = error?.message || lastErrorMessage;
            } catch {
                lastErrorMessage = `Failed to record payment (HTTP ${response.status})`;
            }
        }

        // Some backends don't expose a dedicated "record payment" endpoint.
        // In that case, payment persistence is handled in ticket/subscription endpoints.
        if (!sawNon404Error) {
            return { ok: false, skipped: true, reason: 'no_payment_record_endpoint' };
        }

        throw new Error(lastErrorMessage);
    }
};

export default paymentService;

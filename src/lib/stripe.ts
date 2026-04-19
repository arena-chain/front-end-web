const FALLBACK_PUBLISHABLE_KEY =
    'pk_test_51SToB0QkN55ayShyAGms4vrDrYbnnV3va3lM4d7wK2cb69auigr5FinMoCDruQHqDwyDvWZfywjfHabxreHnUXis00f2q0xUzS';

export function getStripePublishableKey(): string {
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (typeof envKey === 'string' && envKey.trim().startsWith('pk_')) {
        return envKey.trim();
    }

    return FALLBACK_PUBLISHABLE_KEY;
}

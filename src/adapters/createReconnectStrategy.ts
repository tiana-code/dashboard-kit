export interface ReconnectStrategyOptions {
    baseIntervalMs?: number;
    maxIntervalMs?: number;
    maxAttempts?: number;
    jitterFactor?: number;
}

export function createReconnectStrategy(options: ReconnectStrategyOptions = {}) {
    const {
        baseIntervalMs = 1000,
        maxIntervalMs = 30000,
        maxAttempts = 10,
        jitterFactor = 0.2,
    } = options;

    return {
        maxAttempts,
        getDelay(attempt: number): number {
            const exponential = baseIntervalMs * Math.pow(2, attempt);
            const capped = Math.min(exponential, maxIntervalMs);
            const jitter = capped * jitterFactor * Math.random();
            return capped + jitter;
        },
    };
}

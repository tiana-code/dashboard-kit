import {useCallback, useEffect, useRef, useState} from 'react';
import type {SSEOptions, SSEState} from '../types';

const DEFAULT_RECONNECT_INTERVAL = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = Infinity;
const BACKOFF_MULTIPLIER = 2;
const MAX_BACKOFF_MS = 30000;

function backoffDelay(attempt: number, baseMs: number): number {
    const delay = baseMs * Math.pow(BACKOFF_MULTIPLIER, attempt);
    const jitter = delay * 0.2 * Math.random();
    return Math.min(delay + jitter, MAX_BACKOFF_MS);
}

export function useRealTimeData<T>(options: SSEOptions): SSEState<T> {
    const {
        url,
        withCredentials = false,
        reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
        maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
        onOpen,
        onError,
    } = options;

    const [state, setState] = useState<SSEState<T>>({
        data: null,
        isConnected: false,
        error: null,
        reconnectCount: 0,
    });

    const esRef = useRef<EventSource | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectCountRef = useRef(0);
    const mountedRef = useRef(true);

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        clearReconnectTimer();
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }
    }, [clearReconnectTimer]);

    const connect = useCallback(() => {
        if (!mountedRef.current) return;

        disconnect();

        const es = new EventSource(url, {withCredentials});
        esRef.current = es;

        es.onopen = () => {
            if (!mountedRef.current) return;
            reconnectCountRef.current = 0;
            setState((prev) => ({
                ...prev,
                isConnected: true,
                error: null,
                reconnectCount: 0,
            }));
            onOpen?.();
        };

        es.onmessage = (event: MessageEvent) => {
            if (!mountedRef.current) return;
            try {
                const parsed = JSON.parse(event.data as string) as T;
                setState((prev) => ({...prev, data: parsed}));
            } catch {
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to parse SSE message',
                }));
            }
        };

        es.onerror = (event: Event) => {
            if (!mountedRef.current) return;
            onError?.(event);
            es.close();
            esRef.current = null;

            setState((prev) => ({
                ...prev,
                isConnected: false,
                error: 'Connection lost',
            }));

            const attempts = reconnectCountRef.current + 1;
            reconnectCountRef.current = attempts;

            if (attempts <= maxReconnectAttempts) {
                const delay = backoffDelay(attempts - 1, reconnectInterval);
                setState((prev) => ({...prev, reconnectCount: attempts}));
                reconnectTimerRef.current = setTimeout(() => {
                    if (mountedRef.current) connect();
                }, delay);
            }
        };
    }, [url, withCredentials, reconnectInterval, maxReconnectAttempts, onOpen, onError, disconnect]);

    useEffect(() => {
        mountedRef.current = true;
        connect();
        return () => {
            mountedRef.current = false;
            disconnect();
        };
    }, [connect, disconnect]);

    return state;
}

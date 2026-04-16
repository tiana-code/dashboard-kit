import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {SSEOptions, SSEState} from '../types';
import {createEventSourceConnection} from '../adapters/createEventSourceConnection.js';
import {createReconnectStrategy} from '../adapters/createReconnectStrategy.js';

const DEFAULT_RECONNECT_INTERVAL = 1000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

export function useRealTimeData<T>(options: SSEOptions<T>): SSEState<T> {
    const {
        url,
        withCredentials = false,
        reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
        maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
        onOpen,
        onError,
        parseMessage,
    } = options;

    const [state, setState] = useState<SSEState<T>>({
        data: null,
        isConnected: false,
        error: null,
        reconnectCount: 0,
    });

    const connectionRef = useRef<{ close: () => void } | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectCountRef = useRef(0);
    const mountedRef = useRef(true);

    const strategy = useMemo(
        () => createReconnectStrategy({
            baseIntervalMs: reconnectInterval,
            maxAttempts: maxReconnectAttempts,
        }),
        [reconnectInterval, maxReconnectAttempts],
    );

    const clearReconnectTimer = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        clearReconnectTimer();
        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }
    }, [clearReconnectTimer]);

    const connect = useCallback(() => {
        if (!mountedRef.current) return;

        disconnect();

        connectionRef.current = createEventSourceConnection({
            url,
            withCredentials,
            onOpen: () => {
                if (!mountedRef.current) return;
                reconnectCountRef.current = 0;
                setState((prev) => ({
                    ...prev,
                    isConnected: true,
                    error: null,
                    reconnectCount: 0,
                }));
                onOpen?.();
            },
            onMessage: (raw: string) => {
                if (!mountedRef.current) return;
                try {
                    const parsed = parseMessage
                        ? parseMessage(raw)
                        : (JSON.parse(raw) as T);
                    setState((prev) => ({...prev, data: parsed}));
                } catch (err) {
                    const message =
                        err instanceof Error ? err.message : 'Failed to parse SSE message';
                    setState((prev) => ({
                        ...prev,
                        error: {type: 'parse', message, rawData: raw},
                    }));
                }
            },
            onError: (event: Event) => {
                if (!mountedRef.current) return;
                onError?.(event);

                if (connectionRef.current) {
                    connectionRef.current.close();
                    connectionRef.current = null;
                }

                setState((prev) => ({
                    ...prev,
                    isConnected: false,
                    error: {type: 'transport', message: 'Connection lost'},
                }));

                const attempts = reconnectCountRef.current + 1;
                reconnectCountRef.current = attempts;

                if (attempts <= strategy.maxAttempts) {
                    const delay = strategy.getDelay(attempts - 1);
                    setState((prev) => ({...prev, reconnectCount: attempts}));
                    reconnectTimerRef.current = setTimeout(() => {
                        if (mountedRef.current) connect();
                    }, delay);
                }
            },
        });
    }, [url, withCredentials, onOpen, onError, parseMessage, disconnect, strategy]);

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

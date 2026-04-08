import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act, waitFor} from '@testing-library/react';
import {useRealTimeData} from '../src';

class MockEventSource {
    static instances: MockEventSource[] = [];
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    close = vi.fn();
    url: string;

    constructor(url: string, _options?: { withCredentials?: boolean }) {
        this.url = url;
        MockEventSource.instances.push(this);
    }

    simulateOpen() {
        this.onopen?.(new Event('open'));
    }

    simulateMessage(data: string) {
        const event = new MessageEvent('message', {data});
        this.onmessage?.(event);
    }

    simulateError() {
        this.onerror?.(new Event('error'));
    }
}

beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('useRealTimeData', () => {
    it('returns initial state with data null and not connected', () => {
        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream'})
        );
        expect(result.current.data).toBeNull();
        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.reconnectCount).toBe(0);
    });

    it('sets isConnected to true when connection opens', async () => {
        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream'})
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
        });

        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('parses JSON message and updates data', async () => {
        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream'})
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
            instance?.simulateMessage(JSON.stringify({value: 42}));
        });

        expect(result.current.data).toEqual({value: 42});
    });

    it('uses custom parseMessage when provided', async () => {
        const parseMessage = (raw: string) => ({parsed: true, raw});

        const {result} = renderHook(() =>
            useRealTimeData({url: '/api/stream', parseMessage})
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
            instance?.simulateMessage('hello');
        });

        expect(result.current.data).toEqual({parsed: true, raw: 'hello'});
    });

    it('sets parse error when JSON is invalid', async () => {
        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream'})
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
            instance?.simulateMessage('not-valid-json{{{');
        });

        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.type).toBe('parse');
    });

    it('sets transport error and disconnects on SSE error', async () => {
        vi.useFakeTimers();

        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({
                url: '/api/stream',
                maxReconnectAttempts: 1,
            })
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
        });

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateError();
        });

        expect(result.current.isConnected).toBe(false);
        expect(result.current.error?.type).toBe('transport');
    });

    it('calls onOpen callback when connection opens', async () => {
        const onOpen = vi.fn();

        renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream', onOpen})
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateOpen();
        });

        expect(onOpen).toHaveBeenCalledOnce();
    });

    it('calls onError callback when connection errors', async () => {
        vi.useFakeTimers();
        const onError = vi.fn();

        renderHook(() =>
            useRealTimeData<{ value: number }>({
                url: '/api/stream',
                onError,
                maxReconnectAttempts: 0,
            })
        );

        await act(async () => {
            const instance = MockEventSource.instances[0];
            instance?.simulateError();
        });

        expect(onError).toHaveBeenCalledOnce();
    });

    it('closes EventSource on unmount', async () => {
        const {unmount} = renderHook(() =>
            useRealTimeData<{ value: number }>({url: '/api/stream'})
        );

        const instance = MockEventSource.instances[0];
        expect(instance).toBeDefined();

        unmount();

        await waitFor(() => {
            expect(instance?.close).toHaveBeenCalled();
        });
    });

    it('resets reconnectCount to 0 on successful open after error', async () => {
        vi.useFakeTimers();

        const {result} = renderHook(() =>
            useRealTimeData<{ value: number }>({
                url: '/api/stream',
                reconnectInterval: 100,
                maxReconnectAttempts: 5,
            })
        );

        await act(async () => {
            MockEventSource.instances[0]?.simulateError();
        });

        expect(result.current.reconnectCount).toBe(1);

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        const latestInstance = MockEventSource.instances[MockEventSource.instances.length - 1];
        await act(async () => {
            latestInstance?.simulateOpen();
        });

        expect(result.current.reconnectCount).toBe(0);
        expect(result.current.isConnected).toBe(true);
    });
});

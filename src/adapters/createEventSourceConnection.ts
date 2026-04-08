export interface EventSourceConnectionOptions {
    url: string;
    withCredentials?: boolean;
    onMessage: (data: string) => void;
    onOpen?: () => void;
    onError?: (event: Event) => void;
}

export function createEventSourceConnection(options: EventSourceConnectionOptions): { close: () => void } {
    const init: EventSourceInit = options.withCredentials !== undefined
        ? {withCredentials: options.withCredentials}
        : {};
    const eventSource = new EventSource(options.url, init);
    eventSource.onmessage = (event) => options.onMessage(event.data as string);
    if (options.onOpen) eventSource.onopen = () => options.onOpen?.();
    if (options.onError) eventSource.onerror = (e) => options.onError?.(e);
    return {close: () => eventSource.close()};
}

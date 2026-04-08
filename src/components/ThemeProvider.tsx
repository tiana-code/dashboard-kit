import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type {ThemeMode, ThemeTokens} from '../types';

const LIGHT_TOKENS: ThemeTokens = {
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceVariant: '#f1f3f5',
    border: '#dee2e6',
    text: '#212529',
    textSecondary: '#495057',
    textMuted: '#868e96',
    accent: '#228be6',
    success: '#2f9e44',
    warning: '#e67700',
    danger: '#c92a2a',
    chartPalette: [
        '#228be6',
        '#2f9e44',
        '#e67700',
        '#c92a2a',
        '#7048e8',
        '#0c8599',
        '#e64980',
        '#f59f00',
    ],
};

const DARK_TOKENS: ThemeTokens = {
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#21262d',
    border: '#30363d',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    textMuted: '#484f58',
    accent: '#58a6ff',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    chartPalette: [
        '#58a6ff',
        '#3fb950',
        '#d29922',
        '#f85149',
        '#bc8cff',
        '#39d0d8',
        '#f778ba',
        '#e3b341',
    ],
};

interface ThemeContextValue {
    mode: ThemeMode;
    resolvedMode: 'light' | 'dark';
    tokens: ThemeTokens;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultMode?: ThemeMode;
    storageKey?: string;
}

function getSystemPreference(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function resolveMode(mode: ThemeMode, system: 'light' | 'dark'): 'light' | 'dark' {
    if (mode === 'system') return system;
    return mode;
}

export function ThemeProvider({
                                  children,
                                  defaultMode = 'dark',
                                  storageKey = 'itiana-dashboard-theme',
                              }: ThemeProviderProps) {
    const [mode, setModeState] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return defaultMode;
        try {
            const stored = localStorage.getItem(storageKey) as ThemeMode | null;
            return stored ?? defaultMode;
        } catch {
            return defaultMode;
        }
    });

    const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(
        getSystemPreference
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (event: MediaQueryListEvent) => {
            setSystemPreference(event.matches ? 'dark' : 'light');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const resolvedMode = useMemo(
        () => resolveMode(mode, systemPreference),
        [mode, systemPreference]
    );

    const tokens = useMemo(
        () => (resolvedMode === 'dark' ? DARK_TOKENS : LIGHT_TOKENS),
        [resolvedMode]
    );

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', resolvedMode);
        root.style.setProperty('--dk-background', tokens.background);
        root.style.setProperty('--dk-surface', tokens.surface);
        root.style.setProperty('--dk-surface-variant', tokens.surfaceVariant);
        root.style.setProperty('--dk-border', tokens.border);
        root.style.setProperty('--dk-text', tokens.text);
        root.style.setProperty('--dk-text-secondary', tokens.textSecondary);
        root.style.setProperty('--dk-text-muted', tokens.textMuted);
        root.style.setProperty('--dk-accent', tokens.accent);
        root.style.setProperty('--dk-success', tokens.success);
        root.style.setProperty('--dk-warning', tokens.warning);
        root.style.setProperty('--dk-danger', tokens.danger);
    }, [resolvedMode, tokens]);

    const setMode = useCallback(
        (next: ThemeMode) => {
            setModeState(next);
            try {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(storageKey, next);
                }
            } catch { /* localStorage unavailable in some contexts */
            }
        },
        [storageKey]
    );

    const toggleMode = useCallback(() => {
        setMode(resolvedMode === 'dark' ? 'light' : 'dark');
    }, [resolvedMode, setMode]);

    const value = useMemo<ThemeContextValue>(
        () => ({mode, resolvedMode, tokens, setMode, toggleMode}),
        [mode, resolvedMode, tokens, setMode, toggleMode]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside <ThemeProvider>');
    }
    return ctx;
}

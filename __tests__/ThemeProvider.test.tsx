import {describe, expect, it, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ThemeProvider, useTheme} from '../src';

function ThemeConsumer() {
    const {mode, resolvedMode, toggleMode, setMode} = useTheme();
    return (
        <div>
            <span data-testid="mode">{mode}</span>
            <span data-testid="resolved">{resolvedMode}</span>
            <button onClick={toggleMode}>toggle</button>
            <button onClick={() => setMode('light')}>light</button>
            <button onClick={() => setMode('dark')}>dark</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('provides dark mode by default', () => {
        render(
            <ThemeProvider defaultMode="dark">
                <ThemeConsumer/>
            </ThemeProvider>
        );
        expect(screen.getByTestId('mode').textContent).toBe('dark');
        expect(screen.getByTestId('resolved').textContent).toBe('dark');
    });

    it('toggleMode switches between dark and light', () => {
        render(
            <ThemeProvider defaultMode="dark">
                <ThemeConsumer/>
            </ThemeProvider>
        );
        fireEvent.click(screen.getByText('toggle'));
        expect(screen.getByTestId('mode').textContent).toBe('light');
    });

    it('setMode changes to the given mode', () => {
        render(
            <ThemeProvider defaultMode="dark">
                <ThemeConsumer/>
            </ThemeProvider>
        );
        fireEvent.click(screen.getByText('light'));
        expect(screen.getByTestId('mode').textContent).toBe('light');
    });

    it('throws when useTheme is used outside provider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        expect(() => render(<ThemeConsumer/>)).toThrow(
            'useTheme must be used inside <ThemeProvider>'
        );
        spy.mockRestore();
    });
});

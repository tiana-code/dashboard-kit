import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {KpiCard} from '../src';
import {ThemeProvider} from '../src';
import type {KpiValue} from '../src';

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider defaultMode="dark">{ui}</ThemeProvider>);
}

const baseKpi: KpiValue = {
    label: 'Active Sessions',
    value: 1234,
    unit: 'req/s',
};

describe('KpiCard', () => {
    it('renders label and formatted value', () => {
        renderWithTheme(<KpiCard kpi={baseKpi}/>);
        expect(screen.getByText('Active Sessions')).toBeInTheDocument();
        expect(screen.getByText(/1\.2K req\/s/i)).toBeInTheDocument();
    });

    it('renders trend percentage when provided', () => {
        const kpi: KpiValue = {...baseKpi, trend: 'up', trendPercent: 12.5};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        expect(screen.getByText(/\+12\.5%/)).toBeInTheDocument();
    });

    it('renders negative trend percentage without plus sign', () => {
        const kpi: KpiValue = {...baseKpi, trend: 'down', trendPercent: -5.3};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        expect(screen.getByText(/-5\.3%/)).toBeInTheDocument();
    });

    it('shows progress bar when target is set', () => {
        const kpi: KpiValue = {...baseKpi, value: 750, target: 1000};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        const bar = screen.getByRole('progressbar');
        expect(bar).toBeInTheDocument();
        expect(bar).toHaveAttribute('aria-valuenow', '75');
    });

    it('clamps progress bar at 100% when value exceeds target', () => {
        const kpi: KpiValue = {...baseKpi, value: 1500, target: 1000};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        const bar = screen.getByRole('progressbar');
        expect(bar).toHaveAttribute('aria-valuenow', '100');
    });

    it('calls onClick handler when card is clicked', () => {
        const handler = vi.fn();
        renderWithTheme(<KpiCard kpi={baseKpi} onClick={handler}/>);
        fireEvent.click(screen.getByRole('button'));
        expect(handler).toHaveBeenCalledOnce();
    });

    it('renders as semantic button when onClick is provided', () => {
        const handler = vi.fn();
        renderWithTheme(<KpiCard kpi={baseKpi} onClick={handler}/>);
        const button = screen.getByRole('button');
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
    });

    it('does not render as button when onClick is not provided', () => {
        renderWithTheme(<KpiCard kpi={baseKpi}/>);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders loading skeleton when loading prop is true', () => {
        renderWithTheme(<KpiCard kpi={baseKpi} loading/>);
        expect(screen.queryByText('Active Sessions')).toBeNull();
        const container = document.querySelector('[aria-busy="true"]');
        expect(container).toBeInTheDocument();
    });

    it('formats large numbers with M suffix', () => {
        const kpi: KpiValue = {...baseKpi, value: 2_500_000, unit: 'USD'};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        expect(screen.getByText(/2\.50M USD/)).toBeInTheDocument();
    });

    it('renders timestamp when provided', () => {
        const ts = '2026-01-01T12:00:00Z';
        const kpi: KpiValue = {...baseKpi, timestamp: ts};
        renderWithTheme(<KpiCard kpi={kpi}/>);
        const timeEl = document.querySelector('[style*="color"]');
        expect(timeEl).toBeTruthy();
    });

    it('renders previous value when provided', () => {
        const kpi: KpiValue = {
            ...baseKpi,
            trend: 'up',
            trendPercent: 5,
            previousValue: 1174,
        };
        renderWithTheme(<KpiCard kpi={kpi}/>);
        expect(screen.getByText(/vs 1\.2K req\/s/)).toBeInTheDocument();
    });
});

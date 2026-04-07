import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {BentoGrid} from '../src';
import {ThemeProvider} from '../src';
import type {Widget, WidgetLayout} from '../src';

vi.mock('react-grid-layout', () => {
    const MockGridLayout = ({
                                children,
                            }: {
        children: React.ReactNode;
    }) => <div data-testid="grid-layout">{children}</div>;
    MockGridLayout.displayName = 'GridLayout';
    return {default: MockGridLayout};
});

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider defaultMode="dark">{ui}</ThemeProvider>);
}

const widgets: Widget[] = [
    {id: 'w1', type: 'kpi', title: 'Revenue', config: {}},
    {id: 'w2', type: 'chart', title: 'Traffic', config: {}},
];

const layouts: WidgetLayout[] = [
    {i: 'w1', x: 0, y: 0, w: 4, h: 2},
    {i: 'w2', x: 4, y: 0, w: 8, h: 4},
];

describe('BentoGrid', () => {
    it('renders widget titles via WidgetShell', () => {
        renderWithTheme(
            <BentoGrid
                widgets={widgets}
                layouts={layouts}
                renderWidget={(w) => <span>{w.type}</span>}
            />
        );
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Traffic')).toBeInTheDocument();
    });

    it('calls renderWidget for each widget', () => {
        const renderWidget = vi.fn((w: Widget) => <span key={w.id}>{w.id}</span>);
        renderWithTheme(
            <BentoGrid
                widgets={widgets}
                layouts={layouts}
                renderWidget={renderWidget}
            />
        );
        expect(renderWidget).toHaveBeenCalledTimes(2);
    });

    it('renders content returned by renderWidget', () => {
        renderWithTheme(
            <BentoGrid
                widgets={widgets}
                layouts={layouts}
                renderWidget={(w) => <div data-testid={`content-${w.id}`}>{w.title}</div>}
            />
        );
        expect(screen.getByTestId('content-w1')).toBeInTheDocument();
        expect(screen.getByTestId('content-w2')).toBeInTheDocument();
    });

    it('skips rendering when a layout entry has no matching widget', () => {
        const orphanLayouts: WidgetLayout[] = [
            ...layouts,
            {i: 'missing', x: 0, y: 4, w: 4, h: 2},
        ];
        renderWithTheme(
            <BentoGrid
                widgets={widgets}
                layouts={orphanLayouts}
                renderWidget={(w) => <span>{w.title}</span>}
            />
        );
        expect(screen.queryByText('missing')).toBeNull();
    });
});

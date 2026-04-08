import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {RealTimeChart} from '../src';
import {ThemeProvider} from '../src';
import type {ChartDataPoint, RealTimeChartConfig} from '../src';

vi.mock('recharts', () => {
    const MockResponsiveContainer = ({children}: { children: React.ReactNode }) => (
        <div data-testid="responsive-container">{children}</div>
    );
    const MockLineChart = ({children, data}: { children: React.ReactNode; data: unknown[] }) => (
        <div data-testid="line-chart" data-points={data.length}>{children}</div>
    );
    const MockAreaChart = ({children, data}: { children: React.ReactNode; data: unknown[] }) => (
        <div data-testid="area-chart" data-points={data.length}>{children}</div>
    );
    const MockBarChart = ({children, data}: { children: React.ReactNode; data: unknown[] }) => (
        <div data-testid="bar-chart" data-points={data.length}>{children}</div>
    );
    const MockLine = ({dataKey}: { dataKey: string }) => (
        <div data-testid={`line-${dataKey}`}/>
    );
    const MockArea = ({dataKey}: { dataKey: string }) => (
        <div data-testid={`area-${dataKey}`}/>
    );
    const MockBar = ({dataKey}: { dataKey: string }) => (
        <div data-testid={`bar-${dataKey}`}/>
    );
    const MockXAxis = () => <div data-testid="x-axis"/>;
    const MockYAxis = () => <div data-testid="y-axis"/>;
    const MockCartesianGrid = () => <div data-testid="cartesian-grid"/>;
    const MockTooltip = () => <div data-testid="tooltip"/>;
    const MockLegend = () => <div data-testid="legend"/>;

    return {
        ResponsiveContainer: MockResponsiveContainer,
        LineChart: MockLineChart,
        AreaChart: MockAreaChart,
        BarChart: MockBarChart,
        Line: MockLine,
        Area: MockArea,
        Bar: MockBar,
        XAxis: MockXAxis,
        YAxis: MockYAxis,
        CartesianGrid: MockCartesianGrid,
        Tooltip: MockTooltip,
        Legend: MockLegend,
    };
});

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider defaultMode="dark">{ui}</ThemeProvider>);
}

function makePoints(count: number): ChartDataPoint[] {
    return Array.from({length: count}, (_, i) => ({
        timestamp: Date.now() + i * 1000,
        value: i * 10,
    }));
}

const lineConfig: RealTimeChartConfig = {
    series: [{key: 'value', name: 'Value', type: 'line'}],
    mode: 'line',
};

const areaConfig: RealTimeChartConfig = {
    series: [{key: 'value', name: 'Value', type: 'area'}],
    mode: 'area',
};

const barConfig: RealTimeChartConfig = {
    series: [{key: 'value', name: 'Value', type: 'bar'}],
    mode: 'bar',
};

describe('RealTimeChart', () => {
    it('renders without crashing with empty data', () => {
        renderWithTheme(<RealTimeChart config={lineConfig} data={[]}/>);
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders a LineChart when mode is line', () => {
        renderWithTheme(<RealTimeChart config={lineConfig} data={makePoints(5)}/>);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.queryByTestId('area-chart')).toBeNull();
        expect(screen.queryByTestId('bar-chart')).toBeNull();
    });

    it('renders an AreaChart when mode is area', () => {
        renderWithTheme(<RealTimeChart config={areaConfig} data={makePoints(5)}/>);
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        expect(screen.queryByTestId('line-chart')).toBeNull();
    });

    it('renders a BarChart when mode is bar', () => {
        renderWithTheme(<RealTimeChart config={barConfig} data={makePoints(5)}/>);
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.queryByTestId('line-chart')).toBeNull();
    });

    it('applies maxPoints trimming — passes only last N points to chart', () => {
        const data = makePoints(100);
        const config: RealTimeChartConfig = {
            series: [{key: 'value', name: 'Value'}],
            mode: 'line',
            maxPoints: 20,
        };
        renderWithTheme(<RealTimeChart config={config} data={data}/>);
        const chart = screen.getByTestId('line-chart');
        expect(chart.getAttribute('data-points')).toBe('20');
    });

    it('passes all points when data count is below maxPoints', () => {
        const data = makePoints(10);
        const config: RealTimeChartConfig = {
            series: [{key: 'value', name: 'Value'}],
            mode: 'line',
            maxPoints: 60,
        };
        renderWithTheme(<RealTimeChart config={config} data={data}/>);
        const chart = screen.getByTestId('line-chart');
        expect(chart.getAttribute('data-points')).toBe('10');
    });

    it('renders legend when showLegend is true', () => {
        const config: RealTimeChartConfig = {
            series: [{key: 'value', name: 'Value'}],
            mode: 'line',
            showLegend: true,
        };
        renderWithTheme(<RealTimeChart config={config} data={makePoints(3)}/>);
        expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('does not render legend by default', () => {
        renderWithTheme(<RealTimeChart config={lineConfig} data={makePoints(3)}/>);
        expect(screen.queryByTestId('legend')).toBeNull();
    });

    it('renders grid by default', () => {
        renderWithTheme(<RealTimeChart config={lineConfig} data={makePoints(3)}/>);
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('does not render grid when showGrid is false', () => {
        const config: RealTimeChartConfig = {
            series: [{key: 'value', name: 'Value'}],
            mode: 'line',
            showGrid: false,
        };
        renderWithTheme(<RealTimeChart config={config} data={makePoints(3)}/>);
        expect(screen.queryByTestId('cartesian-grid')).toBeNull();
    });

    it('renders Line element for each series in line mode', () => {
        const config: RealTimeChartConfig = {
            series: [
                {key: 'cpu', name: 'CPU'},
                {key: 'mem', name: 'Memory'},
            ],
            mode: 'line',
        };
        renderWithTheme(<RealTimeChart config={config} data={makePoints(3)}/>);
        expect(screen.getByTestId('line-cpu')).toBeInTheDocument();
        expect(screen.getByTestId('line-mem')).toBeInTheDocument();
    });

    it('auto-detects line mode when series type is not specified', () => {
        const config: RealTimeChartConfig = {
            series: [{key: 'value', name: 'Value'}],
        };
        renderWithTheme(<RealTimeChart config={config} data={makePoints(3)}/>);
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
});

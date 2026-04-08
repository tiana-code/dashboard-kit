import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {useTheme} from './ThemeProvider.js';
import type {ChartDataPoint, ChartSeries, RealTimeChartConfig} from '../types';

interface RealTimeChartProps {
    config: RealTimeChartConfig;
    data: ChartDataPoint[];
    height?: number;
    onDataRequest?: () => ChartDataPoint | null;
    className?: string;
}

const DEFAULT_MAX_POINTS = 60;
const DEFAULT_CHART_HEIGHT = 300;
const DEFAULT_COLORS = [
    '#58a6ff',
    '#3fb950',
    '#d29922',
    '#f85149',
    '#bc8cff',
    '#39d0d8',
];

function formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function resolveColor(series: ChartSeries, index: number, palette: string[]): string {
    const paletteColor = palette[index % palette.length];
    const fallback = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
    return series.color ?? paletteColor ?? fallback ?? '#58a6ff';
}

function applyMaxPoints(data: ChartDataPoint[], maxPoints: number): ChartDataPoint[] {
    return data.length > maxPoints ? data.slice(-maxPoints) : data;
}

function autoDetectChartType(series: ChartSeries[]): 'line' | 'area' | 'bar' {
    const types = series.map((s) => s.type ?? 'line');
    if (types.every((t) => t === 'bar')) return 'bar';
    if (types.every((t) => t === 'area')) return 'area';
    return 'line';
}

export function RealTimeChart({
                                  config,
                                  data,
                                  height = DEFAULT_CHART_HEIGHT,
                                  onDataRequest,
                                  className,
                              }: RealTimeChartProps) {
    const {tokens} = useTheme();
    const maxPoints = config.maxPoints ?? DEFAULT_MAX_POINTS;
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [liveData, setLiveData] = useState<ChartDataPoint[]>(() =>
        applyMaxPoints(data, maxPoints)
    );

    useEffect(() => {
        setLiveData(applyMaxPoints(data, maxPoints));
    }, [data, maxPoints]);

    useEffect(() => {
        if (!onDataRequest || !config.refreshInterval) return;
        intervalRef.current = setInterval(() => {
            const point = onDataRequest();
            if (!point) return;
            setLiveData((prev) => {
                const next = [...prev, point];
                return applyMaxPoints(next, maxPoints);
            });
        }, config.refreshInterval);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [onDataRequest, config.refreshInterval, maxPoints]);

    const tooltipStyle = useMemo(
        () => ({
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: 8,
            color: tokens.text,
            fontSize: '0.8125rem',
        }),
        [tokens]
    );

    const gridStroke = tokens.border;
    const textColor = tokens.textMuted;

    const seriesColors = useMemo(
        () =>
            config.series.map((s, i) => resolveColor(s, i, tokens.chartPalette)),
        [config.series, tokens.chartPalette]
    );

    const chartType = useMemo(() => {
        if (config.mode) return config.mode;
        return autoDetectChartType(config.series);
    }, [config.mode, config.series]);

    const renderLines = useCallback(
        (series: ChartSeries[]) =>
            series.map((s, i) => (
                <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={seriesColors[i]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={config.animate ?? false}
                />
            )),
        [seriesColors, config.animate]
    );

    const renderAreas = useCallback(
        (series: ChartSeries[]) =>
            series.map((s, i) => (
                <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={seriesColors[i]}
                    fill={`${seriesColors[i]}22`}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={config.animate ?? false}
                />
            )),
        [seriesColors, config.animate]
    );

    const renderBars = useCallback(
        (series: ChartSeries[]) =>
            series.map((s, i) => (
                <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={seriesColors[i]}
                    isAnimationActive={config.animate ?? false}
                />
            )),
        [seriesColors, config.animate]
    );

    const commonProps = {
        data: liveData,
        margin: {top: 8, right: 16, left: 0, bottom: 0},
    };

    const xAxis = (
        <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            tick={{fill: textColor, fontSize: 11}}
            axisLine={{stroke: gridStroke}}
            tickLine={false}
        />
    );

    const yAxis = (
        <YAxis
            domain={config.yAxisDomain ?? ['auto', 'auto']}
            tick={{fill: textColor, fontSize: 11}}
            axisLine={false}
            tickLine={false}
            width={40}
        />
    );

    const grid = config.showGrid !== false ? (
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false}/>
    ) : null;

    const legend = config.showLegend ? (
        <Legend
            wrapperStyle={{fontSize: '0.75rem', color: tokens.textSecondary}}
        />
    ) : null;

    const tooltip = (
        <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(val: number) => formatTimestamp(val)}
        />
    );

    return (
        <div className={className} style={{width: '100%', height}}>
            <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                    <BarChart {...commonProps}>
                        {grid}
                        {xAxis}
                        {yAxis}
                        {tooltip}
                        {legend}
                        {renderBars(config.series)}
                    </BarChart>
                ) : chartType === 'area' ? (
                    <AreaChart {...commonProps}>
                        {grid}
                        {xAxis}
                        {yAxis}
                        {tooltip}
                        {legend}
                        {renderAreas(config.series)}
                    </AreaChart>
                ) : (
                    <LineChart {...commonProps}>
                        {grid}
                        {xAxis}
                        {yAxis}
                        {tooltip}
                        {legend}
                        {renderLines(config.series)}
                    </LineChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}

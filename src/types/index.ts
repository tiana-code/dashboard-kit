export type WidgetType =
    | 'kpi'
    | 'chart'
    | 'table'
    | 'text'
    | 'gauge'
    | 'heatmap';

export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
}

export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    config: Record<string, unknown>;
    dataSource?: string;
}

export interface DashboardLayout {
    id: string;
    name: string;
    cols: number;
    rowHeight: number;
    widgets: Widget[];
    layouts: WidgetLayout[];
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface KpiValue {
    value: number;
    unit?: string;
    label: string;
    previousValue?: number;
    trend?: TrendDirection;
    trendPercent?: number;
    target?: number;
    status?: 'good' | 'warning' | 'critical';
    timestamp?: string;
}

export interface ChartDataPoint {
    timestamp: number;
    value: number;
    label?: string;

    [key: string]: unknown;
}

export interface ChartSeries {
    key: string;
    name: string;
    color?: string;
    type?: 'line' | 'bar' | 'area';
}

export interface RealTimeChartConfig {
    series: ChartSeries[];
    maxPoints?: number;
    refreshInterval?: number;
    yAxisDomain?: [number | 'auto', number | 'auto'];
    showGrid?: boolean;
    showLegend?: boolean;
    animate?: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeTokens {
    background: string;
    surface: string;
    surfaceVariant: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    chartPalette: string[];
}

export interface SSEOptions {
    url: string;
    withCredentials?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    onOpen?: () => void;
    onError?: (error: Event) => void;
}

export interface SSEState<T> {
    data: T | null;
    isConnected: boolean;
    error: string | null;
    reconnectCount: number;
}

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions<T> {
    data: T[];
    filename?: string;
    format?: ExportFormat;
    fields?: (keyof T)[];
    headers?: Partial<Record<keyof T, string>>;
}

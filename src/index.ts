export {BentoGrid, WidgetShell} from './components/BentoGrid.js';
export {KpiCard} from './components/KpiCard.js';
export {RealTimeChart} from './components/RealTimeChart.js';
export {ThemeProvider, useTheme} from './components/ThemeProvider.js';

export {useRealTimeData} from './hooks/useRealTimeData.js';
export {useExport} from './hooks/useExport.js';

export type {
    Widget,
    WidgetLayout,
    WidgetType,
    DashboardLayout,
    KpiValue,
    TrendDirection,
    ChartDataPoint,
    ChartSeries,
    RealTimeChartConfig,
    ThemeMode,
    ThemeTokens,
    SSEOptions,
    SSEState,
    ExportFormat,
    ExportOptions,
} from './types/index.js';

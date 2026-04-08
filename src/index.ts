export {BentoGrid, WidgetShell} from './components/BentoGrid.js';
export {KpiCard} from './components/KpiCard.js';
export {RealTimeChart} from './components/RealTimeChart.js';
export {ThemeProvider, useTheme} from './components/ThemeProvider.js';

export {useRealTimeData} from './hooks/useRealTimeData.js';
export {useExport} from './hooks/useExport.js';

export {createEventSourceConnection} from './adapters/createEventSourceConnection.js';
export {createReconnectStrategy} from './adapters/createReconnectStrategy.js';
export {serializeToCsv} from './adapters/serializeToCsv.js';
export {serializeToJson} from './adapters/serializeToJson.js';
export {downloadBlob} from './adapters/downloadBlob.js';

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
    RealtimeError,
    SSEOptions,
    SSEState,
    ExportFormat,
    ExportOptions,
} from './types/index.js';

export type {EventSourceConnectionOptions} from './adapters/createEventSourceConnection.js';
export type {ReconnectStrategyOptions} from './adapters/createReconnectStrategy.js';
export type {CsvOptions} from './adapters/serializeToCsv.js';

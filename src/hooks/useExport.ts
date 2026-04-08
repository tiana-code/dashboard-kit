import {useCallback, useState} from 'react';
import type {ExportFormat, ExportOptions} from '../types';
import {serializeToCsv} from '../adapters/serializeToCsv.js';
import {serializeToJson} from '../adapters/serializeToJson.js';
import {downloadBlob} from '../adapters/downloadBlob.js';

interface ExportState {
    isExporting: boolean;
    error: string | null;
}

interface UseExportReturn {
    exportData: <T extends Record<string, unknown>>(
        options: ExportOptions<T>
    ) => Promise<void>;
    isExporting: boolean;
    error: string | null;
}

function buildFilename(base: string, format: ExportFormat): string {
    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
    return `${base}-${timestamp}.${format}`;
}

export function useExport(): UseExportReturn {
    const [state, setState] = useState<ExportState>({
        isExporting: false,
        error: null,
    });

    const exportData = useCallback(
        async <T extends Record<string, unknown>>(
            options: ExportOptions<T>
        ): Promise<void> => {
            const {
                data,
                filename = 'export',
                format = 'csv',
                fields,
                headers,
            } = options;

            setState({isExporting: true, error: null});

            try {
                if (format === 'json') {
                    const content = serializeToJson(data, fields);
                    downloadBlob(content, buildFilename(filename, 'json'), 'application/json');
                } else {
                    const csvOptions: import('../adapters/serializeToCsv.js').CsvOptions<T> = {};
                    if (fields !== undefined) csvOptions.fields = fields;
                    if (headers !== undefined) csvOptions.headers = headers;
                    const content = serializeToCsv(data, csvOptions);
                    downloadBlob(content, buildFilename(filename, 'csv'), 'text/csv;charset=utf-8;');
                }

                setState({isExporting: false, error: null});
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'Export failed';
                setState({isExporting: false, error: message});
            }
        },
        []
    );

    return {exportData, isExporting: state.isExporting, error: state.error};
}

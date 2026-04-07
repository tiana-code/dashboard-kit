import {useCallback, useState} from 'react';
import type {ExportFormat, ExportOptions} from '../types';

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

function toCSV<T extends Record<string, unknown>>(
    data: T[],
    fields?: (keyof T)[],
    headers?: Partial<Record<keyof T, string>>
): string {
    if (data.length === 0) return '';

    const keys: (keyof T)[] = fields ?? (Object.keys(data[0]) as (keyof T)[]);

    const headerRow = keys
        .map((k) => {
            const label = headers?.[k] ?? String(k);
            return `"${String(label).replace(/"/g, '""')}"`;
        })
        .join(',');

    const rows = data.map((row) =>
        keys
            .map((k) => {
                const val = row[k];
                if (val === null || val === undefined) return '';
                const str = String(val);
                return `"${str.replace(/"/g, '""')}"`;
            })
            .join(',')
    );

    return [headerRow, ...rows].join('\n');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function buildFilename(base: string, format: ExportFormat): string {
    const ts = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
    return `${base}-${ts}.${format}`;
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
                await Promise.resolve();

                if (format === 'json') {
                    const subset =
                        fields && fields.length > 0
                            ? data.map((row) =>
                                Object.fromEntries(
                                    fields.map((k) => [k, row[k]])
                                ) as Record<string, unknown>
                            )
                            : data;
                    const content = JSON.stringify(subset, null, 2);
                    triggerDownload(
                        content,
                        buildFilename(filename, 'json'),
                        'application/json'
                    );
                } else {
                    const csv = toCSV(data, fields, headers);
                    triggerDownload(
                        csv,
                        buildFilename(filename, 'csv'),
                        'text/csv;charset=utf-8;'
                    );
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

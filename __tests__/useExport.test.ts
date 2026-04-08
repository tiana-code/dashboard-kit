import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useExport} from '../src';

type Row = { id: number; name: string; value: number };

function readBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(blob);
    });
}

const sampleData: Row[] = [
    {id: 1, name: 'Alpha', value: 100},
    {id: 2, name: 'Beta', value: 200},
    {id: 3, name: 'Gamma "quoted"', value: 300},
];

let createdObjectUrl = '';
let revokedUrl = '';
let anchorClickCount = 0;

beforeEach(() => {
    createdObjectUrl = '';
    revokedUrl = '';
    anchorClickCount = 0;

    globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
        createdObjectUrl = `blob:test-${blob.type}`;
        return createdObjectUrl;
    });
    globalThis.URL.revokeObjectURL = vi.fn((url: string) => {
        revokedUrl = url;
    });

    const mockAnchor = {
        href: '',
        download: '',
        style: {display: ''},
        click: vi.fn(() => {
            anchorClickCount++;
        }),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') return mockAnchor as unknown as HTMLElement;
        return originalCreateElement(tag);
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.body);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.body);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useExport', () => {
    it('starts with isExporting=false and no error', () => {
        const {result} = renderHook(() => useExport());
        expect(result.current.isExporting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('triggers CSV download with correct mime type', async () => {
        const {result} = renderHook(() => useExport());
        await act(async () => {
            await result.current.exportData({data: sampleData, filename: 'test', format: 'csv'});
        });
        expect(createdObjectUrl).toContain('text/csv');
        expect(anchorClickCount).toBe(1);
        expect(revokedUrl).toBe(createdObjectUrl);
        expect(result.current.isExporting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('triggers JSON download with correct mime type', async () => {
        const {result} = renderHook(() => useExport());
        await act(async () => {
            await result.current.exportData({data: sampleData, filename: 'test', format: 'json'});
        });
        expect(createdObjectUrl).toContain('application/json');
        expect(anchorClickCount).toBe(1);
    });

    it('defaults to CSV when format is not specified', async () => {
        const {result} = renderHook(() => useExport());
        await act(async () => {
            await result.current.exportData({data: sampleData});
        });
        expect(createdObjectUrl).toContain('text/csv');
    });

    it('respects field selection for CSV', async () => {
        const {result} = renderHook(() => useExport());
        const blobs: Blob[] = [];
        globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test';
        });

        await act(async () => {
            await result.current.exportData({
                data: sampleData,
                format: 'csv',
                fields: ['name', 'value'],
            });
        });

        expect(blobs.length).toBe(1);
        const text = await readBlob(blobs[0]!);
        expect(text).toContain('"name"');
        expect(text).toContain('"value"');
        expect(text).not.toContain('"id"');
    });

    it('escapes double quotes in CSV values', async () => {
        const {result} = renderHook(() => useExport());
        const blobs: Blob[] = [];
        globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test';
        });

        await act(async () => {
            await result.current.exportData({
                data: sampleData,
                format: 'csv',
                fields: ['name'],
            });
        });

        const text = await readBlob(blobs[0]!);
        expect(text).toContain('"Gamma ""quoted"""');
    });

    it('uses custom headers in CSV output', async () => {
        const {result} = renderHook(() => useExport());
        const blobs: Blob[] = [];
        globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test';
        });

        await act(async () => {
            await result.current.exportData({
                data: sampleData,
                format: 'csv',
                fields: ['id', 'name'],
                headers: {id: 'Identifier', name: 'Full Name'},
            });
        });

        const text = await readBlob(blobs[0]!);
        expect(text).toContain('"Identifier"');
        expect(text).toContain('"Full Name"');
    });

    it('respects field selection for JSON', async () => {
        const {result} = renderHook(() => useExport());
        const blobs: Blob[] = [];
        globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test';
        });

        await act(async () => {
            await result.current.exportData({
                data: sampleData,
                format: 'json',
                fields: ['id'],
            });
        });

        const text = await readBlob(blobs[0]!);
        const parsed = JSON.parse(text) as Array<Record<string, unknown>>;
        expect(parsed[0]).toHaveProperty('id');
        expect(parsed[0]).not.toHaveProperty('name');
    });

    it('handles empty data array gracefully', async () => {
        const {result} = renderHook(() => useExport());
        await act(async () => {
            await result.current.exportData({data: [], format: 'csv'});
        });
        expect(result.current.error).toBeNull();
    });

    it('returns error state when download fails', async () => {
        globalThis.URL.createObjectURL = vi.fn(() => {
            throw new Error('Storage quota exceeded');
        });

        const {result} = renderHook(() => useExport());
        await act(async () => {
            await result.current.exportData({data: sampleData});
        });

        expect(result.current.error).toBe('Storage quota exceeded');
        expect(result.current.isExporting).toBe(false);
    });
});

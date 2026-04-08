export interface CsvOptions<T> {
    fields?: Array<keyof T>;
    headers?: Partial<Record<keyof T, string>>;
    delimiter?: string;
}

export function serializeToCsv<T extends Record<string, unknown>>(
    data: T[],
    options: CsvOptions<T> = {}
): string {
    if (data.length === 0) return '';

    const {fields, headers, delimiter = ','} = options;

    const firstRow = data[0];
    if (!firstRow) return '';
    const keys: Array<keyof T> = fields ?? (Object.keys(firstRow) as Array<keyof T>);

    const headerRow = keys
        .map((k) => {
            const label = headers?.[k] ?? String(k);
            return `"${String(label).replace(/"/g, '""')}"`;
        })
        .join(delimiter);

    const rows = data.map((row) =>
        keys
            .map((k) => {
                const val = row[k];
                if (val === null || val === undefined) return '';
                const str = String(val);
                return `"${str.replace(/"/g, '""')}"`;
            })
            .join(delimiter)
    );

    return [headerRow, ...rows].join('\n');
}

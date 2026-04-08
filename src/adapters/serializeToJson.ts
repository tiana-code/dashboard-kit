export function serializeToJson<T extends Record<string, unknown>>(data: T[], fields?: Array<keyof T>): string {
    if (fields && fields.length > 0) {
        const subset = data.map((row) =>
            Object.fromEntries(fields.map((k) => [k, row[k]])) as Record<string, unknown>
        );
        return JSON.stringify(subset, null, 2);
    }
    return JSON.stringify(data, null, 2);
}

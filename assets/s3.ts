// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getS3Implementation(initialData?: Record<string, any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const context: Record<string, any> = initialData ?? {};

    function fetch(payload: { documentName: string }) {
        return context[payload.documentName] ?? null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function store(payload: { documentName: string; state: any }) {
        context[payload.documentName] = payload.state;
    }

    return { fetch, store };
}

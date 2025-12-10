// TODO: rename this to "report"
const DOC_PREFIX = 'document';
const SCHEMA_VERSION = 'v1';

/**
 * Unix timestamp in seconds
 * @isLong
 */
type UnixTimestamp = number;

// TODO: Use actual slate.Element
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlateElement = Record<string, any>;

/**
 * Represents the status of the document regarding updates
 */
export interface DocUpdateStatus {
    last_updated?: UnixTimestamp;
    /**
     * @isInt
     */
    no_of_updates?: number;
}

export function validateDocName(docName: string) {
    const [prefix, version, id] = docName.split('_');
    if (prefix != DOC_PREFIX) {
        return Error(`Document name should start with "${DOC_PREFIX}"`);
    }
    if (version != SCHEMA_VERSION) {
        return Error(`Document schema version should be "${SCHEMA_VERSION}"`);
    }
    if (!/^\d+$/.test(id)) {
        return Error('Document id should be an integer');
    }
    return { prefix, version, id: Number(id) };
}

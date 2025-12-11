// TODO: rename this to "report"
const DOC_PREFIX = 'document';
const SCHEMA_VERSION = 'v1';

// TODO: Use actual slate.Element
/**
 * Represents the slate element
 */
export interface SlateElement {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children?: any[];
};

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

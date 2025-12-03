const DOCUMENT_PREFIX = 'document';
const SCHEMA_VERSION = 'v1';

export function validateDocumentName(documentName: string) {
    const [prefix, version, id] = documentName.split('_');
    if (prefix != DOCUMENT_PREFIX) {
        throw Error(`Document name should start with "${DOCUMENT_PREFIX}"`);
    }
    if (version != SCHEMA_VERSION) {
        throw Error(`Document schema version should be "${SCHEMA_VERSION}"`);
    }
    if (!/^\d+$/.test(id)) {
        throw Error('Document id should be an integer');
    }
}

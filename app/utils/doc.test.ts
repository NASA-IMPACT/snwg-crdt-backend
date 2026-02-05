import { expect, test, describe } from 'vitest';

import { validateDocName } from './doc.ts';

describe('validateDocName', () => {
    test('returns parsed values for a valid document name', () => {
        const result = validateDocName('document_v1_123');

        expect(result).toEqual({
            prefix: 'document',
            version: 'v1',
            id: 123,
        });
    });

    test('returns an error if prefix is invalid', () => {
        const result = validateDocName('report_v1_123');

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe(
            'Document name should start with "document"',
        );
    });

    test('returns an error if schema version is invalid', () => {
        const result = validateDocName('document_v2_123');

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe(
            'Document schema version should be "v1"',
        );
    });

    test('returns an error if id is not an integer', () => {
        const result = validateDocName('document_v1_xyz');

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe(
            'Document id should be an integer',
        );
    });

    test('returns an error if id is missing', () => {
        const result = validateDocName('document_v1_');

        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe(
            'Document id should be an integer',
        );
    });

    test('returns an error if not in specified format', () => {
        const result = validateDocName('xyzxyzxyzxyzxyzxyzxyz');
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe(
            'Document name should start with "document"',
        );
    });
});

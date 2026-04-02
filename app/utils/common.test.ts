import { expect, test, describe } from 'vitest';

import { validateCommaSeparatedUrls, removeNull } from './common.ts';

describe('validateCommaSeparatedUrls', () => {
    test('should return an array of valid URLs', () => {
        const input = 'https://example-one.com,https://example-two.com';
        const result = validateCommaSeparatedUrls(input);
        expect(result).toEqual(['https://example-one.com', 'https://example-two.com']);
    });

    test('should accept localhost URLs', () => {
        const input = 'https://example-one.com,http://localhost:8080';
        const result = validateCommaSeparatedUrls(input);
        expect(result).toEqual(['https://example-one.com', 'http://localhost:8080']);
    });

    test('should trim spaces around URLs', () => {
        const input = '  https://example-one.com  ,  https://example-two.com ';
        const result = validateCommaSeparatedUrls(input);
        expect(result).toEqual(['https://example-one.com', 'https://example-two.com']);
    });

    test('should ignore empty URLs between commas', () => {
        const input = 'https://example-one.com,,https://example-two.com, ,';
        const result = validateCommaSeparatedUrls(input);
        expect(result).toEqual(['https://example-one.com', 'https://example-two.com']);
    });

    test('should throw for invalid URLs', () => {
        const input = 'https://example-one.com,not-a-url';
        expect(() => validateCommaSeparatedUrls(input)).toThrow();
    });

    test('should return an empty array for empty input', () => {
        const result = validateCommaSeparatedUrls('');
        expect(result).toEqual([]);
    });
});

describe('removeNull', () => {
    test('returns undefined for null or undefined input', () => {
        expect(removeNull(null)).toBeUndefined();
        expect(removeNull(undefined)).toBeUndefined();
    });

    test('returns primitive values unchanged', () => {
        expect(removeNull(999)).toBe(999);
        expect(removeNull(0)).toBe(0);

        expect(removeNull('hello world')).toBe('hello world');
        expect(removeNull('')).toBe('');

        expect(removeNull(true)).toBe(true);
        expect(removeNull(false)).toBe(false);
    });

    test('does not remove null and undefined values from arrays', () => {
        const input = [1, null, 2, undefined, 3];
        expect(removeNull(input)).toEqual([1, undefined, 2, undefined, 3]);
    });

    test('recursively work on nested arrays', () => {
        const input = [1, [null, 2, undefined], 3];
        expect(removeNull(input)).toEqual([1, [undefined, 2, undefined], 3]);
    });

    test('removes null and undefined properties from objects', () => {
        const input = {
            a: 1,
            b: null,
            c: undefined,
            d: 2,
        };

        expect(removeNull(input)).toEqual({
            a: 1,
            d: 2,
        });
    });

    test('recursively cleans nested objects', () => {
        const input = {
            a: {
                b: null,
                c: 1,
            },
            d: undefined,
        };

        expect(removeNull(input)).toEqual({
            a: {
                c: 1,
            },
        });
    });

    test('removes blacklisted keys', () => {
        const input = {
            a: 1,
            token: 'xyz',
            b: 2,
        };

        expect(removeNull(input, ['token'])).toEqual({
            a: 1,
            b: 2,
        });
    });

    test('keeps whitelisted keys even if their value is null', () => {
        const input = {
            a: 1,
            b: undefined,
            id: null,
            name: 'hari',
        };

        expect(removeNull(input, [], ['id', 'name'])).toEqual({
            a: 1,
            id: null,
            name: 'hari',
        });
    });

    test('blacklist takes precedence over whitelist', () => {
        const input = {
            a: 1,
            id: 999,
        };

        expect(removeNull(input, ['id'], ['id'])).toEqual({
            a: 1,
        });
    });

    test('handles complex nested structures with blacklist and whitelist', () => {
        const input = {
            a: null,
            b: {
                id: null,
                c: null,
                d: 4,
                token: 'xyz',
            },
            e: [null, 1, undefined, { f: null, g: 2 }],
            id: null,
            token: 'abc',
        };

        const result = removeNull(input, ['token'], ['id']);

        expect(result).toEqual({
            b: {
                d: 4,
                id: null,
            },
            e: [undefined, 1, undefined, { g: 2 }],
            id: null,
        });
    });
});

import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';

import { initWsApp } from '../core/express.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
);

describe('base', () => {
    test('check unimplemented route', async () => {
        const res = await request(wsApp).get('/docx');
        expect(res.status).toBe(404);
        expect(res.body).toStrictEqual({
            message: 'Resource not found',
        });
    });

    test('check route with internal server error', async () => {
        vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
            throw new Error('ENOENT: no such file or directory');
        });

        const res = await request(wsApp).get('/docs/');
        expect(res.status).toBe(500);
        expect(res.body).toStrictEqual({
            message: 'Internal server error',
            // FIXME: We should not expose details
            details: 'ENOENT: no such file or directory',
        });
    });

    test('check route with uncaught error', async () => {
        vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
            throw 'oops';
        });

        const res = await request(wsApp).get('/docs/');
        expect(res.status).toBe(500);
        expect(res.body).toStrictEqual({
            message: 'Internal server error',
        });
    });

    test('check route with trailing slash', async () => {
        const res = await request(wsApp).get('/docs/');
        expect(res.status).toBe(200);
    });

    test('check route without trailing slash', async () => {
        const res = await request(wsApp).get('/docs');
        expect(res.status).toBe(301);
    });
});

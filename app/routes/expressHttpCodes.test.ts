import { describe, test, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';

import { initWsApp } from '../core/express.ts';
import { registerSwaggerUi } from '../core/swagger.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    (app) => {
        registerSwaggerUi(app);
    },
);

describe('base', () => {
    const readFileSyncSpy = vi.spyOn(fs, 'readFileSync');

    afterEach(() => {
        readFileSyncSpy.mockClear();
    });

    test('check unimplemented route', async () => {
        const res = await request(wsApp).get('/docx');
        expect(res.status).toBe(404);
        expect(res.body).toStrictEqual({
            message: 'Resource not found',
        });
    });

    test('check route with internal server error', async () => {
        readFileSyncSpy.mockImplementationOnce(() => {
            throw new Error('ENOENT: no such file or directory');
        });

        const res = await request(wsApp).get('/docs/');

        expect(readFileSyncSpy).toHaveBeenCalledOnce();

        expect(res.status).toBe(500);
        expect(res.body).toStrictEqual({
            message: 'Internal server error',
            // FIXME: We should not expose details
            details: 'ENOENT: no such file or directory',
        });
    });

    test('check route with uncaught error', async () => {
        readFileSyncSpy.mockImplementationOnce(() => {
            throw 'oops';
        });

        const res = await request(wsApp).get('/docs/');

        expect(readFileSyncSpy).toHaveBeenCalledOnce();

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

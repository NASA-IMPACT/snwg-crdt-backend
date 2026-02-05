import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';

import { initWsApp } from '../core/express.ts';
import * as jwt from '../../app/utils/jwt.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
);

describe('user authentication', () => {
    test('handles missing authentication token', async () => {
        const res = await request(wsApp).get('/collaboration/status');
        expect(res.status).toBe(401);
        expect(res.body).toStrictEqual({
            message: 'Unauthorized',
            details: 'Missing or invalid Authorization header',
        });
    });

    test('handles incorrect authentication token', async () => {
        vi.spyOn(jwt, 'verifyJwt').mockResolvedValueOnce(new Error('JWT string does not consist of exactly 3 parts (header, payload, signature)'));

        const res = await request(wsApp)
            .get('/collaboration/status')
            .set('Authorization', 'Bearer my-invalid-token');
        expect(res.status).toBe(401);
        expect(res.body).toStrictEqual({
            message: 'Unauthorized',
            details: 'JWT string does not consist of exactly 3 parts (header, payload, signature)',
        });
    });
});

describe('service authentication', () => {
    test('handles missing authentication token', async () => {
        const res = await request(wsApp)
            .put('/documents/document_v1_123/reset')
            .send({ document: null });
        expect(res.status).toBe(401);
        expect(res.body).toStrictEqual({
            message: 'Unauthorized',
            details: 'Missing or invalid Authorization header',
        });
    });

    test('handles invalid authentication token', async () => {
        const res = await request(wsApp)
            .put('/documents/document_v1_123/reset')
            .set('Authorization', 'Bearer abcabcabcabc')
            .send({ document: null });
        expect(res.status).toBe(401);
        expect(res.body).toStrictEqual({
            message: 'Unauthorized',
            details: 'Service token is not correct',
        });
    });
});

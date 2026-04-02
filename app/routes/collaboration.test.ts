import { describe, test, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

import { initWsApp } from '../core/express.ts';
import { s3Extension, registerHocuspocus } from '../core/hocuspocus.ts';
import * as jwt from '../../app/utils/jwt.ts';
import { mockTokenPayload } from '../../assets/jwt.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    (app) => {
        registerHocuspocus(app, {
            debounce: 0,
            maxDebounce: 0,
        });
    },
);

describe('collaboration', () => {
    const verifyJwtSpy = vi.spyOn(jwt, 'verifyJwt');
    const s3FetchSpy = vi.spyOn(s3Extension.configuration, 'fetch');
    const s3StoreSpy = vi.spyOn(s3Extension.configuration, 'store');

    afterEach(() => {
        verifyJwtSpy.mockClear();
        s3FetchSpy.mockReset();
        s3StoreSpy.mockReset();
    });

    test('GET /collaboration/status with valid token', async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);

        const res = await request(wsApp)
            .get('/collaboration/status')
            .set('Authorization', 'Bearer my-valid-token');

        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledTimes(0);
        expect(s3StoreSpy).toHaveBeenCalledTimes(0);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ openDocs: 0, openConnections: 0 });
    });
});

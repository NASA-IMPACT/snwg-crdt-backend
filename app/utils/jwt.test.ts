import nock from 'nock';
import { expect, test, describe } from 'vitest';
import { verifyJwt } from './jwt.ts';

import {
    realToken,
    userpoolId,
    clientId,
    host,
    realJwksResponse,
    realTokenPayload,
} from '../../assets/jwt.ts';

describe('verifyJwt', () => {
    test('should return valid jwt', async () => {
        const scope = nock(host)
            .get(`/${userpoolId}/.well-known/jwks.json`)
            .reply(200, realJwksResponse);

        const result = await verifyJwt(
            realToken,
            userpoolId,
            clientId,
            host,
            'id',
            // NOTE: Adding grace seconds os this JWT token can be valid for 100 years
            100 * 365 * 24 * 60 * 60,
        );

        scope.done();

        expect(result).toEqual(realTokenPayload);
    });

    test('should handle expired jwt', async () => {
        const scope = nock(host)
            .get(`/${userpoolId}/.well-known/jwks.json`)
            .reply(200, realJwksResponse);

        const result = await verifyJwt(realToken, userpoolId, clientId, host, 'id');

        scope.done();

        // FIXME: This should be instance of JwtExpiredError
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe('Token expired at 2026-02-02T04:07:31.000Z');
    });
});

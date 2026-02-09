import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.WebSocket = WebSocket as any;

import { describe, test, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';

import { mockTokenPayload } from '../../assets/jwt.ts';
import { initWsApp } from '../core/express.ts';
import * as jwt from '../../app/utils/jwt.ts';
import { s3Extension, registerHocuspocus } from '../core/hocuspocus.ts';
import { getS3Implementation } from '../../assets/s3.ts';
import { type Server } from 'http';
import { HocuspocusProvider, type onAuthenticationFailedParameters } from '@hocuspocus/provider';
import { type Hocuspocus } from '@hocuspocus/server';
import { type Socket } from 'net';

describe('Websocket doc', () => {
    let hocuspocus: Hocuspocus | undefined;
    const wsApp = initWsApp(
        { allowedOrigins: ['*'] },
        (app) => {
            hocuspocus = registerHocuspocus(app, {
                debounce: 0,
                maxDebounce: 0,
            });
        },
    );

    if (!hocuspocus) {
        throw 'Hocuspocus server must be defined';
    }

    const port = 8080;
    // NOTE: We need to force close connections for tests.
    // Not sure why it needs a force close.
    const connections = new Set<Socket>();
    let wsServer: Server;

    // FIXME: onConfigure cannot be mocked because it gets called when initializing the object
    const verifyJwtSpy = vi.spyOn(jwt, 'verifyJwt');
    const s3FetchSpy = vi.spyOn(s3Extension.configuration, 'fetch');
    const s3StoreSpy = vi.spyOn(s3Extension.configuration, 'store');

    beforeAll(async () => {
        await new Promise<void>((resolve) => {
            wsServer = wsApp.listen(port, () => {
                console.log('Server listening on port', port);
                resolve();
            });
        });

        // NOTE: track and clean up connections
        wsServer.on('connection', (socket) => {
            connections.add(socket);
            socket.on('close', () => {
                connections.delete(socket);
            });
        });
    });

    afterAll(async () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        hocuspocus!.closeConnections();

        // FIXME: Why did we have to force close the connection?
        for (const socket of connections) {
            socket.destroy();
        }
        await new Promise<void>((resolve) => {
            wsServer.close(() => {
                console.log('Closing server listening on port', port);
                resolve();
            });
        });
    });

    afterEach(() => {
        verifyJwtSpy.mockClear();
        s3FetchSpy.mockReset();
        s3StoreSpy.mockReset();
    });


    test('accepts websocket connections on /collaboration', async () => {
        verifyJwtSpy.mockResolvedValue(mockTokenPayload);

        const { fetch: fetchMock, store } = getS3Implementation();
        s3FetchSpy.mockImplementation(fetchMock);
        s3StoreSpy.mockImplementation(store);

        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'valid-jwt-token',
        });

        await new Promise<void>((resolve) => {
            provider1.on('authenticationFailed', (event: onAuthenticationFailedParameters) => {
                expect(event).toStrictEqual({ reason: 'fetch failed' });
                resolve();
            });
        });

        provider1.destroy();
    });
});

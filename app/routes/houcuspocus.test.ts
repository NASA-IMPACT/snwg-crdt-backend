import WebSocket from 'ws';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.WebSocket = WebSocket as any;

import { describe, test, expect, vi, afterEach, beforeAll, afterAll } from 'vitest';

import { mockTokenPayload } from '../../assets/jwt.ts';
import { initWsApp } from '../core/express.ts';
import * as jwt from '../../app/utils/jwt.ts';
import * as reportUtils from '../../app/utils/report.ts';
import { s3Extension, registerHocuspocus } from '../core/hocuspocus.ts';
import { getS3Implementation } from '../../assets/s3.ts';
import { report } from '../../assets/report.ts';
import { type Server } from 'http';
import {
    HocuspocusProvider,
    type onAuthenticationFailedParameters,
    type onAuthenticatedParameters,
    type onSyncedParameters,
    type onMessageParameters,
} from '@hocuspocus/provider';
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
    const fetchReportSpy = vi.spyOn(reportUtils, 'fetchReport');

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
        fetchReportSpy.mockClear();

        s3FetchSpy.mockReset();
        s3StoreSpy.mockReset();
    });

    // FIXME: Handle these cases
    // 1. [ ] Reset
    // 2. [ ] Fetch (in memory, in s3, in backend)

    test('rejects websocket connections if invalid document name', async () => {
        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'docx_v1_66',
            token: 'valid-jwt-token',
        });

        const authenticationFailedEvent = await new Promise<onAuthenticationFailedParameters>((resolve) => {
            provider1.on('authenticationFailed', (event: onAuthenticationFailedParameters) => {
                resolve(event);
            });
        });
        expect(authenticationFailedEvent).toStrictEqual({
            reason: 'Invalid Document Name',
        });

        provider1.destroy();
    });

    test('rejects websocket connections if invalid token supplied', async () => {
        verifyJwtSpy.mockResolvedValueOnce(Error('Failed to verify jwt'));

        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'invalid-jwt-token',
        });

        const authenticationFailedEvent = await new Promise<onAuthenticationFailedParameters>((resolve) => {
            provider1.on('authenticationFailed', (event: onAuthenticationFailedParameters) => {
                resolve(event);
            });
        });
        expect(authenticationFailedEvent).toStrictEqual({
            reason: 'Unauthorized',
        });

        provider1.destroy();
    });

    test('rejects websocket connections if no token supplied', async () => {
        verifyJwtSpy.mockResolvedValueOnce(Error('Failed to verify jwt'));

        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: undefined,
        });

        const authenticationFailedEvent = await new Promise<onAuthenticationFailedParameters>((resolve) => {
            provider1.on('authenticationFailed', (event: onAuthenticationFailedParameters) => {
                resolve(event);
            });
        });
        expect(authenticationFailedEvent).toStrictEqual({
            reason: 'Unauthorized',
        });

        provider1.destroy();
    });

    test('rejects websocket connections if fetch to backend failed', async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);
        fetchReportSpy.mockResolvedValueOnce(Error('fetch failed'));

        const { fetch: fetchMock, store } = getS3Implementation();
        s3FetchSpy.mockImplementation(fetchMock);
        s3StoreSpy.mockImplementation(store);

        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'valid-jwt-token',
        });

        const authenticationFailedEvent = await new Promise<onAuthenticationFailedParameters>((resolve) => {
            provider1.on('authenticationFailed', (event: onAuthenticationFailedParameters) => {
                resolve(event);
            });
        });
        expect(authenticationFailedEvent).toStrictEqual({
            reason: 'Document Load Failed',
        });

        provider1.destroy();
    });

    test('accepts websocket connections with data in backend', async () => {
        verifyJwtSpy.mockResolvedValue(mockTokenPayload);
        fetchReportSpy.mockResolvedValue(report);

        const { fetch: fetchMock, store } = getS3Implementation();
        s3FetchSpy.mockImplementation(fetchMock);
        s3StoreSpy.mockImplementation(store);

        // Provider 1: reads from backend
        const provider1 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'valid-jwt-token',
        });

        const connectEvent1Promise = new Promise<true>((resolve) => {
            provider1.on('connect', () => {
                resolve(true);
            });
        });
        const authenticatedEvent1Promise = new Promise<onAuthenticatedParameters>((resolve) => {
            provider1.on('authenticated', (event: onAuthenticatedParameters) => {
                resolve(event);
            });
        });
        const syncedEvent1Promise = new Promise<onSyncedParameters>((resolve) => {
            provider1.on('synced', (event: onSyncedParameters) => {
                resolve(event);
            });
        });

        const [connectEvent1, authenticatedEvent1, syncedEvent1] = await Promise.all([
            connectEvent1Promise,
            authenticatedEvent1Promise,
            syncedEvent1Promise,
        ]);
        expect(connectEvent1).toBe(true);
        expect(authenticatedEvent1).toStrictEqual({
            scope: 'read-write',
        });
        expect(syncedEvent1).toStrictEqual({
            state: true,
        });
        expect(s3FetchSpy).toBeCalledTimes(2);
        expect(s3StoreSpy).toBeCalledTimes(0);

        // Provider 2: reads from memory
        const provider2 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'another-valid-jwt-token',
        });

        const connectEvent2Promise = new Promise<true>((resolve) => {
            provider2.on('connect', () => {
                resolve(true);
            });
        });
        const authenticatedEvent2Promise = new Promise<onAuthenticatedParameters>((resolve) => {
            provider2.on('authenticated', (event: onAuthenticatedParameters) => {
                resolve(event);
            });
        });
        const syncedEvent2Promise = new Promise<onSyncedParameters>((resolve) => {
            provider2.on('synced', (event: onSyncedParameters) => {
                resolve(event);
            });
        });

        const [connect2Event, authenticated2Event, synced2Event] = await Promise.all([
            connectEvent2Promise,
            authenticatedEvent2Promise,
            syncedEvent2Promise,
        ]);
        expect(connect2Event).toBe(true);
        expect(authenticated2Event).toStrictEqual({
            scope: 'read-write',
        });
        expect(synced2Event).toStrictEqual({
            state: true,
        });

        // NOTE: Loading from memory should not call fetch or store
        expect(s3FetchSpy).toBeCalledTimes(2);
        expect(s3StoreSpy).toBeCalledTimes(0);

        const doc1 = provider1.document;
        const snwgProducts1 = doc1.getArray('snwg_products');
        const snwgProductsCount1 = snwgProducts1.length;
        doc1.transact(() => {
            snwgProducts1.delete(0, 1);
        });

        await new Promise<onMessageParameters>((resolve) => {
            provider2.on('message', (event: onMessageParameters) => {
                resolve(event);
            });
        });

        const doc2 = provider2.document;
        const snwgProducts2 = doc2.getArray('snwg_products');
        const snwgProductsCount2 = snwgProducts2.length;
        expect(snwgProductsCount2).toBe(snwgProductsCount1 - 1);

        // NOTE: Writing update should call store
        expect(s3FetchSpy).toBeCalledTimes(2);
        expect(s3StoreSpy).toBeCalledTimes(1);

        provider1.destroy();
        provider2.destroy();

        // Provider 3 reads from s3
        const provider3 = new HocuspocusProvider({
            url: `ws://localhost:${port}/collaboration`,
            name: 'document_v1_66',
            token: 'yet-another-valid-jwt-token',
        });

        const connectEvent3Promise = new Promise<true>((resolve) => {
            provider3.on('connect', () => {
                resolve(true);
            });
        });
        const authenticatedEvent3Promise = new Promise<onAuthenticatedParameters>((resolve) => {
            provider3.on('authenticated', (event: onAuthenticatedParameters) => {
                resolve(event);
            });
        });
        const syncedEvent3Promise = new Promise<onSyncedParameters>((resolve) => {
            provider3.on('synced', (event: onSyncedParameters) => {
                resolve(event);
            });
        });

        const [
            connectEvent3,
            authenticatedEvent3,
            syncedEvent3,
        ] = await Promise.all([
            connectEvent3Promise,
            authenticatedEvent3Promise,
            syncedEvent3Promise,
        ]);
        expect(connectEvent3).toBe(true);
        expect(authenticatedEvent3).toStrictEqual({
            scope: 'read-write',
        });
        expect(syncedEvent3).toStrictEqual({
            state: true,
        });
        expect(s3FetchSpy).toBeCalledTimes(4);
        expect(s3StoreSpy).toBeCalledTimes(1);

        const doc3 = provider3.document;
        const snwgProducts3 = doc3.getArray('snwg_products');
        const snwgProductsCount3 = snwgProducts3.length;
        expect(snwgProductsCount3).toBe(snwgProductsCount2);

        provider3.destroy();
    });
});

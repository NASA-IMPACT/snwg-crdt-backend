import * as Y from 'yjs';
import { describe, test, expect, vi, afterEach } from 'vitest';
import request from 'supertest';

import { mockTokenPayload } from '../../assets/jwt.ts';
import { initWsApp } from '../core/express.ts';
import * as jwt from '../../app/utils/jwt.ts';
import { s3Extension, registerHocuspocus } from '../core/hocuspocus.ts';
import { slateReportToDoc } from '../../app/utils/report.ts';
import { report } from '../../assets/report.ts';
import { getS3Implementation } from '../../assets/s3.ts';

describe('REST doc', () => {
    const wsApp = initWsApp(
        { allowedOrigins: [] },
        (app) => {
            registerHocuspocus(app, {
                debounce: 0,
                maxDebounce: 0,
            });
        },
    );

    const verifyJwtSpy = vi.spyOn(jwt, 'verifyJwt');
    const verifyServiceTokenSpy = vi.spyOn(jwt, 'verifyServiceToken');
    const s3FetchSpy = vi.spyOn(s3Extension.configuration, 'fetch');
    const s3StoreSpy = vi.spyOn(s3Extension.configuration, 'store');

    afterEach(() => {
        verifyJwtSpy.mockClear();
        verifyServiceTokenSpy.mockClear();
        s3FetchSpy.mockReset();
        s3StoreSpy.mockReset();
    });

    test('GET /documents/{name} with incorrect document format', async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);

        const res = await request(wsApp)
            .get('/documents/doc_v1_7777')
            .set('Authorization', 'Bearer my-valid-token');

        expect(verifyJwtSpy).toHaveBeenCalledOnce();

        expect(res.status).toBe(422);
        expect(res.body).toStrictEqual({
            message: 'Validation failed',
            details: {
                name: {
                    message: 'Document name should start with "document"',
                    value: 'doc_v1_7777',
                },
            },
        });
    });

    test('GET /documents/{name} with non existing document', async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);
        const { fetch, store } = getS3Implementation();
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementationOnce(store);

        const res = await request(wsApp)
            .get('/documents/document_v1_11')
            .set('Authorization', 'Bearer my-valid-token');

        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledOnce();
        expect(s3StoreSpy).toHaveBeenCalledTimes(0);

        expect(res.status).toBe(404);
        expect(res.body).toStrictEqual({
            details: 'Document not found',
            message: 'Resource not found',
        });
    });

    test('GET /documents/{name} with existing document', async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);

        const doc = new Y.Doc();
        slateReportToDoc(report, doc);
        const binaryData = Y.encodeStateAsUpdate(doc);

        const { fetch, store } = getS3Implementation({
            document_v1_22: binaryData,
        });
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementationOnce(store);

        const res = await request(wsApp)
            .get('/documents/document_v1_22')
            .set('Authorization', 'Bearer my-valid-token');

        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledOnce();
        expect(s3StoreSpy).toHaveBeenCalledTimes(0);

        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({
            ...report.document,
            sections_completed: report.sections_completed,
            // NOTE: Added by default
            __update_states__: {
                no_of_updates: 0,
                last_updated: 1769584466347,
            },
            // NOTE: Added by default
            summary_satellite_sensors: {
                children: [
                    {
                        type: 'p',
                        children: [
                            {
                                text: '',
                            },
                        ],
                    },
                ],
            },
        });
    });

    test('GET /documents/{name}/reset/ with invalid data', async () => {
        verifyServiceTokenSpy.mockResolvedValueOnce(true);
        const { fetch, store } = getS3Implementation();
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementationOnce(store);

        const res = await request(wsApp)
            .put('/documents/document_v1_33/reset')
            .send({})
            .set('Authorization', 'Bearer my-valid-service-token');

        expect(verifyServiceTokenSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledTimes(0);
        expect(s3StoreSpy).toHaveBeenCalledTimes(0);

        expect(res.status).toBe(422);
        expect(res.body).toStrictEqual({
            details: {
                'body.document': {
                    message: '\'document\' is required',
                },
                'body.last_updated_at': {
                    message: '\'last_updated_at\' is required',
                },
                'body.sections_completed': {
                    message: '\'sections_completed\' is required',
                },
            },
            message: 'Validation failed',
        });
    });

    test('GET /documents/{name}/reset/ with no data in s3', async () => {
        verifyServiceTokenSpy.mockResolvedValueOnce(true);
        const { fetch, store } = getS3Implementation();
        s3FetchSpy.mockImplementationOnce(fetch);
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementation(store);

        const res = await request(wsApp)
            .put('/documents/document_v1_44/reset')
            .send(report)
            .set('Authorization', 'Bearer my-valid-service-token');

        expect(verifyServiceTokenSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledTimes(2);
        expect(s3StoreSpy).toHaveBeenCalledTimes(0);

        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({
            docName: 'document_v1_44',
        });
    });

    test('GET /documents/{name}/reset/ with data in s3', async () => {
        verifyServiceTokenSpy.mockResolvedValueOnce(true);

        const doc = new Y.Doc();
        slateReportToDoc(report, doc);
        const binaryData = Y.encodeStateAsUpdate(doc);
        const { fetch, store } = getS3Implementation({
            document_v1_55: binaryData,
        });
        s3FetchSpy.mockImplementationOnce(fetch);
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementationOnce(store);

        const updatedReport = {
            ...report,
            sections_completed: {
                ...report.sections_completed,
                department: 'complete',
            },
        };

        const res = await request(wsApp)
            .put('/documents/document_v1_55/reset')
            .send(updatedReport)
            .set('Authorization', 'Bearer my-valid-service-token');

        expect(verifyServiceTokenSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledTimes(2);
        expect(s3StoreSpy).toHaveBeenCalledTimes(1);

        expect(res.status).toBe(200);
        expect(res.body).toStrictEqual({
            docName: 'document_v1_55',
        });

        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);
        s3FetchSpy.mockImplementationOnce(fetch);
        s3StoreSpy.mockImplementationOnce(store);

        const res2 = await request(wsApp)
            .get('/documents/document_v1_55')
            .set('Authorization', 'Bearer my-valid-token');

        // FIXME: confirm if direct connection does not load document into memory
        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledTimes(3);
        expect(s3StoreSpy).toHaveBeenCalledTimes(1);
        expect(res2.status).toBe(200);
    });
});

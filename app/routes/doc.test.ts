import * as Y from 'yjs';
import { describe, test, expect, vi, afterEach } from "vitest";
import request from "supertest";

import { mockTokenPayload } from '../../assets/jwt.ts';
import { initWsApp } from '../core/express.ts';
import { s3Extension } from '../core/hocuspocus.ts';
import * as jwt from '../../app/utils/jwt.ts';
import { slateReportToDoc } from '../../app/utils/report.ts';
import { report } from '../../assets/report.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
);


describe("doc", () => {
    const verifyJwtSpy = vi.spyOn(jwt, 'verifyJwt');
    const s3FetchSpy = vi.spyOn(s3Extension.configuration, 'fetch');

    afterEach(() => {
        verifyJwtSpy.mockClear();
        s3FetchSpy.mockClear();
    });

    test("GET /documents/ with incorrect document format", async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);

        const res = await request(wsApp)
            .get("/documents/doc_v1_9999")
            .set("Authorization", "Bearer my-valid-token")

        expect(verifyJwtSpy).toHaveBeenCalledOnce();

        expect(res.status).toBe(422);
        expect(res.body).toStrictEqual({
            "message": "Validation failed",
            "details": {
                "name": {
                    "message": "Document name should start with \"document\"",
                    "value": "doc_v1_9999",
                }
            },
        });
    });

    test("GET /documents/ with non existing document", async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);
        s3FetchSpy.mockResolvedValueOnce(null);

        const res = await request(wsApp)
            .get("/documents/document_v1_8888")
            .set("Authorization", "Bearer my-valid-token")

        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledOnce();

        expect(res.status).toBe(404);
        expect(res.body).toStrictEqual({
            "details": "Document not found",
            "message": "Resource not found",
        });
    });

    test("GET /doc/ with existing document", async () => {
        verifyJwtSpy.mockResolvedValueOnce(mockTokenPayload);

        const doc = new Y.Doc();
        slateReportToDoc(report, doc);
        const binaryData = Y.encodeStateAsUpdate(doc);
        s3FetchSpy.mockResolvedValueOnce(binaryData);

        const res = await request(wsApp)
            .get("/documents/document_v1_9999")
            .set("Authorization", "Bearer my-valid-token")

        expect(verifyJwtSpy).toHaveBeenCalledOnce();
        expect(s3FetchSpy).toHaveBeenCalledOnce();

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
                "children": [
                    {
                        type: "p",
                        children: [
                            {
                                "text": "",
                            },
                        ],
                    },
                ],
            },
        });
    });
});

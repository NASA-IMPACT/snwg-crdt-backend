import { describe, test, expect, vi } from "vitest";
import request from "supertest";

import { initWsApp } from '../core/express.ts';
import * as jwt from '../../app/utils/jwt.ts';
import { mockTokenPayload } from '../../assets/jwt.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
);

describe("collaboration", () => {
    test("GET /collaboration/status with valid token", async () => {
        const verifyJwtSpy = vi.spyOn(jwt, 'verifyJwt')
            .mockResolvedValueOnce(mockTokenPayload);

        const res = await request(wsApp)
            .get("/collaboration/status")
            .set("Authorization", "Bearer my-valid-token")

        expect(verifyJwtSpy).toHaveBeenCalledOnce();

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ openDocs: 0, openConnections: 0 });
    });
});

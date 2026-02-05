import { describe, test, expect } from "vitest";
import request from "supertest";

import { initWsApp } from '../core/express.ts';

const wsApp = initWsApp(
    { allowedOrigins: [] },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {},
);

describe("health", () => {
    test("GET /health", async () => {
        const res = await request(wsApp).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});

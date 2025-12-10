import express from 'express';
import { ValidateError } from "tsoa";

import { AuthError } from './utils/error.ts';

import { hocuspocusServer } from './core/hocuspocus.ts';
import { expressServer, PORT } from './core/express.ts';

import { RegisterRoutes } from "../generated/routes.ts";

/* TODO:
- HIGH
    - Check if document exists on the backend and user has write access
- MEDIUM
    - Check updated authentication token
        - beforeHandleMessage and onTokenSync
    - Do not throw errors instead use Union
    - Add JSDoc linting in eslint
        - https://www.npmjs.com/package/eslint-plugin-jsdoc
- LOW
    - Add background check to see if document schema version has changed between client and server
    - Migrate documents when versions change?
    - Configure express extentions
        - compression
        - cors
        - timeout
        - helmet
    - Add health check
        - https://article.arunangshudas.com/6-common-mistakes-in-node-js-health-check-implementations-852c62365065
    - Check stack trace
    - Setup error monitoring
*/

// Register collaboration endpoint to upgrade to websocket
expressServer.ws('/collaboration/', (websocket, request) => {
    hocuspocusServer.handleConnection(websocket, request)
});

// Register other routes from tsoa
RegisterRoutes(expressServer);

// Handle 404 errors
expressServer.use(
    (_req: express.Request, res: express.Response) => {
        res.status(404).send({
            message: "Resource not found",
        });
    },
);

// Handle other errors
expressServer.use(
    (err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err instanceof ValidateError) {
            console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
            return res.status(422).json({
                message: "Validation failed",
                details: err?.fields,
            });
        }
        if (err instanceof AuthError) {
            return res.status(401).send({
                message: "Unauthorized",
                details: err.message,
            });
        }
        if (err instanceof Error) {
            return res.status(500).json({
                message: "Internal server error",
                details: err.message,
            });
        }
        console.error('Uncaught error', err);
        next();
    },
);

// Listen to requests
expressServer.listen(
    PORT,
    () => {
        console.log(`Listening on http://127.0.0.1:${PORT}`)
    },
);

import express from 'express';
import { ValidateError } from "tsoa";

import { AuthError } from './utils/error.ts';

import { hocuspocusServer } from './core/hocuspocus.ts';
import { expressWsApp, PORT } from './core/express.ts';

import { RegisterRoutes } from "../generated/routes.ts";

// Register collaboration endpoint to upgrade to websocket
expressWsApp.ws('/collaboration/', (websocket, request) => {
    hocuspocusServer.handleConnection(websocket, request)
});

// Register other routes from tsoa
RegisterRoutes(expressWsApp);

// Handle 404 errors
expressWsApp.use(
    (_req: express.Request, res: express.Response) => {
        res.status(404).send({
            message: "Resource not found",
        });
    },
);

// Handle other errors
expressWsApp.use(
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
const expressServer = expressWsApp.listen(
    PORT,
    () => {
        console.log(`Listening on http://127.0.0.1:${PORT}`)
    },
);

// Setup timeout to 1 minute
expressServer.setTimeout( 1 * 60 * 1000)

// Handle sigterm
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  expressServer.close(() => {
    console.log('HTTP server closed')
  })
})

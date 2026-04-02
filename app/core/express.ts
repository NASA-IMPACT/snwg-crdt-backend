import express from 'express';
import { ValidateError } from 'tsoa';
import expressWebsockets from 'express-ws';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import * as Helmet from 'helmet';

import { AuthError, NotFoundError } from '../utils/error.ts';
import { RegisterRoutes } from '../../generated/routes.ts';

// NOTE: could not import helmet normally!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const helmet = Helmet.default as unknown as () => any;

interface InitConfig {
    allowedOrigins: string[];
}

export function initWsApp(
    config: InitConfig,
    preRoutesRegistrationHook: (app: expressWebsockets.Application) => void,
) {
    const expressApp = express();

    const { app: expressWsApp } = expressWebsockets(expressApp);

    // Setup json parser
    expressWsApp.use(express.json());

    // Setup logger
    expressWsApp.use(morgan('dev'));

    // Compress responses
    expressWsApp.use(compression());

    // Setup security headers
    expressWsApp.use(helmet());

    // Setup cors
    expressWsApp.use(cors({
        origin: config.allowedOrigins,
    }));

    preRoutesRegistrationHook(expressWsApp);

    // Register other routes from tsoa
    RegisterRoutes(expressWsApp);

    // Handle 404 errors
    expressWsApp.use(
        (_req: express.Request, res: express.Response) => {
            res.status(404).send({
                message: 'Resource not found',
            });
        },
    );

    // Handle other errors
    expressWsApp.use(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err: unknown, _: express.Request, res: express.Response, __: express.NextFunction) => {
            if (err instanceof ValidateError) {
                return res.status(422).json({
                    message: 'Validation failed',
                    details: err?.fields,
                });
            }
            if (err instanceof NotFoundError) {
                return res.status(404).json({
                    message: 'Resource not found',
                    details: err.message,
                });
            }
            if (err instanceof AuthError) {
                return res.status(401).send({
                    message: 'Unauthorized',
                    details: err.message,
                });
            }
            if (err instanceof Error) {
                console.error(err);
                return res.status(500).json({
                    message: 'Internal server error',
                    details: err.message,
                });
            }
            console.error(err);
            return res.status(500).json({
                message: 'Internal server error',
            });
        },
    );

    return expressWsApp;
}

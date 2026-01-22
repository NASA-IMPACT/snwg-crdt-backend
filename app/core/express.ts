import express from 'express';
import expressWebsockets from 'express-ws';
import fs from 'fs';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import * as Helmet from 'helmet';

import env from '../utils/env.ts';

// NOTE: could not import helmet normally!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const helmet = Helmet.default as unknown as () => any;

export const PORT = 8001;

const expressApp = express();

export const { app: expressWsApp } = expressWebsockets(expressApp);

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
    origin: [
        env.FRONTEND_HOST,
        ...env.CORS_ALLOWED_ORIGINS,
    ],
}))

// Support swagger ui
expressWsApp.use('/docs', swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
    // NOTE: Using YAML because JSON giving error
    // https://gitlab.com/gitlab-org/gitlab/-/issues/379097

    const file  = fs.readFileSync('./generated/swagger.yaml', 'utf8')
    const swaggerDocument = yaml.parse(file)

    const swaggerHtml = swaggerUi.generateHTML(swaggerDocument);
    return res.send(swaggerHtml);
});

import express from 'express';
import expressWebsockets from 'express-ws';
import fs from 'fs';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';


export const PORT = 8001;

const expressApp = express();
export const { app: expressServer } = expressWebsockets(expressApp);

// Setup logger
expressServer.use(morgan('dev'));

// Support swagger
expressServer.use('/docs', swaggerUi.serve, async (_req: express.Request, res: express.Response) => {
    // NOTE: Using YAML because JSON giving error
    // https://gitlab.com/gitlab-org/gitlab/-/issues/379097

    const file  = fs.readFileSync('./generated/swagger.yaml', 'utf8')
    const swaggerDocument = yaml.parse(file)

    const swaggerHtml = swaggerUi.generateHTML(swaggerDocument);
    return res.send(swaggerHtml);
});

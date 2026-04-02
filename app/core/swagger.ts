import { type Application } from 'express-ws';
import { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'yaml';

export function registerSwaggerUi(app: Application) {
    app.use('/docs', swaggerUi.serve, async (_req: ExpressRequest, res: ExpressResponse) => {
        // NOTE: Using YAML because JSON giving error
        // https://gitlab.com/gitlab-org/gitlab/-/issues/379097

        const file = fs.readFileSync('./generated/swagger.yaml', 'utf8');
        const swaggerDocument = yaml.parse(file);

        const swaggerHtml = swaggerUi.generateHTML(swaggerDocument);
        return res.send(swaggerHtml);
    });
}

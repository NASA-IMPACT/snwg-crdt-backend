import * as Y from 'yjs'
import { Router, Response, Request, NextFunction } from 'express';
import { yTextToSlateElement } from '@slate-yjs/core';

import { validateDocumentName } from '../utils/document.ts';
import { hocuspocusServer, getDocument } from '../core/hocuspocus.ts';
import { authMiddleware } from '../core/express.ts';

async function documentNameMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const name = request.params.name as string;
    try {
        validateDocumentName(name);
    } catch (ex) {
        return response.status(400).json({
            message: ex instanceof Error
                ? ex.message
                : 'Document name is invalid',
        });
    }
    next();
};

const documentsRouter = Router({ mergeParams: true })
documentsRouter.use(authMiddleware);
documentsRouter.use(documentNameMiddleware);

documentsRouter.get(
    '/',
    async (
        request: Request<{ name: string }>,
        response: Response<object>,
    ) => {
        const name = request.params.name as string;
        const document = await getDocument(name);
        if (!document) {
            return response.status(404).json({
                message: 'Document not found!',
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const schema: Record<string, any> = {
            __update_states__: Y.Map,
            decadal_survey: Y.XmlText,
            detailed_assessment: Y.XmlText,
            missions_phase_c: Y.XmlText,
            resources: Y.XmlText,
            synopsis: Y.XmlText,
            training_resources: Y.XmlText,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {}
        Object.entries(schema).forEach(([key, type]) => {
            const value = document.get(key, type);
            if (type == Y.XmlText) {
                data[key] = yTextToSlateElement(value);
            } else if (type == Y.Map) {
                data[key] = value.toJSON();
            } else {
                data[key] = null;
            }
        });
        response.json(data);
    },
);

documentsRouter.post(
    '/reset',
    async (
        request: Request<{ name: string }>,
        response: Response<object>,
    ) => {
        const name = request.params.name as string;
        const lastUpdated = new Date().getTime();
        const noOfUpdates = 0;

        const connection = await hocuspocusServer.openDirectConnection(name);
        connection.transact((document) => {
            const state = document.getMap('__update_states__')
            state.set('last_updated', lastUpdated);
            state.set('no_of_updates', noOfUpdates);
        });
        await connection.disconnect();

        response.json({
            documentName: name,
            lastUpdated,
            noOfUpdates,
        });
    },
);

export default documentsRouter;

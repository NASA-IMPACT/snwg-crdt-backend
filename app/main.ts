import express from 'express';
import expressWebsockets from 'express-ws';

import { hocuspocusServer } from './core/hocuspocus.ts';
import { authMiddleware } from './core/express.ts';
import documentsRouter from './routes/documents.ts';

/* TODO:
- Configure express extentions
    - compression
    - cors
    - morgan
    - timeout
    - helmet
- Setup OAS
    - swagger-ui
    - open api specification generation
- Setup error monitoring

- Check if document exists on the backend and user has write access
    - Add API on backend to check for user access
- Check updated authentication token
    - beforeHandleMessage and onTokenSync
- Add background check to see if document schema version has changed between client and server
- Migrate documents when versions change?
*/

const PORT = 8001;

const { app } = expressWebsockets(express());

app.ws('/collaboration/', (websocket, request) => {
    hocuspocusServer.handleConnection(websocket, request)
});

app.get('/collaboration/status', authMiddleware, (_, response) => {
    response.json({
        openDocuments: hocuspocusServer.getDocumentsCount(),
        openConnections: hocuspocusServer.getConnectionsCount(),
    });
});

app.use('/documents/:name', documentsRouter);

app.listen(
    PORT,
    () => {
        console.log(`Listening on http://127.0.0.1:${PORT}`)
    },
);

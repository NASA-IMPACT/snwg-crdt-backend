import { hocuspocusServer } from './core/hocuspocus.ts';
import { initWsApp } from './core/express.ts';

import env from './utils/env.ts';

const expressWsApp = initWsApp(
    {
        allowedOrigins: [
            env.FRONTEND_HOST,
            ...env.CORS_ALLOWED_ORIGINS,
        ],
    },
    (app) => {
        // Register collaboration endpoint to upgrade to websocket
        app.ws('/collaboration/', (websocket, request) => {
            hocuspocusServer.handleConnection(websocket, request)
        });
    },
);

// Listen to requests
const PORT = 8001;
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

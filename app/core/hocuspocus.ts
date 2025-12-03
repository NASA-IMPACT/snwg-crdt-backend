import * as Y from 'yjs'
import { Connection, Hocuspocus, type Extension } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger';
import { S3 } from '@hocuspocus/extension-s3';

import { verifyJwt } from '../utils/jwt.ts';
import { validateDocumentName } from '../utils/document.ts';
import env from '../utils/env.ts';

// Configure hocuspocus extentions
const s3Extension = new S3({
    bucket: env.S3_BUCKET,
    region: env.AWS_DEFAULT_REGION,
    endpoint: env.S3_CUSTOM_ENDPOINT,
    forcePathStyle: true,
});
const loggerExtention = new Logger();

// Configure hocuspocus server
export const hocuspocusServer = new Hocuspocus({
    extensions: [
        s3Extension satisfies Extension,
        loggerExtention satisfies Extension,
    ],
    onConnect: async (data) => {
        const { documentName } = data;
        validateDocumentName(documentName);
    },
    onChange: async (data) => {
        const {
            document,
            transactionOrigin,
        } = data;

        // NOTE: We only want to update these counts when changes are from the client
        const connection: Connection | null | undefined = transactionOrigin;
        if (connection === null || connection === undefined) {
            return;
        }

        document.transact(() => {
            const state = document.getMap('__update_states__');
            const previous_no_of_updates = state.get('no_of_updates') as (number | undefined) ?? 0;

            state.set('last_upated', new Date().getTime());
            state.set('no_of_updates', previous_no_of_updates + 1);
        });
    },
    onAuthenticate: async (data) => {
        // NOTE: onAuthenticate will only be called if user supplied a "token"
        const { token } = data;

        const tokenData = await verifyJwt(
            token,
            env.COGNITO_USER_POOL_ID,
            env.COGNITO_USER_CLIENT_ID,
            env.COGNITO_ISSUER,
        );
        if (!tokenData) {
            throw new Error("Token must be valid!");
        }

        // Check user permissions from token
        const id = tokenData['cognito:username'];
        const groups = tokenData['cognito:groups'];
        if (!groups || !(groups.includes('curator') || groups.includes('reviewer'))) {
            throw new Error("Only curators/reviewers can edit documents");
        }

        // Define context
        const context = {
            user: {
                id: id as string,
                username: tokenData.preferred_username as string,
                email: tokenData.email as string,
                groups: groups as string[],
            },
        }
        return context;
    },
})

// Get a document from hocuspocus
export async function getDocument(name: string) {
    const doc = hocuspocusServer.documents.get(name)
    if (doc) {
        return doc;
    }
    const s3Doc = new Y.Doc();

    // FIXME: Read this without the extention if posssible
    const fetched = await s3Extension.configuration.fetch({
        documentName: name,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!fetched) {
        return undefined;
    }

    Y.applyUpdate(s3Doc, fetched);
    return s3Doc;
}

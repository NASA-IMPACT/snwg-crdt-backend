import * as Y from 'yjs'
import { Connection, Hocuspocus, type Extension } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger';
import { S3 } from '@hocuspocus/extension-s3';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

import {
    docToYjsRepresentation,
    fetchReport,
    mutateUpdateStates,
} from '../core/document.ts';
import { verifyJwt } from '../utils/jwt.ts';
import { validateDocumentName } from '../utils/document.ts';
import env from '../utils/env.ts';

class ExtendedS3 extends S3 {
    async deleteObject(documentName: string) {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.configuration.bucket,
                Key: this.getObjectKey(documentName),
            });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            await this.s3Client!.send(command);

            return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
                // Document doesn't exist yet, return null
                return true;
            }
            throw error;
        }
    }
}

// Configure hocuspocus extentions
const s3Extension = new ExtendedS3({
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
        const { documentName, context } = data;
        const document = validateDocumentName(documentName);
        return {
            ...context,
            document,
        };
    },
    onAuthenticate: async (data) => {
        // NOTE: onAuthenticate will only be called if user supplied a "token"
        // TODO: check what happens if no token is sent?
        const { token, context } = data;

        const tokenData = await verifyJwt(
            token,
            env.COGNITO_USER_POOL_ID,
            env.COGNITO_USER_CLIENT_ID,
            env.COGNITO_ISSUER,
        );
        if (!tokenData) {
            throw Error("Token must be valid!");
        }

        // TODO: Update permissions from user group and pass permission function
        const id = tokenData['cognito:username'];
        const groups = tokenData['cognito:groups'];
        if (!groups || !(groups.includes('curator') || groups.includes('reviewer'))) {
            throw Error("Only curators/reviewers can edit documents");
        }

        return {
            ...context,
            user: {
                id: id as string,
                username: tokenData.preferred_username as string,
                email: tokenData.email as string,
                groups: groups as string[],
                token,
            },
        };
    },
    onLoadDocument: async (data) => {
        // NOTE: We can load the data from extension directly if it exists in s3
        const update = await s3Extension.configuration.fetch(data);
        if (update !== null) {
            Y.applyUpdate(data.document, update);
            console.log(`Loaded document "${data.documentName}" from s3`);
            return data.document;
        }

        // NOTE: This means we are creating a direct connection.
        // In this case, we should not load data from API
        if (!data.context || !data.context.user) {
            throw Error(`Could not load document "${data.documentName}" from s3`);
        }

        // NOTE: If document not in S3, get from server
        const { token } = data.context.user;
        const { id } = data.context.document;
        const latestVersionDocument = await fetchReport(id, token);

        const doc = docToYjsRepresentation(latestVersionDocument.document);
        const newUpdate = Y.encodeStateAsUpdate(doc);
        Y.applyUpdate(data.document, newUpdate);
        console.log(`Loaded document "${data.documentName}" from API`);
        return data.document;
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

        mutateUpdateStates(
            document,
            (oldValue) => ({
                no_of_updates: (oldValue?.no_of_updates ?? 0) + 1,
                last_updated: new Date().getTime(),
            }),
        );
    },
})

// Remove a document from hocuspocus and s3
export async function removeDocument(name: string) {
    // Unload document from memory
    const doc = hocuspocusServer.documents.get(name);
    if (doc) {
        doc.connections.forEach(({ connection }) => {
            connection.close({
                code: 4205,
                reason: "Reset Connection",
            });
            connection.webSocket.close();
        });
        doc.destroy();
        await hocuspocusServer.unloadDocument(doc);
    }

    // Delete document from persistent storage
    s3Extension.deleteObject(name);
}

// Get a document from hocuspocus or s3
export async function getDocument(name: string) {
    const doc = hocuspocusServer.documents.get(name)
    if (doc) {
        return doc;
    }
    const s3Doc = new Y.Doc();

    const fetched = await s3Extension.configuration.fetch({
        documentName: name,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!fetched) {
        return undefined;
    }

    Y.applyUpdate(s3Doc, fetched);
    return s3Doc;
}

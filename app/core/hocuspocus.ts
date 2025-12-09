import * as Y from 'yjs'
import { Connection, Hocuspocus, type Extension } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger';
import { S3 } from '@hocuspocus/extension-s3';
import { slateNodesToInsertDelta } from '@slate-yjs/core';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

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
            throw new Error("Token must be valid!");
        }

        // TODO: Update permissions from user group and pass permission function
        const id = tokenData['cognito:username'];
        const groups = tokenData['cognito:groups'];
        if (!groups || !(groups.includes('curator') || groups.includes('reviewer'))) {
            throw new Error("Only curators/reviewers can edit documents");
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
            console.log(`Loaded document "${data.documentName}" from s3`);
            Y.applyUpdate(data.document, update);
            return data.document;
        }

        const { id } = data.context.document;
        const url = `${env.API_ENDPOINT}/v2/reports/${id}/versions/v1.0`;
        const authorization = `Bearer ${data.context.user.token}`;
        const response = await fetch(
            url,
            {
                headers: new Headers({
                    'Authorization': authorization,
                    'Accept': 'application/json',
                }),
            }
        );
        const responseContent = await response.json() as {
            versions: {
                version: string;
                document: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    decadal_survey: any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    detailed_assessment: any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    missions_phase_c: any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    resources: any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    synopsis: any;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    training_resources: any;
                }
            }[];
        };
        const latestVersionDocument = responseContent.versions.find((item) => item.version === 'v1.0');
        if (!latestVersionDocument) {
            throw Error('Document versioned v1.0 not found');
        }

        console.log(`Loaded document "${data.documentName}" from API`);

        // TODO: Create a from and to transformer
        // TODO: Handle other types
        const documentContent = {
            decadal_survey: latestVersionDocument.document.decadal_survey?.children,
            detailed_assessment: latestVersionDocument.document.detailed_assessment?.children,
            missions_phase_c: latestVersionDocument.document.missions_phase_c?.children,
            resources: latestVersionDocument.document.resources?.children,
            synopsis: latestVersionDocument.document.synopsis?.children,
            training_resources: latestVersionDocument.document.training_resources?.children,
        };

        // TODO: Add __update_states__

        Object.entries(documentContent).forEach(([key, value]) => {
            if (!value || value.length <= 0) {
                return;
            }
            const yXmlText = data.document.get(key, Y.XmlText);
            const delta = slateNodesToInsertDelta(value);
            yXmlText.applyDelta(delta);
        });

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

        document.transact(() => {
            const state = document.getMap('__update_states__');

            const previous_no_of_updates = state.get('no_of_updates') as (number | undefined) ?? 0;
            state.set('no_of_updates', previous_no_of_updates + 1);

            state.set('last_updated', new Date().getTime());
        });
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

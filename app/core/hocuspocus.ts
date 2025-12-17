import * as Y from 'yjs'
import { Connection, Hocuspocus, type Extension } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger';
import { S3 } from '@hocuspocus/extension-s3';

import {
    fetchReport,
    slateReportToDoc,
    changeReportUpdateStates,
} from '../utils/report.ts';
import { verifyJwt } from '../utils/jwt.ts';
import { validateDocName } from '../utils/doc.ts';
import env from '../utils/env.ts';
import { NotFoundError } from '../utils/error.ts';

// Configure hocuspocus extentions
const s3Extension = new S3({
    bucket: env.S3_BUCKET,
    region: env.AWS_DEFAULT_REGION,
    endpoint: env.AWS_RESOURCES_ENDPOINT,
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
        const docInfo = validateDocName(documentName);

        if (docInfo instanceof Error) {
            // NOTE: Throwing exception so that connection is not established
            throw docInfo;
        }

        return {
            ...context,
            doc: docInfo,
        };
    },
    onAuthenticate: async (data) => {
        // NOTE: onAuthenticate will only be called if user supplied a "token"
        // TODO: check what happens if no token is sent?
        const { token, context } = data;

        const tokenData = await verifyJwt(
            token,
            env.WEB_COGNITO_USER_POOL_ID,
            env.WEB_COGNITO_USER_POOL_CLIENT_ID,
            env.COGNITO_ISSUER,
        );

        if (tokenData instanceof Error) {
            // NOTE: Throwing exception so that authenitcation fails
            throw Error("Token must be valid!");
        }

        // TODO: Update permissions from user group and pass permission function
        const id = tokenData['cognito:username'];
        const groups = tokenData['cognito:groups'];
        if (!groups || !(groups.includes('curator') || groups.includes('reviewer'))) {
            // NOTE: Throwing exception so that authenitcation fails
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
        const updateFromS3 = await s3Extension.configuration.fetch(data);
        if (updateFromS3 !== null) {
            Y.applyUpdate(data.document, updateFromS3);
            console.debug(`Loaded document "${data.documentName}" from s3`);
            return data.document;
        }

        // NOTE: This means we are creating a direct connection.
        // In this case, we should not load data from API
        if (!data.context || !data.context.user) {
            // NOTE: Throwing exception so that empty document is not created
            throw Error(`Could not load document "${data.documentName}" from s3`);
        }

        // NOTE: If document not in S3, get from server
        const { token } = data.context.user;
        const { id } = data.context.doc;
        const reportV1 = await fetchReport(id, token);

        if (reportV1 instanceof Error) {
            // NOTE: Throwing exception so that empty document is not created
            throw reportV1;
        }

        const reportDoc = new Y.Doc();
        slateReportToDoc(reportV1, reportDoc);
        console.debug(`Loaded document "${data.documentName}" from API`);
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
            changeReportUpdateStates(
                document,
                (oldValue) => ({
                    no_of_updates: (oldValue?.no_of_updates ?? 0) + 1,
                    last_updated: new Date().getTime(),
                }),
            );
        });
    },
})

// Get a document from hocuspocus or s3
export async function getDoc(name: string) {
    const doc = hocuspocusServer.documents.get(name)
    if (doc) {
        return doc;
    }

    const s3Doc = new Y.Doc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetched = await s3Extension.configuration.fetch({ documentName: name, } as any);
    if (!fetched) {
        return new NotFoundError('Document not found');
    }

    Y.applyUpdate(s3Doc, fetched);
    return s3Doc;
}

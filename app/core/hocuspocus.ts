import * as Y from 'yjs';
import {
    type Configuration,
    type Connection,
    type Extension,
    type onAuthenticatePayload,
    type onConnectPayload,
    type onLoadDocumentPayload,
    type beforeHandleMessagePayload,
    type onChangePayload,
    Hocuspocus,
} from '@hocuspocus/server';
import {
    type CloseEvent,
    Unauthorized,
} from '@hocuspocus/common';
import { Logger } from '@hocuspocus/extension-logger';
import { S3 } from '@hocuspocus/extension-s3';
import { type Application } from 'express-ws';

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
export const s3Extension = new S3({
    bucket: env.S3_BUCKET,
    region: env.AWS_DEFAULT_REGION,
    endpoint: env.AWS_RESOURCES_ENDPOINT,
    forcePathStyle: true,
});

const loggerExtention = new Logger();

// Get a document from hocuspocus or s3
export async function getDoc(name: string, hocuspocusServer: Hocuspocus) {
    const doc = hocuspocusServer.documents.get(name);
    if (doc) {
        return doc;
    }

    const s3Doc = new Y.Doc();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetched = await s3Extension.configuration.fetch({ documentName: name } as any);
    if (!fetched) {
        return new NotFoundError('Document not found');
    }

    Y.applyUpdate(s3Doc, fetched);
    return s3Doc;
}

async function onConnect(data: onConnectPayload) {
    const { documentName, context } = data;
    const docInfo = validateDocName(documentName);

    if (docInfo instanceof Error) {
        // NOTE: Throwing exception so that connection is not established
        const closeEvent: CloseEvent = {
            code: 9001,
            reason: 'Invalid Document Name',
        };
        throw closeEvent;
    }

    return {
        ...context,
        doc: docInfo,
    };
}

async function onAuthenticate(data: Omit<onAuthenticatePayload, 'request'>) {
    // NOTE: onAuthenticate will be with empty string if user does not supply a "token"
    const { token, context } = data;

    const tokenData = await verifyJwt(
        token,
        env.WEB_COGNITO_USER_POOL_ID,
        env.WEB_COGNITO_USER_POOL_CLIENT_ID,
        env.COGNITO_ISSUER,
        'id',
    );

    if (tokenData instanceof Error) {
        // NOTE: Throwing exception so that authenitcation fails
        throw Unauthorized;
    }

    // TODO: Update permissions from user group and pass permission function
    const id = tokenData['cognito:username'];
    const groups = tokenData['cognito:groups'];
    if (!groups || groups.length <= 0) {
        // NOTE: Throwing exception so that authenitcation fails
        throw Unauthorized;
    }

    return {
        ...context,
        user: {
            id: id as string,
            username: tokenData.preferred_username as string,
            email: tokenData.email as string,
            groups: groups as string[],
            token,
            expiresOn: tokenData.exp,
        },
    };
}

async function onLoadDocument(data: onLoadDocumentPayload) {
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
        const closeEvent: CloseEvent = {
            code: 9000,
            reason: 'Document Load Failed',
        };
        throw closeEvent;
    }

    // NOTE: If document not in S3, get from server
    const { token } = data.context.user;
    const { id } = data.context.doc;
    const reportV1 = await fetchReport(
        env.BACKEND_HOST,
        id,
        token,
    );

    if (reportV1 instanceof Error) {
        // NOTE: Throwing exception so that empty document is not created
        const closeEvent: CloseEvent = {
            code: 9000,
            reason: 'Document Load Failed',
        };
        throw closeEvent;
    }

    slateReportToDoc(reportV1, data.document);
    console.debug(`Loaded document "${data.documentName}" from API`);
    return data.document;
}

async function beforeHandleMessage(data: beforeHandleMessagePayload) {
    const { context } = data;

    const now = new Date().getTime();
    const gracePeriod = 10 * 60; // 10 seconds

    // Before handling a message, check if the user token has expired
    if ((context.user.expiresOn + gracePeriod) * 1000 <= now) {
        throw Unauthorized;
    }
    return context;
}

async function onChange(data: onChangePayload) {
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
            oldValue => ({
                no_of_updates: (oldValue?.no_of_updates ?? 0) + 1,
                last_updated: new Date().getTime(),
            }),
        );
    });
}

export function registerHocuspocus(app: Application, otherConfig?: Partial<Configuration>) {
    // Configure hocuspocus server
    const hocuspocusServer = new Hocuspocus({
        extensions: [
            s3Extension satisfies Extension,
            loggerExtention satisfies Extension,
        ],
        onConnect,
        onAuthenticate,
        onTokenSync: onAuthenticate,
        onLoadDocument,
        beforeHandleMessage,
        onChange,
        ...otherConfig,
    });

    // NOTE: We are attaching hocuspocus so that we can access this later
    app.locals.hocuspocus = hocuspocusServer;

    app.ws('/collaboration/', (websocket, request) => {
        hocuspocusServer.handleConnection(websocket, request);
    });

    return hocuspocusServer;
}

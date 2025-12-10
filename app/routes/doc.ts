import * as Y from 'yjs'
import {
    Controller,
    Route,
    Get,
    Put,
    Security,
    Tags,
    Path,
    Request,
} from "tsoa";
import express from 'express';

import { validateDocName } from '../utils/doc.ts';
import { hocuspocusServer, getDoc } from '../core/hocuspocus.ts';
import {
    clearYjsReport,
    docToSlateReport,
    slateReportToDoc,
    fetchReport,
    type Report,
} from '../utils/report.ts';

/**
 * Represents the updates of the document regarding updates
 */
interface DocResetResponse {
    docName: string;
}

@Tags("Documents")
@Route("/documents/")
export class DocController extends Controller {
     /**
     * Reset the document.
     */
    @Put("/{name}/reset")
    @Security("jwt", ["write"])
    public async resetDoc(
        @Path() name: string,
        @Request() request: express.Request & { user: { token: string } },
    ): Promise<DocResetResponse> {
        const { id } = validateDocName(name);
        const reportV1 = await fetchReport(id, request.user.token);
        // TODO: set last_updated and no_of_updates
        const reportDoc = slateReportToDoc(reportV1.document);
        const reportUpdate = Y.encodeStateAsUpdate(reportDoc);

        const connection = await hocuspocusServer.openDirectConnection(name);
        const connectionDoc = connection.document;

        if (connectionDoc) {
            connectionDoc.transact(() => {
                clearYjsReport(connectionDoc);
                // Applying data from API
                Y.applyUpdate(connectionDoc, reportUpdate);
            });
        }
        await connection.disconnect();

        return {
            docName: name,
        };
    }

     /**
     * Returns the content of the document as slate's data model.
     */
    @Get("/{name}")
    @Security("jwt", ["read"])
    public async getDoc(
        @Path() name: string,
    ): Promise<Report> {
        validateDocName(name);

        const doc = await getDoc(name);
        if (!doc) {
            this.setStatus(404);
            throw Error('Document not found');
        }
        return docToSlateReport(doc);
    }
}

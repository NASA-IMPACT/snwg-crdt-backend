import {
    Controller,
    Route,
    Get,
    Put,
    Security,
    Tags,
    Path,
    Request,
    ValidateError,
} from "tsoa";
import express from 'express';

import { validateDocName } from '../utils/doc.ts';
import { hocuspocusServer, getDoc } from '../core/hocuspocus.ts';
import {
    clearYjsReport,
    docToSlateReport,
    slateReportToDoc,
    fetchReport,
    type CollabReportContent,
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
        const  docInfo = validateDocName(name);
        if (docInfo instanceof Error) {
            // NOTE: Express error handler handles ValidateError
            throw new ValidateError(
                { name: { message: docInfo.message, value: name  } },
                'Validation Failed',
            )
        }

        const { id } = docInfo;

        const reportV1 = await fetchReport(id, request.user.token);
        if (reportV1 instanceof Error) {
            // NOTE: Express error handler handles Error
            throw reportV1;
        }

        const connection = await hocuspocusServer.openDirectConnection(name);
        const connectionDoc = connection.document;

        if (connectionDoc) {
            connectionDoc.transact(() => {
                clearYjsReport(connectionDoc);
                // Applying data from API
                slateReportToDoc(reportV1, connectionDoc);
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
    ): Promise<CollabReportContent> {
        const docInfo = validateDocName(name);
        if (docInfo instanceof Error) {
            // NOTE: Express error handler handles ValidateError
            throw new ValidateError(
                { name: { message: docInfo.message, value: name  } },
                'Validation Failed',
            )
        }

        const doc = await getDoc(name);
        if (doc instanceof Error) {
            throw doc;
        }
        return docToSlateReport(doc);
    }
}

import {
    Controller,
    Route,
    Get,
    Post,
    Delete,
    Security,
    Tags,
    Path,
} from "tsoa";

import { hocuspocusServer, getDocument, removeDocument } from '../core/hocuspocus.ts';
import {
    docToSlateRepresentation,
    mutateUpdateStates,
    type Document,
    type UnixTimestamp,
} from '../core/document.ts';

/**
 * Represents the updates of the document regarding updates
 */
interface DocumentDeleteResponse {
    documentName: string;
}

/**
 * Represents the updates of the document regarding updates
 */
interface DocumentResetUpdateStatesResponse {
    documentName: string;
    lastUpdated?: UnixTimestamp;
    /**
     * @isInt
     */
    noOfUpdates?: number;
}

@Tags("Documents")
@Route("/documents/")
export class DocumentController extends Controller {
     /**
     * Delete the document.
     */
    @Delete("/{name}")
    @Security("jwt", ["write"])
    public async deleteDocument(
        @Path() name: string,
    ): Promise<DocumentDeleteResponse> {
        removeDocument(name);
        return {
            documentName: name,
        };
    }

     /**
     * Reset the document update information.
     */
    @Post("/{name}/reset-update-states")
    @Security("jwt", ["write"])
    public async resetDocument(
        @Path() name: string,
    ): Promise<DocumentResetUpdateStatesResponse> {
        const updateStates = {
            last_updated: new Date().getTime(),
            no_of_updates: 0,
        };

        const connection = await hocuspocusServer.openDirectConnection(name);
        mutateUpdateStates(connection, () => updateStates)
        await connection.disconnect();

        return {
            documentName: name,
            lastUpdated: updateStates.last_updated,
            noOfUpdates: updateStates.no_of_updates,
        };
    }

     /**
     * Returns the content of the document as slate's data model.
     */
    @Get("/{name}")
    @Security("jwt", ["read"])
    public async getDocument(
        @Path() name: string,
    ): Promise<Document> {
        const document = await getDocument(name);
        if (!document) {
            this.setStatus(404);
            throw new Error('Document not found');
        }
        return docToSlateRepresentation(document);
    }
}

import {
    Controller,
    Route,
    Get,
    Post,
    Security,
    Tags,
    Path,
} from "tsoa";
import * as Y from 'yjs'
import { yTextToSlateElement } from '@slate-yjs/core';

import { hocuspocusServer, getDocument } from '../core/hocuspocus.ts';

/**
 * Unix timestamp in seconds
 * @isLong
 */
type UnixTimestamp = number;

/**
 * Represents the updates of the document regarding updates
 */
interface DocumentResetInfo {
    documentName?: string;
    lastUpdated?: UnixTimestamp;
    /**
     * @isInt
     */
    noOfUpdates?: number;
}


/**
 * Represents the status of the document regarding updates
 */
interface DocumentUpdateStates {
    last_updated?: UnixTimestamp;
    /**
     * @isInt
     */
    no_of_updates?: number;
}

// FIXME: Use actual slate.Element
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SlateElement = Record<string, any>;

/**
 * Represents the document data in slate's data model
 */
interface Document {
    __update_states__?: DocumentUpdateStates | null,
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
}

@Tags("Documents")
@Route("/documents/")
export class DocumentController extends Controller {
     /**
     * Reset the document update information.
     */
    @Post("/{name}/reset")
    @Security("jwt", ["write"])
    public async resetDocument(
        @Path() name: string,
    ): Promise<DocumentResetInfo> {
        const lastUpdated = new Date().getTime();
        const noOfUpdates = 0;

        const connection = await hocuspocusServer.openDirectConnection(name);
        connection.transact((document) => {
            const state = document.getMap('__update_states__')
            state.set('last_updated', lastUpdated);
            state.set('no_of_updates', noOfUpdates);
        });
        await connection.disconnect();

        return {
            documentName: name,
            lastUpdated,
            noOfUpdates,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const schema: Record<keyof Document, any> = {
            __update_states__: Y.Map,
            decadal_survey: Y.XmlText,
            detailed_assessment: Y.XmlText,
            missions_phase_c: Y.XmlText,
            resources: Y.XmlText,
            synopsis: Y.XmlText,
            training_resources: Y.XmlText,
        };

        const data: Document = {}
        Object.entries(schema).forEach(([key, type]) => {
            const safeKey = key as (keyof Document);
            const value = document.get(key, type);
            if (type == Y.XmlText) {
                const val = yTextToSlateElement(value)
                data[safeKey] = val;
            } else if (type == Y.Map) {
                data[safeKey] = value.toJSON();
            } else {
                data[safeKey] = null;
            }
        });

        return data;
    }
}

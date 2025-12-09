import * as Y from 'yjs'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core';

import env from '../utils/env.ts';
import { DirectConnection } from '@hocuspocus/server';

// FIXME: move this to utils

/**
 * Unix timestamp in seconds
 * @isLong
 */
export type UnixTimestamp = number;

// TODO: Use actual slate.Element
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SlateElement = Record<string, any>;

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

/**
 * Represents the document data in slate's data model
 */
export interface Document {
    __update_states__?: DocumentUpdateStates | null,
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
}

export function docToSlateRepresentation(doc: Y.Doc) {
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

    const slateDoc: Document = {}
    Object.entries(schema).forEach(([key, type]) => {
        const safeKey = key as (keyof Document);
        const value = doc.get(key, type);
        if (type == Y.XmlText) {
            const val = yTextToSlateElement(value)
            slateDoc[safeKey] = val;
        } else if (type == Y.Map) {
            slateDoc[safeKey] = value.toJSON();
        } else {
            slateDoc[safeKey] = null;
        }
    });

    return slateDoc;
}

export function docToYjsRepresentation(doc: Document) {
    // TODO: Create a from and to transformer
    // TODO: Handle other types
    const documentContent = {
        decadal_survey: { type: Y.XmlText, value: doc.decadal_survey?.children },
        detailed_assessment: { type: Y.XmlText, value: doc.detailed_assessment?.children },
        missions_phase_c: { type: Y.XmlText, value: doc.missions_phase_c?.children },
        resources: { type: Y.XmlText, value: doc.resources?.children },
        synopsis: { type: Y.XmlText, value: doc.synopsis?.children },
        training_resources: { type: Y.XmlText, value: doc.training_resources?.children },
    };

    const newDoc = new Y.Doc();

    // TODO: Add __update_states__
    Object.entries(documentContent).forEach(([key, content]) => {
        const { type, value } = content;
        if (!value || value.length <= 0) {
            return;
        }
        const yElement = newDoc.get(key, type);
        const delta = slateNodesToInsertDelta(value);
        yElement.applyDelta(delta);
    });

    return newDoc;
}

export function mutateUpdateStates(
    docOrConnection: Y.Doc | DirectConnection,
    transformer: (value: DocumentUpdateStates | null | undefined) => DocumentUpdateStates,
) {
    function mutate(doc: Y.Doc) {
        const state = doc.getMap('__update_states__');
        const stateAsJson = state.toJSON() as DocumentUpdateStates | null | undefined;
        const newStateAsJson = transformer(stateAsJson);

        Object.entries(newStateAsJson).forEach(([key, value]) => {
            state.set(key, value);
        });
    }

    if (docOrConnection instanceof Y.Doc) {
        docOrConnection.transact(() => {
            mutate(docOrConnection);
        })
    } else {
        docOrConnection.transact((document) => {
            mutate(document);
        });
    }
}

export async function fetchReport(id: number, token: string) {
    const url = `${env.API_ENDPOINT}/v2/reports/${id}/versions/v1.0`;
    const authorization = `Bearer ${token}`;
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
            document: Document;
        }[];
    };
    const latestVersionDocument = responseContent.versions.find((item) => item.version === 'v1.0');
    if (!latestVersionDocument) {
        throw Error('Document versioned v1.0 not found');
    }
    return latestVersionDocument;
}

import * as Y from 'yjs'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core';

import env from '../utils/env.ts';

import {
    type DocUpdateStatus,
    type SlateElement,
} from './doc.ts';


/**
 * Represents the report data in slate's data model
 */
export interface Report {
    __update_states__?: DocUpdateStatus | null,
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
}

export function docToSlateReport(doc: Y.Doc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<keyof Report, any> = {
        __update_states__: Y.Map,
        decadal_survey: Y.XmlText,
        detailed_assessment: Y.XmlText,
        missions_phase_c: Y.XmlText,
        resources: Y.XmlText,
        synopsis: Y.XmlText,
        training_resources: Y.XmlText,
    };

    const report: Report = {}
    Object.entries(schema).forEach(([key, type]) => {
        const safeKey = key as (keyof Report);
        const value = doc.get(key, type);
        if (type == Y.XmlText) {
            const val = yTextToSlateElement(value)
            report[safeKey] = val;
        } else if (type == Y.Map) {
            report[safeKey] = value.toJSON();
        } else {
            report[safeKey] = null;
        }
    });

    return report;
}

export function slateReportToDoc(report: Report) {
    const reportContent: Record<keyof Report, {
        type: typeof Y.Map | typeof Y.XmlText,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any,
    }> = {
        __update_states__: { type: Y.Map, value: {} },
        decadal_survey: { type: Y.XmlText, value: report.decadal_survey?.children },
        detailed_assessment: { type: Y.XmlText, value: report.detailed_assessment?.children },
        missions_phase_c: { type: Y.XmlText, value: report.missions_phase_c?.children },
        resources: { type: Y.XmlText, value: report.resources?.children },
        synopsis: { type: Y.XmlText, value: report.synopsis?.children },
        training_resources: { type: Y.XmlText, value: report.training_resources?.children },
    };

    const doc = new Y.Doc();

    Object.entries(reportContent).forEach(([key, content]) => {
        const { type, value } = content;
        if (!value || value.length <= 0) {
            return;
        }
        const yElement = doc.get(key, type);
        if (yElement instanceof Y.XmlText) {
            const delta = slateNodesToInsertDelta(value);
            yElement.applyDelta(delta);
        } else {
            for (const [key, val] of Object.entries(value)) {
                yElement.set(key, val);
            }
        }
    });

    return doc;
}

export function clearYjsReport(doc: Y.Doc) {
    const schema: Record<keyof Report, typeof Y.Map | typeof Y.XmlText> = {
        __update_states__: Y.Map,
        decadal_survey: Y.XmlText,
        detailed_assessment: Y.XmlText,
        missions_phase_c: Y.XmlText,
        resources: Y.XmlText,
        synopsis: Y.XmlText,
        training_resources: Y.XmlText,
    };

    Object.entries(schema).forEach(([key, type]) => {
        const yElement = doc.get(key, type)
        if (yElement instanceof Y.XmlText) {
            yElement.delete(0, yElement.length);
        } else {
            yElement.clear();
        }
    });
}

export function changeYjsReportUpdateStates(
    doc: Y.Doc,
    transformer: (value: DocUpdateStatus | null | undefined) => DocUpdateStatus,
) {
    const state = doc.getMap('__update_states__');
    const stateAsJson = state.toJSON() as DocUpdateStatus | null | undefined;
    const newStateAsJson = transformer(stateAsJson);
    Object.entries(newStateAsJson).forEach(([key, value]) => {
        state.set(key, value);
    });
}

/** 
 * @throws {Error}
 */
export async function fetchReport(reportId: number, authToken: string) {
    const url = `${env.API_ENDPOINT}/v2/reports/${reportId}/versions/v1.0`;
    const authorization = `Bearer ${authToken}`;
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
            document: Report;
        }[];
    };
    const reportV1 = responseContent.versions.find((item) => item.version === 'v1.0');
    if (!reportV1) {
        throw Error('Report with version v1.0 not found');
    }
    return reportV1;
}

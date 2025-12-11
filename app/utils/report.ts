import * as Y from 'yjs'
import { slateNodesToInsertDelta, yTextToSlateElement } from '@slate-yjs/core';

import env from '../utils/env.ts';

import {
    type DocUpdateStatus,
    type SlateElement,
} from './doc.ts';
import { AuthError, NotFoundError } from './error.ts';

type Completeness = "complete" | "incomplete";

/**
 * Represents the section completeness of the report
 */
export interface ReportSectionCompleteness {
    synopsis?: Completeness;
    assessment_response?: Completeness;
    summary_sensors_products?: Completeness;
    training_resources?: Completeness;
}

/**
 * Represents the report content
 */
interface PureReportContent {
    __update_states__?: DocUpdateStatus | null,
    sections_completed?: ReportSectionCompleteness | null,
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
}

/**
 * Represents the report
 */
export interface Report {
    version: string;
    document: PureReportContent;
    last_updated_at: string;
    sections_completed: ReportSectionCompleteness;
}

/**
 * Represents the report content with additional metadata
 */
export interface CollabReportContent extends PureReportContent {
    __update_states__?: DocUpdateStatus | null,
    sections_completed?: ReportSectionCompleteness | null,
}

export function docToSlateReport(doc: Y.Doc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schema: Record<keyof CollabReportContent, any> = {
        __update_states__: Y.Map,
        sections_completed: Y.Map<Completeness>,
        decadal_survey: Y.XmlText,
        detailed_assessment: Y.XmlText,
        missions_phase_c: Y.XmlText,
        resources: Y.XmlText,
        synopsis: Y.XmlText,
        training_resources: Y.XmlText,
    };

    const report: CollabReportContent = {}
    Object.entries(schema).forEach(([key, type]) => {
        const safeKey = key as (keyof CollabReportContent);
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

export function slateReportToDoc(report: Report, doc: Y.Doc) {
    type ReportContent =  Record<keyof CollabReportContent, {
        type: typeof Y.Map | typeof Y.XmlText,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: any,
    }>


    const {
        document,
        last_updated_at,
        sections_completed,
    } = report;

    const reportContent: ReportContent = {
        __update_states__: {
            type: Y.Map,
            value: {
                no_of_updates: 0,
                last_updated: new Date(last_updated_at).getTime(),
            },
        },
        sections_completed: {
            type: Y.Map,
            value: {
                synopsis: sections_completed.synopsis ?? 'incomplete',
                assessment_response: sections_completed.assessment_response ?? 'incomplete',
                summary_sensors_products: sections_completed.summary_sensors_products ?? 'incomplete',
                training_resources: sections_completed.training_resources ?? 'incomplete',
            }
        },
        decadal_survey: {
            type: Y.XmlText,
            value: document.decadal_survey?.children ?? [],
        },
        detailed_assessment: {
            type: Y.XmlText,
            value: document.detailed_assessment?.children ?? [],
        },
        missions_phase_c: {
            type: Y.XmlText,
            value: document.missions_phase_c?.children ?? [],
        },
        resources: {
            type: Y.XmlText,
            value: document.resources?.children ?? [],
        },
        synopsis: {
            type: Y.XmlText,
            value: document.synopsis?.children ?? [],
        },
        training_resources: {
            type: Y.XmlText,
            value: document.training_resources?.children ?? [],
        },
    };

    // const doc = new Y.Doc();
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
    const schema: Record<keyof CollabReportContent, typeof Y.Map | typeof Y.XmlText> = {
        __update_states__: Y.Map,
        sections_completed: Y.Map,
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

export async function fetchReport(reportId: number, authToken: string) {
    const url = `${env.API_ENDPOINT}/v2/reports/${reportId}/versions/v1.0`;
    const authorization = `Bearer ${authToken}`;

    let response;
    try {
        response = await fetch(
            url,
            {
                headers: new Headers({
                    'Authorization': authorization,
                    'Accept': 'application/json',
                }),
            }
        );
        if (!response.ok) {
            if (response.status === 404) {
                return new NotFoundError('Report not found');
            } else if (response.status === 401 || response.status === 403) {
                return new AuthError('Could not fetch report', response.status);
            }
            return Error('Could not fetch report');
        }
    } catch (error) {
        // FIXME: We should check if we want to sanitize the message
        if (error instanceof Error) {
            return error;
        }
        return Error('Could not fetch report');
    }

    let responseContent;
    try {
        responseContent = await response.json() as {
            versions: Report[];
        };
    } catch (error) {
        // FIXME: We should check if we want to sanitize the message
        if (error instanceof Error) {
            return error;
        }
        return Error('Could not parse report as JSON');
    }

    const reportV1 = responseContent.versions.find((item) => item.version === 'v1.0');
    if (!reportV1) {
        return Error('Report with version v1.0 not found');
    }
    return reportV1;
}

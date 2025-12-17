import * as Y from 'yjs'

import env from '../utils/env.ts';

import { type SlateElement } from './doc.ts';
import { AuthError, NotFoundError } from './error.ts';
import { clearDoc, initDoc, SDoc, GetTypeFromSchema, transformDoc, RecursiveNullable } from './schema.ts';

interface Mission {
    mission_id: string;
    instrument_ids?: string[] | null;
}

interface ReportContent {
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
    summary_satellite_sensors?: SlateElement | null, // NOTE: Seems to be deprecated

    // department?: string, // FIXME: How is this set

    cmr_products?: string[] | null,
    snwg_products?: number[] | null,
    summary_proposed_activities?: number[] | null,
    commercial_products?: number[] | null,

    missions_selected?: Mission[] | null,
    upcoming_missions_selected?: Mission[] | null,
}

type Completeness = "complete" | "incomplete";

interface ReportSectionCompleteness {
    department?: Completeness | null; // NOTE: Seems to be deprecated
    synopsis?: Completeness | null;
    assessment_response?: Completeness | null;
    summary_sensors_products?: Completeness | null;
    training_resources?: Completeness | null;
}

interface Report {
    version: string;
    document: ReportContent;
    last_updated_at: string;
    sections_completed: ReportSectionCompleteness;
}

export const schema = {
    type: Y.Doc,
    fields: {
        __update_states__: {
            type: Y.Map,
            fields: {
                last_updated: 'number',
                no_of_updates: 'number',
            }
        },
        sections_completed: {
            type: Y.Map,
            fields: {
                department: 'string',
                synopsis: 'string',
                assessment_response: 'string',
                summary_sensors_products: 'string',
                training_resources: 'string',
            },
        },
        decadal_survey: { type: Y.XmlText },
        detailed_assessment: { type: Y.XmlText },
        missions_phase_c: { type: Y.XmlText },
        resources: { type: Y.XmlText },
        synopsis: { type: Y.XmlText },
        training_resources: { type: Y.XmlText },
        summary_satellite_sensors: { type: Y.XmlText },

        cmr_products: {
            type: Y.Array,
            member: 'string',
        },
        snwg_products: {
            type: Y.Array,
            member: 'number',
        },
        summary_proposed_activities: {
            type: Y.Array,
            member: 'number',
        },
        commercial_products: {
            type: Y.Array,
            member: 'number',
        },

        missions_selected: {
            type: Y.Array,
            member: {
                type: Y.Map,
                fields: {
                    mission_id: 'string',
                    instrument_ids: {
                        type: Y.Array,
                        member: 'string',
                    }
                }
            }
        },
        upcoming_missions_selected: {
            type: Y.Array,
            member: {
                type: Y.Map,
                fields: {
                    mission_id: 'string',
                    instrument_ids: {
                        type: Y.Array,
                        member: 'string',
                    }
                }
            }
        },
    },
} satisfies SDoc;

export function transformReport(doc: Y.Doc) {
    type CollabReport = RecursiveNullable<GetTypeFromSchema<typeof schema>>
    return transformDoc(doc, schema) as CollabReport;
}

export function slateReportToDoc(report: Report, doc: Y.Doc) {
    const {
        document,
        last_updated_at,
        sections_completed,
    } = report;

    type Data = GetTypeFromSchema<typeof schema>;
    const data: Data = {
        __update_states__: {
            no_of_updates: 0,
            last_updated: new Date(last_updated_at).getTime(),
        },
        sections_completed: {
            department: sections_completed.department ?? 'incomplete',
            synopsis: sections_completed.synopsis ?? 'incomplete',
            assessment_response: sections_completed.assessment_response ?? 'incomplete',
            summary_sensors_products: sections_completed.summary_sensors_products ?? 'incomplete',
            training_resources: sections_completed.training_resources ?? 'incomplete',
        },
        decadal_survey: document.decadal_survey?.children ?? [],
        detailed_assessment: document.detailed_assessment?.children ?? [],
        missions_phase_c: document.missions_phase_c?.children ?? [],
        resources: document.resources?.children ?? [],
        synopsis: document.synopsis?.children ?? [],
        training_resources: document.training_resources?.children ?? [],
        summary_satellite_sensors: document.training_resources?.children ?? [],

        cmr_products: document.cmr_products ?? [],
        snwg_products: document.snwg_products ?? [],
        summary_proposed_activities: document.summary_proposed_activities ?? [],
        commercial_products: document.commercial_products ?? [],

        missions_selected: document.missions_selected?.map((mission) => ({
            mission_id: mission.mission_id,
            instrument_ids: mission.instrument_ids ?? [],
        })) ?? [],
        upcoming_missions_selected: document.upcoming_missions_selected?.map((mission) => ({
            mission_id: mission.mission_id,
            instrument_ids: mission.instrument_ids ?? [],
        })) ?? [],
    };

    initDoc(doc, schema, data);
    return doc;
}

export function clearReport(doc: Y.Doc) {
    clearDoc(doc, schema);
}


interface DocUpdateStatus {
    last_updated?: number;
    no_of_updates?: number;
}

export function changeReportUpdateStates(
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
    const url = `${env.BACKEND_HOST}/v2/reports/${reportId}/versions/v1.0`;
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

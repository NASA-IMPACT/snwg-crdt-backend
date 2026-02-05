import * as Y from 'yjs'
import {
    expect,
    test,
    describe,
    vi,
} from 'vitest'

import {
    slateReportToDoc,
    clearReport,
    changeReportUpdateStates,
    transformReport,
    fetchReport,
} from './report.ts';
import { AuthError, NotFoundError } from './error.ts';
import { removeNull } from './common.ts';
import { report, reportFromBackend } from '../../assets/report.ts';

describe('initialize yjs report', () => {
    test('should initialize all data', () => {
        const doc = new Y.Doc();
        const updatedDoc = slateReportToDoc(report, doc);

        expect(updatedDoc.getMap('__update_states__').size).toBeGreaterThan(0)
        expect(updatedDoc.getMap('sections_completed').size).toBeGreaterThan(0)

        expect(updatedDoc.get('decadal_survey', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('detailed_assessment', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('missions_phase_c', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('resources', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('synopsis', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('training_resources', Y.XmlText).toString().length).toBeGreaterThan(0)
        expect(updatedDoc.get('summary_satellite_sensors', Y.XmlText).toString().length).toBe(0)

        expect(updatedDoc.getArray('cmr_products').length).toBeGreaterThan(0)
        expect(updatedDoc.getArray('snwg_products').length).toBeGreaterThan(0)
        expect(updatedDoc.getArray('summary_proposed_activities').length).toBeGreaterThan(0)
        expect(updatedDoc.getArray('commercial_products').length).toBeGreaterThan(0)
        expect(updatedDoc.getArray('missions_selected').length).toBeGreaterThan(0)
        expect(updatedDoc.getArray('upcoming_missions_selected').length).toBeGreaterThan(0)
    });
});

describe('mutate yjs report', () => {
    test ('should update report status', () => {
        const doc = new Y.Doc();
        const updatedDoc = slateReportToDoc(report, doc);

        const last_updated = new Date().getTime();
        const no_of_updates = 999999;

        updatedDoc.transact(() => {
            changeReportUpdateStates(
                updatedDoc,
                () => ({
                    no_of_updates,
                    last_updated,
                }),
            );
        });
        expect(updatedDoc.getMap('__update_states__').size).toBeGreaterThan(0)
        expect(updatedDoc.getMap('__update_states__').get('no_of_updates')).toBe(no_of_updates)
        expect(updatedDoc.getMap('__update_states__').get('last_updated')).toBe(last_updated)

        // TODO: Add a test that this should not change other fields
    })

    test('should clear all data', () => {
        const doc = new Y.Doc();
        const updatedDoc = slateReportToDoc(report, doc);

        clearReport(updatedDoc);

        expect(updatedDoc.getMap('__update_states__').size).toBe(0)
        expect(updatedDoc.getMap('sections_completed').size).toBe(0)

        expect(updatedDoc.get('decadal_survey', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('detailed_assessment', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('missions_phase_c', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('resources', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('synopsis', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('training_resources', Y.XmlText).toString().length).toBe(0)
        expect(updatedDoc.get('summary_satellite_sensors', Y.XmlText).toString().length).toBe(0)

        expect(updatedDoc.getArray('cmr_products').length).toBe(0)
        expect(updatedDoc.getArray('snwg_products').length).toBe(0)
        expect(updatedDoc.getArray('summary_proposed_activities').length).toBe(0)
        expect(updatedDoc.getArray('commercial_products').length).toBe(0)
        expect(updatedDoc.getArray('missions_selected').length).toBe(0)
        expect(updatedDoc.getArray('upcoming_missions_selected').length).toBe(0)
    });
});

describe('export yjs report', () => {
    test('should preserve all data', () => {
        const doc = new Y.Doc();
        const updatedDoc = slateReportToDoc(report, doc);
        const response = transformReport(updatedDoc);

        const expected = removeNull({
            ...report.document,
            sections_completed: report.sections_completed,
            // NOTE: these are not included by the transformer
            department: undefined,
            department_abvr: undefined,
            thematic_area: undefined,
            // NOTE: no_of_updates shoudl be empty during initialization
            __update_states__: {
                last_updated: new Date(report.last_updated_at).getTime(),
                no_of_updates: 0,
            },
            // NOTE: this is not sent by the client anymore but adding a default value just in case
            summary_satellite_sensors: {
                "children": [
                    {
                        type: "p",
                        children: [
                            {
                                "text": "",
                            },
                        ],
                    },
                ],
            },
        }, [], ["id"])

        expect(response).toStrictEqual(expected);
    });
});

describe('fetchReport', () => {
    const backendUrl = 'http://localhost:8000';
    const reportId = 492;
    const authToken = 'test-auth-token';

    test('returns report v1.0 when request succeeds', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValueOnce(reportFromBackend),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);

        // Check mock works
        expect(result).toEqual(reportFromBackend.versions[0]);

        // Check fetch was actually called
        expect(fetch).toHaveBeenCalledWith(
            `${backendUrl}/v2/reports/${reportId}/versions/v1.0`,
            expect.objectContaining({
                headers: expect.any(Headers),
            })
        );
    });

    test('handles scenario with report but no v1.0', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValueOnce({
                    ...reportFromBackend,
                    versions: [
                        {
                            ...reportFromBackend.versions[0],
                            version: 'v2.0',
                        }
                    ]
                }),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe('Report with version v1.0 not found');
    });

    test('handles 401 error', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: vi.fn().mockResolvedValueOnce(reportFromBackend),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(AuthError);
        expect((result as AuthError).status).toBe(401);
    });

    test('handles 403 error', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: vi.fn().mockResolvedValueOnce(reportFromBackend),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(AuthError);
        expect((result as AuthError).status).toBe(403);
    });

    test('handles 404 error', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValueOnce(reportFromBackend),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(NotFoundError);
    });

    test('handles 500 error', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValueOnce(reportFromBackend),
            })
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe("Could not fetch report");
    });

    test('handles fetch exception', async () => {
        // Mock data
        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValueOnce(new Error('Network error'))
        );

        const result = await fetchReport(backendUrl, reportId, authToken);
        expect(result).toBeInstanceOf(Error);
        expect((result as Error).message).toBe('Network error');
    });
});

import {
    Controller,
    Route,
    Get,
    Put,
    Body,
    Security,
    Tags,
    Path,
    ValidateError,
} from "tsoa";

import { validateDocName } from '../utils/doc.ts';
import { hocuspocusServer, getDoc } from '../core/hocuspocus.ts';
import {
    clearReport,
    transformReport,
    slateReportToDoc,
    type Report,
} from '../utils/report.ts';
import { type SlateElement } from '../utils/doc.ts';

interface DocResetResponse {
    docName: string;
}

/**
 * Represents the unix timestamp in milliseconds
 * @isLong
 */
type UnixTimestamp = number;

interface DocGetResponse {
    __update_states__?: {
        last_updated?: UnixTimestamp | null;
        no_of_updates?: number | null;
    } | null,
    sections_completed?: {
        department?: string | null,
        synopsis?: string | null,
        assessment_response?: string | null,
        summary_sensors_products?: string | null,
        training_resources?: string | null,
    } | null,
    decadal_survey?: SlateElement | null,
    detailed_assessment?: SlateElement | null,
    missions_phase_c?: SlateElement | null,
    resources?: SlateElement | null,
    synopsis?: SlateElement | null,
    training_resources?: SlateElement | null,
    summary_satellite_sensors?: SlateElement | null,
    cmr_products?: string[] | null;
    snwg_products?: number[] | null,
    summary_proposed_activities?: number[] | null,
    commercial_products?: number[] | null,
    missions_selected?: {
        mission_id?: string | null,
        instrument_id?: string[] | null,
    }[] | null,
    upcoming_missions_selected?: {
        mission_id?: string | null,
        instrument_id?: string[] | null,
    }[] | null,
}

@Tags("Documents")
@Route("/documents/")
export class DocController extends Controller {
     /**
     * Reset the document.
     */
    @Put("/{name}/reset")
    @Security("backendAuthToken", ["document/write"])
    public async resetDoc(
        @Path() name: string,
        @Body() body: Report,
    ): Promise<DocResetResponse> {
        const  docInfo = validateDocName(name);
        if (docInfo instanceof Error) {
            // NOTE: Express error handler handles ValidateError
            throw new ValidateError(
                { name: { message: docInfo.message, value: name  } },
                'Validation Failed',
            )
        }

        // NOTE: We can ignore if it does not exist
        try {
            const connection = await hocuspocusServer.openDirectConnection(name);
            const connectionDoc = connection.document;

            if (connectionDoc) {
                connectionDoc.transact(() => {
                    clearReport(connectionDoc);
                    // Applying data from API
                    slateReportToDoc(body, connectionDoc);
                });
            }
            await connection.disconnect();
        } catch (ex) {
            console.error('Could not open/close direct connection to document', ex);
        }

        return {
            docName: name,
        };
    }

     /**
     * Returns the content of the document as slate's data model.
     */
    @Get("/{name}")
    @Security("userAuthJwt", ["document/read"])
    public async getDoc(
        @Path() name: string,
    ): Promise<DocGetResponse> {
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
        return transformReport(doc);
    }
}

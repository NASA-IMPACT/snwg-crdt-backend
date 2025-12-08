import {
    Controller,
    Route,
    Get,
    Security,
    Tags,
    Example,
} from "tsoa";

import { hocuspocusServer } from '../core/hocuspocus.ts';

/**
 * Represents the current status of the collaboration server.
 */
interface CollaborationStatus {
    /**
     * @isInt
     */
    openDocuments: number;
    /**
     * @isInt
     */
    openConnections: number;
}

@Tags("Collaboration")
@Route("/collaboration/")
export class CollaborationController extends Controller {
     /**
     * Returns the current status of the collaboration server,
     * including the number of open documents and active connections.
     */
    @Get("/status/")
    @Security("jwt", ["read"])
    @Example<CollaborationStatus>({
        openDocuments: 5,
        openConnections: 12
    })
    public async getCollaborationStatus(): Promise<CollaborationStatus> {
        return {
            openDocuments: hocuspocusServer.getDocumentsCount(),
            openConnections: hocuspocusServer.getConnectionsCount(),
        };
    }
}

import {
    Controller,
    Route,
    Get,
    Security,
    Tags,
    Example,
    Request,
} from 'tsoa';
import { type Request as ExpressRequest } from 'express';

/**
 * Represents the current status of the collaboration server.
 */
interface CollaborationStatus {
    /**
     * @isInt
     */
    openDocs: number;
    /**
     * @isInt
     */
    openConnections: number;
}

@Tags('Collaboration')
@Route('/collaboration/')
export class CollaborationController extends Controller {
    /**
     * Returns the current status of the collaboration server,
     * including the number of open documents and active connections.
     */
    @Get('/status/')
    @Security('userAuthJwt', ['status/read'])
    @Example<CollaborationStatus>({
        openDocs: 5,
        openConnections: 12,
    })
    public async getCollaborationStatus(
        @Request() request: ExpressRequest,
    ): Promise<CollaborationStatus> {
        const hocuspocusServer = request.app.locals.hocuspocus;
        return {
            openDocs: hocuspocusServer.getDocumentsCount(),
            openConnections: hocuspocusServer.getConnectionsCount(),
        };
    }
}

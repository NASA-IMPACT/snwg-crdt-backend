import {
    Controller,
    Route,
    Get,
    Tags,
    Example,
} from 'tsoa';

/**
 * Represents the system health.
 */
interface SystemHealth {
    ok: boolean;
}

@Tags('Health')
@Route('/health/')
export class HealthController extends Controller {
    /**
     * Returns the health of the collaboration server,
     */
    @Get('/')
    @Example<SystemHealth>({
        ok: true,
    })
    public async getCollaborationStatus(): Promise<SystemHealth> {
        return { ok: true };
    }
}

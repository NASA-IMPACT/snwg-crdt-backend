import 'express';
import { type Hocuspocus } from '@hocuspocus/server';

declare module 'express' {
    interface Locals {
        hocuspocus: Hocuspocus;
    }
    interface Request {
        user?: {
            id: string;
            username: string;
            email: string | undefined;
            groups: string[] | undefined;
            scope: undefined;
            token: string;
        };
    }
}

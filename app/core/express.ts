import { Response, Request, NextFunction } from 'express';

import { verifyJwt } from '../utils/jwt.ts';
import env from '../utils/env.ts';

export async function authMiddleware(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const authHeader = request.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.replace(/^Bearer /, '');

    const tokenData = await verifyJwt(
        token,
        env.COGNITO_USER_POOL_ID,
        env.COGNITO_USER_CLIENT_ID,
        env.COGNITO_ISSUER,
    );
    if (!tokenData) {
        response.status(401).json({ message: 'Invalid token' });
    } else {
        const id = tokenData['cognito:username'];
        const groups = tokenData['cognito:groups'];
        response.locals.user = {
            id: id as string,
            username: tokenData.preferred_username as string,
            email: tokenData.email as string,
            groups: groups as string[],
        };
        next();
    }
};

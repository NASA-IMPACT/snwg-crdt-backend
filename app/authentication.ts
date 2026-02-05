import express from 'express';

import { verifyJwt } from './utils/jwt.ts';
import { AuthError } from './utils/error.ts';
import env from './utils/env.ts';

export async function expressAuthentication(
    request: express.Request,
    securityName: string,
    // scopes?: string[]
) {
    if (securityName !== 'userAuthJwt' && securityName !== 'backendAuthToken') {
        // NOTE: Express error handler handles AuthError
        throw new AuthError('Security name should either be "userAuthJwt" or "backendAuthToken"', 401);
    }

    const authHeader = request.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // NOTE: Express error handler handles AuthError
        throw new AuthError('Missing or invalid Authorization header', 401);
    }

    const token = authHeader.replace(/^Bearer /, '');

    if (securityName === 'userAuthJwt') {
        const tokenData = await verifyJwt(
            token,
            env.WEB_COGNITO_USER_POOL_ID,
            env.WEB_COGNITO_USER_POOL_CLIENT_ID,
            env.COGNITO_ISSUER,
            'id');

        if (tokenData instanceof Error) {
            // NOTE: Express error handler handles AuthError
            throw new AuthError(tokenData.message, 401);
        }

        // TODO: match scope with groups
        return {
            id: tokenData['cognito:username'] as string,
            username: tokenData.preferred_username as string,
            email: tokenData.email as string,
            groups: tokenData['cognito:groups'] as string[],
            scope: undefined,
            token,
        };
    }
    else {
        if (token !== env.SERVICE_TOKEN) {
            // NOTE: Express error handler handles AuthError
            throw new AuthError('Service token is not correct', 401);
        }
        // TODO: match scope with token scope
        return {
            id: 'backend',
            username: 'backend',
            email: undefined,
            groups: undefined,
            scope: undefined,
            token,
        };
    }
}

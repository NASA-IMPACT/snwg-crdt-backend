import express from 'express';

import { verifyJwt } from './utils/jwt.ts';
import { AuthError } from './utils/error.ts';
import env from './utils/env.ts';

export async function expressAuthentication(
    request: express.Request,
    securityName: string,
    // scopes?: string[]
) {
    if (securityName !== 'jwt') {
        // NOTE: Express error handler handles AuthError
        throw new AuthError('Security name should be "jwt"', 401)
    }

    const authHeader = request.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // NOTE: Express error handler handles AuthError
        throw new AuthError('Missing or invalid Authorization header', 401)
    }

    const token = authHeader.replace(/^Bearer /, '');

    const tokenData = await verifyJwt(
        token,
        env.COGNITO_USER_POOL_ID,
        env.COGNITO_USER_CLIENT_ID,
        env.COGNITO_ISSUER);

    if (tokenData instanceof Error) {
        // NOTE: Express error handler handles AuthError
        throw new AuthError(tokenData.message, 401)
    }

    const id = tokenData['cognito:username'];
    const groups = tokenData['cognito:groups'];
    return {
        id: id as string,
        username: tokenData.preferred_username as string,
        email: tokenData.email as string,
        groups: groups as string[],
        token,
    };
}

import express from 'express';

import { verifyJwt } from './utils/jwt.ts';
import env from './utils/env.ts';

export class AuthError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message);
        this.status = status
    }
}

export async function expressAuthentication(
    request: express.Request,
    securityName: string,
    // scopes?: string[]
) {
    if (securityName !== 'jwt') {
        throw Error('Security name should be "jwt"')
    }

    const authHeader = request.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthError('Missing or invalid Authorization header', 401)
    }

    const token = authHeader.replace(/^Bearer /, '');

    const tokenData = await verifyJwt(
        token,
        env.COGNITO_USER_POOL_ID,
        env.COGNITO_USER_CLIENT_ID,
        env.COGNITO_ISSUER);
    if (!tokenData) {
        throw new AuthError('Invalid token', 401)
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

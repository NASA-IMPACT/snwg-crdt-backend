import { Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { S3 } from '@hocuspocus/extension-s3';

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_USER_CLIENT_ID;
const issuer = process.env.COGNITO_ISSUER;

if (!userPoolId) {
    throw Error('COGNITO_USER_POOL_ID should be defined.')
}
if (!clientId) {
    throw Error('COGNITO_USER_CLIENT_ID should be defined.')
}

async function verifyJwt(token: string) {
    try {
        const verifier = CognitoJwtVerifier.create({
            userPoolId: (userPoolId as string),
            overrideIssuer: issuer,
        });

        const payload = await verifier.verify(
            token,
            {
                clientId: (clientId as string),
                tokenUse: 'id',
            },
        );
        return payload;
    } catch (err) {
        console.error('Error verifying JWT:', err);
        return undefined;
    }
}

const server = Server.configure({
    port: 8001,
    extensions: [
        new S3({
            bucket: process.env.S3_BUCKET,
            region: process.env.AWS_DEFAULT_REGION,
            endpoint: process.env.S3_CUSTOM_ENDPOINT,
            forcePathStyle: true,
        }),
        new Logger()
    ],
    // NOTE: onAuthenticate will only be called if user supplied a "token"
    onAuthenticate: async (data) => {
        const { token } = data;

        // Check if token is present
        if (!token) {
            throw new Error("Token is required!");
        }

        // Check validity of cognito token
        const value = await verifyJwt(token);
        if (!value) {
            throw new Error("Token must be valid!");
        }

        // Check expiry of cognito token
        const now = new Date().getTime();
        const has_expired = now >= value.exp * 1000;
        if (has_expired) {
            throw new Error("Token has expired!");
        }

        // Check user permissions from token
        const id = value['cognito:username'];
        const groups = value['cognito:groups'];
        if (!groups || !(groups.includes('curator') || groups.includes('reviewer'))) {
            throw new Error("Only curators can edit documents");
        }

        // Define context
        const context = {
            user: {
                id,
                username: value.preferred_username,
                email: value.email,
                groups,
            },
        }
        return context;
    },
})

server.listen()

import { CognitoJwtVerifier } from 'aws-jwt-verify';

export async function verifyJwt(
    token: string,
    userPoolId: string,
    clientId: string,
    issuer: string | undefined,
    tokenUse: 'id' | 'access',
    graceSeconds = 0,
) {
    const verifier = CognitoJwtVerifier.create({
        userPoolId: (userPoolId as string),
        overrideIssuer: issuer,
        graceSeconds,
    });

    try {
        const payload = await verifier.verify(
            token,
            {
                clientId: (clientId as string),
                tokenUse,
            },
        );
        return payload;
    }
    catch (err) {
        if (err instanceof Error) {
            return err;
        }
        return Error('Failed to verify jwt');
    }
}

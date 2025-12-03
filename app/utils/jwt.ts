import { CognitoJwtVerifier } from "aws-jwt-verify";

// FIXME: Throw error instead of returning undefined
export async function verifyJwt(
    token: string,
    userPoolId: string,
    clientId: string,
    issuer: string | undefined,
) {
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


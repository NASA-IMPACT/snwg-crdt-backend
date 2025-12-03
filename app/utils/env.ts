import { cleanEnv, str, url } from "envalid";

const env = cleanEnv(process.env, {
    COGNITO_ISSUER: url(),
    COGNITO_USER_POOL_ID: str(),
    COGNITO_USER_CLIENT_ID: str(),

    AWS_ACCESS_KEY_ID: str(),
    AWS_SECRET_ACCESS_KEY: str(),

    AWS_DEFAULT_REGION: str(),
    S3_BUCKET: str(),
    S3_CUSTOM_ENDPOINT: url(),
});

export default env;

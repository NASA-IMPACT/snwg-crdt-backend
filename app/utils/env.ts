import { cleanEnv, str, url } from "envalid";

const env = cleanEnv(process.env, {
    COGNITO_ISSUER: url(),

    WEB_COGNITO_USER_POOL_ID: str(),
    WEB_COGNITO_USER_POOL_CLIENT_ID: str(),

    AWS_ACCESS_KEY_ID: str(),
    AWS_SECRET_ACCESS_KEY: str(),
    AWS_DEFAULT_REGION: str(),
    AWS_RESOURCES_ENDPOINT: url(),

    S3_BUCKET: str(),
    BACKEND_HOST: url(),
});

export default env;

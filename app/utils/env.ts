import { cleanEnv, str, url, makeValidator } from "envalid";

import { validateCommaSeparatedUrls } from './common.ts';

const commaSeparatedUrls = makeValidator<string[]>(validateCommaSeparatedUrls);

const env = cleanEnv(process.env, {
    COGNITO_ISSUER: url({ default: undefined }),
    AWS_RESOURCES_ENDPOINT: url({ default: undefined }),

    WEB_COGNITO_USER_POOL_ID: str(),
    WEB_COGNITO_USER_POOL_CLIENT_ID: str(),

    AWS_DEFAULT_REGION: str({ default: undefined }),

    S3_BUCKET: str(),

    SERVICE_TOKEN: str(),

    BACKEND_HOST: url(),
    FRONTEND_HOST: url(),
    CORS_ALLOWED_ORIGINS: commaSeparatedUrls({ default: [] }),
});

export default env;

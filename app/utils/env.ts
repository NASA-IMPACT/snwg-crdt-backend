import { cleanEnv, str, url, makeValidator } from "envalid";

const urlList = makeValidator<string[]>((input: string) => {
  return input.split(",").map((value) => {
    const url = value.trim();
    if (url === '') {
        return '';
    }
    new URL(url);
    return url;
  }).filter((item) => item != '')
});

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
    CORS_ALLOWED_ORIGINS: urlList({ default: [] }),
});

export default env;

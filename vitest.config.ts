import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        env: {
            NODE_ENV: "test",
            COGNITO_ISSUER: 'http://example.com',
            AWS_RESOURCES_ENDPOINT: 'http://example.com',
            WEB_COGNITO_USER_POOL_ID: 'xx-xxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            WEB_COGNITO_USER_POOL_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
            AWS_DEFAULT_REGION: 'xx-xxxx-x',
            S3_BUCKET: 'example-bucket',
            SERVICE_TOKEN: 'example-service-token',
            BACKEND_HOST: 'http://backend.example.com',
            FRONTEND_HOST: 'http://frontned.example.com',
            // CORS_ALLOWED_ORIGINS:
        },
        coverage: {
            provider: 'v8', // or 'istanbul'
            include: ['app/**/*.{ts,js}'],
            exclude: ['app/**/*.test.ts'],
        },
    },
})

# SNWG CRDT Backend

## Getting Started

```bash
# Create an environment file
touch .env

# Define mandatory env vars
# Check ./app/utils/env.ts for required env vars

# Build dev
docker build -t crdtapi --target dev .

# Run dev
docker run -it \
    --name crdtapi \
    --env-file .env \
    -p 8001:8001 \
    -v "$(pwd):/code" \
    crdtapi \
    sh -c "pnpm install && pnpm tsoa:generate && pnpm dev"
```

## Todo

- HIGH
    - Check if user has user has write access to document
- MEDIUM
    - Check updated authentication token
        - beforeHandleMessage and onTokenSync
    - Add JSDoc linting in eslint
        - https://www.npmjs.com/package/eslint-plugin-jsdoc
- LOW
    - Add background check to see if document schema version has changed between client and server
    - Migrate documents when versions change?
    - Add better health check
        - https://article.arunangshudas.com/6-common-mistakes-in-node-js-health-check-implementations-852c62365065
    - Check stack trace
    - Setup error monitoring

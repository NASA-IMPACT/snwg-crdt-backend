# SNWG CRDT Backend

## Getting Started

```bash
# Create an environment file
touch .env

# Define mandatory environment variables
echo "APP_PORT=8001" >> .env
echo "COGNITO_ISSUER=http://localstack-local:4501" >> .env
echo "S3_CUSTOM_ENDPOINT=http://localstack-local:4501" >> .env
echo "COGNITO_USER_POOL_ID=us-east-1_abcdefghijklmnopqrstuvwxyz" >> .env
echo "COGNITO_USER_CLIENT_ID=abcdefghijklmnopqrstuvwxyz" >> .env

# Start container
docker compose up
```

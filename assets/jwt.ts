 // NOTE: ALl the data here is from the development environment

import { CognitoJwtPayload } from "aws-jwt-verify/jwt-model";

import env from '../app/utils/env.ts';

export const userpoolId = 'us-east-1_77318b074f0d4930b43d381bbb9a929a';

export const clientId = 'xt9zhg8vod08x01xbgkb6ll01r';

export const host = 'http://ubuntu-dev-seed:4501';

export const realJwksResponse = {
    keys: [
        {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: 'ffc8b683-314f-4752-b277-06f4b0a5d9ca',
            n: '6xUQ2i876C5wxyIIL4NsYlhjtwnlB_yqMgDatQliJ3rI-1qAcOlmRQt2OSdDPi98G-C_0XnOg9jsCdrsqjGkei7GjwYz_4AJP204n3cuF2gdOy14IWeL5vmtDFU6Um76Cog7eTzG9GLhbPJgtk4yBAk1tiukwQPfYv4VrTR30cc3ZVqeGRNA6V8JgSMNa9LGEFZORXmHBp2zW9PyHlR_HEWXEfwQUJveL67wZuMGIaHWldd4UXVRWC929XSlGo_rRsxH7t4zsceJYBYY4JIQPDZDjled4OTnjPeRwUdKCCS8e_2nc2PoiBxtGMZ0YR-I7aQTZF3eGz2MsS29HF-MbQ',
            e: 'AQAB'
        }
    ]
};

// NOTE: This token has already expired
export const realToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZmYzhiNjgzLTMxNGYtNDc1Mi1iMjc3LTA2ZjRiMGE1ZDljYSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzAwMDUyNTEsImlzcyI6Imh0dHA6Ly91YnVudHUtZGV2LXNlZWQ6NDUwMS91cy1lYXN0LTFfNzczMThiMDc0ZjBkNDkzMGI0M2QzODFiYmI5YTkyOWEiLCJzdWIiOiI1ZmIzMTAxNi03NWJjLTQxOWYtODI4YS05NDQ2Y2U4Yzc3ZmQiLCJhdXRoX3RpbWUiOjE3NzAwMDE2NTEsImlhdCI6MTc3MDAwMTY1MSwiZXZlbnRfaWQiOiJjNTVmNzMxZS1kZGY4LTQ0ZGYtOWMzZi0zYTVlZDgwN2NhMmYiLCJ0b2tlbl91c2UiOiJpZCIsImp0aSI6IjA5ZDllYzgyLThlNWQtNGE5Yy05MjAwLTNlODdiZGE3MmRlNSIsImNvZ25pdG86dXNlcm5hbWUiOiI1ZmIzMTAxNi03NWJjLTQxOWYtODI4YS05NDQ2Y2U4Yzc3ZmQiLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJDYXJsb3MgQ3VyYXRvciIsImVtYWlsIjoiY3VyYXRvckBleGFtcGxlLmNvbSIsImNvZ25pdG86dXNlcl9zdGF0dXMiOiJDT05GSVJNRUQiLCJhdWQiOiJ4dDl6aGc4dm9kMDh4MDF4YmdrYjZsbDAxciIsImNvZ25pdG86Z3JvdXBzIjpbImN1cmF0b3IiXX0.Y2uAL2hMvf_ahdz-eVA6PuV43elkotzMx15RnXdhBTOktvcrY9M5Ai1WcuWn6pS3UNYat9W5Dfuy2jAjZg-DOw5SfvembBAf0XIEOK6IEg_vqAnp_vLYcBBjYb9dPGsPFxvG_DvhaOY9xvGz2rziBy9wLURiChlBfD4MUo1eMyt41-o25KueXDEiw5a7Vp33O3VgzoJBKH2MD3P2WAAO0EuXb_wx6QO1Cy1lex3ZIp7KH7d4170xGQO5xkgdtXfxSXye2ujYdt65pQ65VqXm17-Y_S0n8N-aA95TxPvWwWuNsx-jNeXfXAZt1oq8vXumG0NND1B7tcogRN3PIFQcbw';

export const realTokenPayload = {
    exp: 1770005251,
    iss: `${host}/${userpoolId}`,
    sub: '5fb31016-75bc-419f-828a-9446ce8c77fd',
    auth_time: 1770001651,
    iat: 1770001651,
    event_id: 'c55f731e-ddf8-44df-9c3f-3a5ed807ca2f',
    token_use: 'id',
    jti: '09d9ec82-8e5d-4a9c-9200-3e87bda72de5',
    'cognito:username': '5fb31016-75bc-419f-828a-9446ce8c77fd',
    email_verified: 'true',
    preferred_username: 'Carlos Curator',
    email: 'curator@example.com',
    'cognito:user_status': 'CONFIRMED',
    aud: clientId,
    'cognito:groups': ['curator']
};

export const mockTokenPayload: CognitoJwtPayload = {
    exp: 1234567890,
    iss: `${env.COGNITO_ISSUER}/${env.WEB_COGNITO_USER_POOL_ID}`,
    sub: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    auth_time: 1234567890,
    iat: 1234567890,
    event_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    token_use: 'id',
    jti: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    origin_jti: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    'cognito:username': 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    email_verified: 'true',
    preferred_username: 'Carlos Curator',
    email: 'curator@example.com',
    'cognito:user_status': 'CONFIRMED',
    aud: env.WEB_COGNITO_USER_POOL_CLIENT_ID,
    'cognito:groups': ['curator']
}

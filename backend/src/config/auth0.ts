import { ConfigParams } from 'express-openid-connect';
import { env } from './env';

export const auth0Config: ConfigParams = {
  authRequired: false,
  auth0Logout: true,
  secret: env.auth0Secret,
  baseURL: env.auth0BaseUrl,
  clientID: env.auth0ClientId,
  issuerBaseURL: `https://${env.auth0Domain}`,
  clientSecret: env.auth0ClientSecret,
  authorizationParams: {
    response_type: 'code',
    audience: env.auth0Audience,
    scope: 'openid profile email offline_access',
  },
  routes: {
    login: false,
    logout: false,
    callback: '/api/auth/callback',
  },
};
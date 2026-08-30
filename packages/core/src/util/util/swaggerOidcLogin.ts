// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Gates the Swagger UI (systemConfig.util.swagger.path) behind an OIDC
 * Authorization Code login: unauthenticated browsers are redirected to the
 * configured provider (Keycloak or any other standards-compliant OIDC
 * issuer), a callback route exchanges the code for a token, and a
 * session cookie is set once the token verifies.
 *
 * This is intentionally separate from util.authProvider/ApiAuthPlugin
 * (registerApiAuth in citrineOSServer.ts, which explicitly excludes
 * '/docs' from its checks): that plugin only verifies a bearer token a
 * caller already has and returns a bare 401 if one is missing, which
 * cannot give a browser opening this page anywhere to log in. Token
 * verification here reuses OIDCAuthProvider.authenticateToken so the JWKS
 * fetch/cache/signature-check logic isn't duplicated.
 */

import type { SystemConfig } from '@citrineos/types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { OIDCAuthProvider } from '../authorization/index.js';

const COOKIE_NAME = 'citrineos_swagger_auth';

type SwaggerOidcLoginConfig = NonNullable<
  NonNullable<SystemConfig['util']['swagger']>['oidcLogin']
>;

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function setSessionCookie(reply: FastifyReply, token: string, maxAgeSeconds: number) {
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  reply.header('set-cookie', attrs.join('; '));
}

function authorizationUrl(config: SwaggerOidcLoginConfig, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid',
  });
  return `${config.authorizationEndpoint}?${params.toString()}`;
}

function requestOrigin(request: FastifyRequest): string {
  const proto = (request.headers['x-forwarded-proto'] as string) || request.protocol;
  const host = (request.headers['x-forwarded-host'] as string) || request.headers.host;
  return `${proto}://${host}`;
}

export function registerSwaggerOidcLogin(systemConfig: SystemConfig, server: FastifyInstance) {
  const swaggerPath = systemConfig.util.swagger?.path;
  const config = systemConfig.util.swagger?.oidcLogin;
  if (!swaggerPath || !config) return;

  const provider = new OIDCAuthProvider({
    jwksUri: config.jwksUri,
    issuer: config.issuer,
    audience: config.clientId,
  });

  const callbackPath = `${swaggerPath}/callback`;

  server.get(callbackPath, async (request: FastifyRequest, reply: FastifyReply) => {
    const code = (request.query as { code?: string }).code;
    if (!code) {
      reply.code(400);
      return { error: 'missing authorization code' };
    }
    const redirectUri = `${requestOrigin(request)}${callbackPath}`;
    try {
      const tokenResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      });
      if (!tokenResponse.ok) {
        reply.code(502);
        return { error: 'OIDC token exchange failed' };
      }
      const tokenData = (await tokenResponse.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      const authResult = tokenData.access_token
        ? await provider.authenticateToken(tokenData.access_token)
        : undefined;
      if (!tokenData.access_token || !authResult?.isAuthenticated) {
        reply.code(401);
        return { error: 'invalid OIDC token' };
      }
      setSessionCookie(reply, tokenData.access_token, tokenData.expires_in ?? 300);
      reply.redirect(swaggerPath);
      return;
    } catch (e) {
      console.error('swaggerOidcLogin: callback failed', e);
      reply.code(502);
      return { error: 'OIDC token exchange failed' };
    }
  });

  server.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.url.startsWith(swaggerPath)) return;
    if (request.url.startsWith(callbackPath)) return;

    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[COOKIE_NAME];
    if (token) {
      const authResult = await provider.authenticateToken(token);
      if (authResult.isAuthenticated) return;
    }
    const redirectUri = `${requestOrigin(request)}${callbackPath}`;
    reply.redirect(authorizationUrl(config, redirectUri));
  });
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { Context, Next } from 'koa';

export interface OIDCConfig {
  jwksUri: string;
  issuer: string;
  audience?: string;
  cacheTime?: number;
  rateLimit?: boolean;
}

export function oidcAuthMiddleware(config: OIDCConfig) {
  const client = jwksClient({
    jwksUri: config.jwksUri,
    cache: true,
    cacheMaxAge: config.cacheTime || 60 * 60 * 1000,
    rateLimit: config.rateLimit ?? true,
    jwksRequestsPerMinute: 5,
  });

  async function getKey(header: any, callback: any) {
    client.getSigningKey(header.kid, function (err, key) {
      if (err || !key) {
        callback(err || new Error('Signing key not found'));
      } else {
        callback(null, key.getPublicKey());
      }
    });
  }

  return async (ctx: Context, next: Next) => {
    const authHeader = ctx.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.status = 401;
      ctx.body = { error: 'Missing or invalid Authorization header' };
      return;
    }
    const token = authHeader.slice(7);
    try {
      const decoded = await new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ['RS256'],
          },
          (err, payload) => {
            if (err) reject(err);
            else resolve(payload as JwtPayload);
          },
        );
      });
      ctx.state.user = decoded;
      await next();
    } catch (err) {
      ctx.status = 401;
      ctx.body = {
        error: 'Invalid token',
        details: err instanceof Error ? err.message : String(err),
      };
    }
  };
}

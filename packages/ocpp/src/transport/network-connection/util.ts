// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type * as http from 'http';
import { splitOnce } from '../../util/string-operations.js';
import { UpgradeUnknownError } from './authenticator/errors/unknown-error.js';

/**
 * Extracts the charging station identifier (ocppConnectionName) from a WebSocket upgrade URL.
 */
export function getClientIdFromUrl(url: string): string {
  const pathSegment = url.split('?')[0].split('/').pop() as string;
  try {
    return decodeURIComponent(pathSegment);
  } catch {
    throw new UpgradeUnknownError(`Unknown identifier ${pathSegment}`);
  }
}

/**
 * Extracts credentials from the Authorization header.
 *
 * The Authorization header is formatted as follows:
 * AUTHORIZATION: Basic <Base64 encoded(<Configured ChargingStationId>:<Configured BasicAuthPassword>)>
 */
export function extractBasicCredentials(req: http.IncomingMessage): {
  username?: string;
  password?: string;
} {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    return {};
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString();

  const [username, password] = splitOnce(decodedCredentials, ':');

  return { username, password };
}

export function remoteAddressOf(req: http.IncomingMessage): string | undefined {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress
  );
}

/** The request path; the query string is dropped so nothing a station put there is stored. */
export function uriOf(req: http.IncomingMessage): string | undefined {
  return req.url?.split('?')[0];
}

export function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function errorCodeOf(error: unknown): string | undefined {
  return error instanceof Error && 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;
}

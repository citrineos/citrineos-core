// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BadRequestError, createParamDecorator } from 'routing-controllers';
import { HttpHeader } from '@citrineos/base';
import { base64Decode } from '../../util/util.js';

const tokenPrefix = 'Token ';
const CANONICAL_BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function extractToken(authorization: string): string {
  if (!authorization.startsWith(tokenPrefix)) {
    throw new BadRequestError('Invalid Authorization header format');
  }
  const token = authorization.slice(tokenPrefix.length).trim();
  if (
    !token ||
    !CANONICAL_BASE64_PATTERN.test(token) ||
    Buffer.from(token, 'base64').toString('base64') !== token
  ) {
    throw new BadRequestError('Invalid base64 token');
  }
  return base64Decode(token);
}

/**
 * AuthToken convenience decorator will extract the token from the Authorization header. Allows to easilly access auth
 * token in request handler like so:
 *
 * @Get()
 * some(@AuthToken() token: string) {
 *   console.log(token);
 * }
 */
export function AuthToken() {
  return createParamDecorator({
    required: true,
    value: (action) => {
      const authorizationHeader = action.request.headers[HttpHeader.Authorization.toLowerCase()];
      if (authorizationHeader) {
        return extractToken(authorizationHeader);
      } else {
        // todo handle non-existent or improperly formatted Authorization header which should be captured in auth middleware and should theoretically be correct by the time this runs
        return undefined;
      }
    },
  });
}

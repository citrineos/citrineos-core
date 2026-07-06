// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Context } from 'vm';

/**
 * Helper Base class for middlewares
 */
export class BaseMiddleware {
  protected getHeader(context: Context, header: string) {
    const headers = context.req.headers;
    return headers[header.toLowerCase()];
  }
}

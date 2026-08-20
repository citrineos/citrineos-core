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

  /**
   * Sets a response header only when there is a value for it. Koa stringifies whatever it is
   * given, so passing an absent header through would put the text "undefined" on the response.
   */
  protected setHeaderIfPresent(context: Context, header: string, value: unknown) {
    if (value === undefined || value === null) {
      return;
    }
    context.response.set(header, value);
  }
}

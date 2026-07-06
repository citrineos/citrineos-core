// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context } from 'vm';
import { Service } from 'typedi';
import { OcpiHttpHeader } from '../OcpiHttpHeader.js';
import { BaseMiddleware } from './BaseMiddleware.js';

/**
 * UniqueMessageIdsMiddleware will apply the {@link OcpiHttpHeader.XRequestId} and {@link OcpiHttpHeader.XCorrelationId}
 * if they are present in the request headers.
 */
@Service()
export class UniqueMessageIdsMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  public async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    const xRequestId = this.getHeader(context, OcpiHttpHeader.XRequestId);
    const xCorrelationId = this.getHeader(context, OcpiHttpHeader.XCorrelationId);
    context.response.set(OcpiHttpHeader.XRequestId, xRequestId);
    context.response.set(OcpiHttpHeader.XCorrelationId, xCorrelationId);
    await next();
  }
}

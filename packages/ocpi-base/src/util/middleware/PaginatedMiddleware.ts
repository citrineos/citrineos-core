// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context } from 'vm';
import { Service } from 'typedi';
import { BaseMiddleware } from './BaseMiddleware.js';
import type { PaginatedResponse } from '../../model/PaginatedResponse.js';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from '../../model/PaginatedResponse.js';
import { OcpiHttpHeader } from '../OcpiHttpHeader.js';

/**
 * PaginatedMiddleware will handle pulling limit, offset and total out of the {@link PaginatedResponse} and ensuring
 * that the Link, X-Total-Count and X-Limit headers are set while preventing these values from being included in the
 * response body.
 */
@Service()
export class PaginatedMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    await next();
    const paginatedResponse = context.response.body as PaginatedResponse<any>;
    const link = this.createLink(context, paginatedResponse);
    if (link) {
      context.response.set(OcpiHttpHeader.Link, `<${link}>; rel="next"`);
    }
    context.response.set(OcpiHttpHeader.XTotalCount, paginatedResponse.total);
    context.response.set(OcpiHttpHeader.XLimit, paginatedResponse.limit);
    delete (paginatedResponse as any).limit;
    delete (paginatedResponse as any).offset;
    delete (paginatedResponse as any).total;
  }

  private createLink(context: Context, paginatedResponse: PaginatedResponse<any>) {
    const url = new URL(
      `${context.request.protocol}://${context.request.host}${context.request.url}`,
    );
    const currentOffset = paginatedResponse.offset || DEFAULT_OFFSET;
    const limit = paginatedResponse.limit || DEFAULT_LIMIT;
    const total = paginatedResponse.total || 0;
    if (currentOffset + limit < total) {
      const newOffset = currentOffset + limit;
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', newOffset.toString());
      return url.href;
    }
    return undefined;
  }
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context } from 'vm';
import { OcpiHttpHeader } from '../ocpi-http-header.js';
import { BaseMiddleware } from './base-middleware.js';

/**
 * OcpiHeaderMiddleware will apply the {@link OcpiHttpHeader.OcpiFromCountryCode}, {@link OcpiHttpHeader.OcpiFromPartyId},
 * {@link OcpiHttpHeader.OcpiToCountryCode} and {@link OcpiHttpHeader.OcpiToPartyId} to the request response headers switching
 * the from/to country codes and party ids.
 */
export class OcpiHeaderMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  public async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    const fromCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiFromCountryCode);
    const fromPartyId = this.getHeader(context, OcpiHttpHeader.OcpiFromPartyId);
    const toCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiToCountryCode);
    const toPartyId = this.getHeader(context, OcpiHttpHeader.OcpiToPartyId);
    this.setHeaderIfPresent(context, OcpiHttpHeader.OcpiFromCountryCode, toCountryCode);
    this.setHeaderIfPresent(context, OcpiHttpHeader.OcpiFromPartyId, toPartyId);
    this.setHeaderIfPresent(context, OcpiHttpHeader.OcpiToCountryCode, fromCountryCode);
    this.setHeaderIfPresent(context, OcpiHttpHeader.OcpiToPartyId, fromPartyId);
    await next();
  }
}

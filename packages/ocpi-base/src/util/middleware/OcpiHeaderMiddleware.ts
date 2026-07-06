// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import type { Context } from 'vm';
import { Service } from 'typedi';
import { OcpiHttpHeader } from '../OcpiHttpHeader.js';
import { BaseMiddleware } from './BaseMiddleware.js';

/**
 * OcpiHeaderMiddleware will apply the {@link OcpiHttpHeader.OcpiFromCountryCode}, {@link OcpiHttpHeader.OcpiFromPartyId},
 * {@link OcpiHttpHeader.OcpiToCountryCode} and {@link OcpiHttpHeader.OcpiToPartyId} to the request response headers switching
 * the from/to country codes and party ids.
 */
@Service()
export class OcpiHeaderMiddleware extends BaseMiddleware implements KoaMiddlewareInterface {
  public async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    const fromCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiFromCountryCode);
    const fromPartyId = this.getHeader(context, OcpiHttpHeader.OcpiFromPartyId);
    const toCountryCode = this.getHeader(context, OcpiHttpHeader.OcpiToCountryCode);
    const toPartyId = this.getHeader(context, OcpiHttpHeader.OcpiToPartyId);
    context.response.set(OcpiHttpHeader.OcpiFromCountryCode, toCountryCode);
    context.response.set(OcpiHttpHeader.OcpiFromPartyId, toPartyId);
    context.response.set(OcpiHttpHeader.OcpiToCountryCode, fromCountryCode);
    context.response.set(OcpiHttpHeader.OcpiToPartyId, fromPartyId);
    await next();
  }
}

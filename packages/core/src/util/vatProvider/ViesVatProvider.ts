// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AddressType, IVatProvider } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

const VIES_REST_BASE = 'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

interface ViesResponse {
  countryCode: string;
  vatNumber: string;
  valid: boolean;
  name: string;
  address: string;
}

interface ViesErrorResponse {
  actionSucceed: false;
  errorWrappers: { error: string; message?: string }[];
}

/**
 * This implementation uses service provided by European Commission
 * Please refer to https://ec.europa.eu/taxation_customs/vies/#/technical-information
 */
export class ViesVatProvider implements IVatProvider {
  private readonly _logger: Logger<ILogObj>;

  constructor({ logger }: { logger?: Logger<ILogObj> } = {}) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async getVat(vatNumber: string): Promise<AddressType | null | undefined> {
    const countryCode = vatNumber.slice(0, 2).toUpperCase();
    const number = vatNumber.slice(2);

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      this._logger.warn(
        `VAT number "${vatNumber}" does not start with a valid 2-letter country code`,
      );
      return null;
    }

    let data: ViesResponse;
    try {
      const response = await fetch(VIES_REST_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, vatNumber: number }),
      });
      if (!response.ok) {
        this._logger.error(`VIES request failed with HTTP ${response.status} for VAT ${vatNumber}`);
        return null;
      }
      const body = (await response.json()) as ViesResponse | ViesErrorResponse;
      this._logger.debug('VIES response body:', body);
      if ('actionSucceed' in body) {
        const error = body.errorWrappers?.[0]?.error ?? 'UNKNOWN';
        this._logger.warn(`VIES returned error "${error}" for VAT ${vatNumber}`);
        // Transient service errors — return undefined so the handler responds Rejected
        // but the caller can distinguish this from a permanently invalid number
        return undefined;
      }
      data = body;
    } catch (error) {
      this._logger.error(`VIES request error for VAT ${vatNumber}:`, error);
      return null;
    }

    if (!data.valid) {
      this._logger.debug(`VIES returned invalid for VAT ${vatNumber}`);
      return null;
    }

    return ViesVatProvider._toAddressType(data);
  }

  private static _toAddressType(data: ViesResponse): AddressType {
    const lines = data.address
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const lastLine = lines[lines.length - 1] ?? '';
    const { postalCode, city } = ViesVatProvider._splitPostalCodeAndCity(lastLine);

    return {
      name: data.name,
      address1: lines[0] ?? '',
      address2: lines.length > 2 ? lines.slice(1, -1).join(', ') : undefined,
      city,
      postalCode,
      country: data.countryCode,
    };
  }

  private static _splitPostalCodeAndCity(line: string): { postalCode?: string; city: string } {
    const match = line.match(/^(\d[\d\s-]{2,9})\s+(.+)$/);
    if (match) {
      return { postalCode: match[1].trim(), city: match[2].trim() };
    }
    return { city: line };
  }
}

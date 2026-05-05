// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';

/**
 * Cost calculation. Stub implementation that uses the per-tenant
 * flat-rate `pricePerKwh` from config. The real OCPI tariff lookup
 * (`Tariffs.elements` JSONB → multidimensional pricing rules) is its own
 * subsystem — tracked in §5.8 of the parity roadmap.
 *
 * Returns `null` when no price is configured (handler should not write
 * the column). Otherwise returns `{ totalCost, currency }` keyed on the
 * config; callers persist via `TransactionRepository.setTotalCost`.
 *
 * All math runs on JS numbers and rounds to 4 decimals — matches legacy
 * `_calculateTotalCost` precision.
 */
@Injectable()
export class CostService {
  constructor(@Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig) {}

  computeFromKwh(totalKwh: string | null): { totalCost: string; currency: string } | null {
    if (totalKwh === null) return null;
    const flat = this.cfg.flatRateCost;
    if (!flat?.pricePerKwh) return null;

    const kwh = Number(totalKwh);
    const price = Number(flat.pricePerKwh);
    if (!Number.isFinite(kwh) || !Number.isFinite(price) || price <= 0) return null;

    const total = Math.round(kwh * price * 10_000) / 10_000;
    return { totalCost: total.toString(), currency: flat.currency ?? 'USD' };
  }
}

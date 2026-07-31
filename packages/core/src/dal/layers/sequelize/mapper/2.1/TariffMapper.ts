// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type TariffEnergyType,
  type TariffFixedType,
  type TariffTimeType,
  type PriceType,
  type MessageContentType,
  OCPP2_1,
} from '@citrineos/types';
import { Tariff } from '../../model/Tariff/Tariffs.js';
export class TariffMapper {
  /**
   * Maps a {@link Tariff} DB model to an OCPP 2.1 {@link OCPP2_1.TariffType}.
   *
   * - `tariffId` falls back to the DB primary key string when not explicitly set.
   * - All complex fields (`energy`, `chargingTime`, etc.) are stored as JSONB and
   *   passed through directly; their structure is validated at the OCPP message boundary.
   *
   * @throws {Error} if `currency` is missing (required by spec).
   */
  static toTariffType(tariff: Tariff): OCPP2_1.TariffType {
    if (!tariff.currency) {
      throw new Error(`Tariff id=${tariff.id} is missing required field: currency`);
    }

    return {
      tariffId: tariff.tariffId ?? String(tariff.id),
      currency: tariff.currency,
      validFrom: tariff.validFrom ?? undefined,
      description: TariffMapper.toDescription(tariff.description),
      energy: TariffMapper.toEnergyType(tariff.energy),
      chargingTime: TariffMapper.toTimeType(tariff.chargingTime),
      idleTime: TariffMapper.toTimeType(tariff.idleTime),
      fixedFee: TariffMapper.toFixedType(tariff.fixedFee),
      reservationTime: TariffMapper.toTimeType(tariff.reservationTime),
      reservationFixed: TariffMapper.toFixedType(tariff.reservationFixed),
      minCost: TariffMapper.toPriceType(tariff.minCost),
      maxCost: TariffMapper.toPriceType(tariff.maxCost),
    };
  }

  static toDescription(
    description: MessageContentType[] | null | undefined,
  ): OCPP2_1.TariffType['description'] | undefined {
    return (description as OCPP2_1.TariffType['description']) ?? undefined;
  }

  static toEnergyType(
    energy: TariffEnergyType | null | undefined,
  ): OCPP2_1.TariffEnergyType | undefined {
    return (energy as OCPP2_1.TariffEnergyType) ?? undefined;
  }

  static toTimeType(time: TariffTimeType | null | undefined): OCPP2_1.TariffTimeType | undefined {
    return (time as OCPP2_1.TariffTimeType) ?? undefined;
  }

  static toFixedType(
    fixed: TariffFixedType | null | undefined,
  ): OCPP2_1.TariffFixedType | undefined {
    return (fixed as OCPP2_1.TariffFixedType) ?? undefined;
  }

  static toPriceType(price: PriceType | null | undefined): OCPP2_1.PriceType | undefined {
    return (price as OCPP2_1.PriceType) ?? undefined;
  }
}

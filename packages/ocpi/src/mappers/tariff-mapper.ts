// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDTO } from '../types/dto/tariffs/tariff-dto.js';
import { TariffDimensionType } from '../types/tariff-dimension-type.js';
import type { DisplayText } from '../types/display-text.js';
import type { TariffElement } from '../types/tariff-element.js';
import { TariffType } from '../types/tariff-type.js';
import { MINUTES_IN_HOUR } from '../util/consts.js';
import type { TariffDto } from '@citrineos/types';

export class TariffMapper {
  constructor() {}

  public static map(coreTariff: Partial<TariffDto>): TariffDTO {
    return {
      id: coreTariff.id!.toString(),
      country_code: coreTariff.tenant!.countryCode!,
      party_id: coreTariff.tenant!.partyId!,
      currency: coreTariff.currency!,
      type: TariffType.AD_HOC_PAYMENT,
      tariff_alt_text: TariffMapper.toTariffAltText(coreTariff.tariffAltText),
      tariff_alt_url: undefined,
      min_price: undefined,
      max_price: undefined,
      elements: [TariffMapper.getTariffElement(coreTariff)],
      energy_mix: undefined,
      start_date_time: undefined,
      end_date_time: undefined,
      last_updated: coreTariff.updatedAt!,
    };
  }
  /**
   * Converts Citrine's internal `tariffAltText` into OCPI's `tariff_alt_text`.
   *
   * The column is JSONB holding a language-keyed record — `{ en: 'Standard tariff',
   * fr: 'Tarif standard' }`. OCPI defines `tariff_alt_text` as `DisplayText` with `*`
   * cardinality, so the record-to-array conversion belongs here at the boundary rather
   * than in the stored representation.
   *
   * Returns `undefined` rather than an empty array when there is nothing to send, so the
   * field is omitted like the other optional fields on the DTO. Validation of the
   * resulting entries stays with `DisplayTextSchema`.
   */
  private static toTariffAltText(
    tariffAltText: Record<string, any> | null | undefined,
  ): DisplayText[] | undefined {
    if (tariffAltText == null) {
      return undefined;
    }

    const displayTexts = Object.entries(tariffAltText).map(([language, text]) => ({
      language,
      text,
    }));

    return displayTexts.length > 0 ? displayTexts : undefined;
  }

  private static getTariffElement(coreTariff: Partial<TariffDto>): TariffElement {
    return {
      price_components: [
        {
          type: TariffDimensionType.ENERGY,
          price: coreTariff.pricePerKwh!,
          vat: coreTariff.taxRate,
          step_size: 1,
        },
        ...(coreTariff.pricePerMin
          ? [
              {
                type: TariffDimensionType.TIME,
                price: coreTariff.pricePerMin * MINUTES_IN_HOUR,
                vat: coreTariff.taxRate,
                step_size: 1,
              },
            ]
          : []),
        ...(coreTariff.pricePerSession
          ? [
              {
                type: TariffDimensionType.FLAT,
                price: coreTariff.pricePerSession,
                vat: coreTariff.taxRate,
                step_size: 1,
              },
            ]
          : []),
      ],
      restrictions: undefined,
    };
  }

  // TODO make flexible for more complicated tariffs
  private mapTariffElementToCoreTariff(tariffElements: TariffElement[]): Partial<TariffDto> {
    const tariffElement = tariffElements[0];
    const priceComponents = tariffElement.price_components ?? [];
    const pricePerKwh =
      priceComponents.find((pc) => pc.type === TariffDimensionType.ENERGY)?.price ?? 0;
    const pricePerMin =
      (priceComponents.find((pc) => pc.type === TariffDimensionType.TIME)?.price ?? 0) /
      MINUTES_IN_HOUR;
    const pricePerSession =
      priceComponents.find((pc) => pc.type === TariffDimensionType.FLAT)?.price ?? 0;
    const taxRate = priceComponents.find((pc) => pc.vat)?.vat ?? 0;

    return {
      pricePerKwh,
      pricePerMin,
      pricePerSession,
      taxRate,
    };
  }
}

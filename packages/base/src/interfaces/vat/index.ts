// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { AddressType } from '@citrineos/types';

export interface IVatProvider {
  /**
   * Retrieves company address for the given VAT number.
   *
   * @param {string} vatNumber - The VAT number to look up.
   *
   * @returns {Promise<AddressType | null | undefined>} The company address if valid,
   * null if the VAT number is permanently invalid/rejected,
   * or undefined if the lookup failed due to a transient error (e.g. service unavailable).
   */
  getVat(vatNumber: string): Promise<AddressType | null | undefined>;
}

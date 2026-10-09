// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { NetworkAlertDto, NetworkAlertOccurrenceDto } from '@citrineos/types';
import { EMPTY_VALUE } from '@lib/utils/consts';

export const formatNetworkAlertDetails = (
  details?: NetworkAlertDto['details'] | NetworkAlertOccurrenceDto['details'] | null,
): string => {
  if (!details) {
    return EMPTY_VALUE;
  }
  const parts = Object.entries(details)
    .filter(([, value]) => value != null && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`);
  return parts.length > 0 ? parts.join(' · ') : EMPTY_VALUE;
};

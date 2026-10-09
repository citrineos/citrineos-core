// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  NetworkAlertOccurrenceDto,
  NetworkAlertSeverity,
  NetworkAlertType,
} from '@citrineos/types';

export class NetworkAlertOccurrenceClass
  implements Partial<Omit<NetworkAlertOccurrenceDto, 'details'>>
{
  id?: number;
  alertId?: number;
  type?: NetworkAlertType;
  occurredAt?: string;
  severity?: NetworkAlertSeverity;
  details?: NetworkAlertOccurrenceDto['details'];
}

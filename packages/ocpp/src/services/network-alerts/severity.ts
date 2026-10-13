// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { NetworkAlertSeverity } from '@citrineos/types';

const RANK: Record<NetworkAlertSeverity, number> = { Info: 0, Warning: 1, Critical: 2 };

export function isMoreSevere(severity: NetworkAlertSeverity, than: NetworkAlertSeverity): boolean {
  return RANK[severity] > RANK[than];
}

export function maxSeverity(
  a: NetworkAlertSeverity,
  b: NetworkAlertSeverity,
): NetworkAlertSeverity {
  return isMoreSevere(b, a) ? b : a;
}

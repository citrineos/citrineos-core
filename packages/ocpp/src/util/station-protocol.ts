// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OCPPVersion } from '@citrineos/types';
import type { ChargingStation } from '@citrineos/dal';

export type ReadChargingStation = (
  tenantId: number,
  ocppConnectionName: string,
) => Promise<ChargingStation | undefined>;

export type StationProtocolResolution =
  | { supported: true; protocol: OCPPVersion }
  | { supported: false; reason: string };

export async function resolveStationProtocol(
  readChargingStation: ReadChargingStation,
  tenantId: number,
  ocppConnectionName: string,
  supportedProtocols: readonly OCPPVersion[],
): Promise<StationProtocolResolution> {
  const chargingStation = await readChargingStation(tenantId, ocppConnectionName);

  const protocol = chargingStation?.protocol;
  if (!protocol) {
    return {
      supported: false,
      reason: `Protocol of ${ocppConnectionName} station is unknown; it must connect before this operation`,
    };
  }

  if (!supportedProtocols.includes(protocol)) {
    return {
      supported: false,
      reason: `Protocol of ${ocppConnectionName} station does not support this operation`,
    };
  }

  return { supported: true, protocol };
}

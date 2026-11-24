// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, Logger } from 'tslog';
import type { ICoreApiClient } from '../core/core-api-client.js';
import type { StationView } from '../core/core-data.js';
import type { CheckoutDto } from '../types/index.js';

/** Takes a checkout's QR code off the station, if it put one there; failures are only logged. */
export async function clearQrCode(
  dependencies: { coreApi: ICoreApiClient; logger: Logger<ILogObj> },
  checkout: CheckoutDto,
  station: Pick<StationView, 'ocppConnectionName' | 'protocol'>,
): Promise<void> {
  if (checkout.qrDisplayMessageId === null || station.protocol == null) {
    return;
  }
  try {
    const result = await dependencies.coreApi.clearDisplayMessage({
      tenantId: checkout.tenantId,
      ocppConnectionName: station.ocppConnectionName,
      protocol: station.protocol,
      id: checkout.qrDisplayMessageId,
    });
    if (!result.sent) {
      dependencies.logger.warn(
        `Core did not clear the QR code of ${checkout.publicId}: ${result.detail}`,
      );
    }
  } catch (error) {
    dependencies.logger.warn(`Clearing the QR code of ${checkout.publicId} failed`, error);
  }
}

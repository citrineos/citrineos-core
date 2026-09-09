// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IMessageConfirmation, IOcppSender } from '@citrineos/base';
import type { CallAction, EventGroup, OcppRequest, OCPPVersion } from '@citrineos/types';
import { getBatches } from '@util/index.js';

export interface SendInBatchesOptions<T> {
  ocppSender: IOcppSender;
  ocppConnectionName: string;
  tenantId: number;
  version: OCPPVersion;
  action: CallAction;
  eventGroup: EventGroup;
  items: readonly T[];
  itemsPerMessage: number;
  buildPayload: (batch: T[]) => OcppRequest;
  callbackUrl?: string;
}

/**
 * Splits `items` into batches of at most `itemsPerMessage` and sends one call per batch,
 * returning a confirmation per batch labelled with the batch's starting index.
 */
export async function sendInBatches<T>({
  ocppSender,
  ocppConnectionName,
  tenantId,
  version,
  action,
  eventGroup,
  items,
  itemsPerMessage,
  buildPayload,
  callbackUrl,
}: SendInBatchesOptions<T>): Promise<IMessageConfirmation[]> {
  const confirmations: IMessageConfirmation[] = [];

  for (const [batchIndex, batch] of getBatches(items, itemsPerMessage)) {
    try {
      const confirmation = await ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: version,
        action,
        eventGroup,
        payload: buildPayload(batch),
        callbackUrl,
      });
      confirmations.push({
        success: confirmation.success,
        payload: `Batch [${batchIndex}]: ${confirmation.payload}`,
      });
    } catch (error) {
      confirmations.push({
        success: false,
        payload: `Batch [${batchIndex}]: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      });
    }
  }

  return confirmations;
}

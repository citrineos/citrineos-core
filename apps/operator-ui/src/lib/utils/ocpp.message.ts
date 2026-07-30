// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageTypeId } from '@citrineos/base';

/**
 * `type` is the OCPP RPC messageTypeId (2 = Call, 3 = CallResult, 4 = CallError). It is absent
 * for messages that could not be parsed far enough to determine it.
 */
export const messageTypeLabel = (type?: MessageTypeId | null): string | undefined => {
  if (type === undefined || type === null) return undefined;
  return (MessageTypeId as Record<number, string | undefined>)[type] ?? String(type);
};

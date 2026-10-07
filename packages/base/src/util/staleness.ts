// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, MessageState, type SystemConfig } from '@citrineos/types';
import type { IMessageContext } from '@interfaces/messages/message-context.js';

export interface OutboundMessage {
  origin: MessageOrigin;
  state: MessageState;
  context: IMessageContext;
}

/**
 * The epoch-ms instant after which a message the CSMS sends to a station is no longer worth
 * delivering, or undefined when it never expires. Station-origin messages never expire here:
 * modules process everything they receive, however late.
 */
export function outboundDeadline(
  timeouts: SystemConfig['timeouts'],
  message: OutboundMessage,
): number | undefined {
  if (message.origin !== MessageOrigin.ChargingStationManagementSystem) {
    return undefined;
  }
  const sentAt = new Date(message.context.timestamp).getTime();

  if (message.state === MessageState.Response) {
    // The station stops waiting after maxCallLengthSeconds, and the router forgets the Call too.
    return sentAt + timeouts.maxCallLengthSeconds * 1000;
  }
  if (message.state !== MessageState.Request) {
    return undefined;
  }

  const staleAfterSeconds = message.context.staleAfterSeconds ?? timeouts.staleCallMaxAgeSeconds;
  return staleAfterSeconds === 0 ? undefined : sentAt + staleAfterSeconds * 1000;
}

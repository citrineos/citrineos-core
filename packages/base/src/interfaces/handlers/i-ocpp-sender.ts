// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  EventGroup,
  MessageOrigin,
  type OcppRequest,
  type OcppResponse,
  type CallAction,
  type OCPPVersionType,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { IMessage } from '@interfaces/messages/message.js';
import type { IMessageConfirmation } from '@interfaces/messages/message-confirmation.js';

/**
 * Fields {@link IOcppSender.sendCall} needs to build a new outbound Call. Responses are built from
 * the Call they answer, which already carries these fields.
 */
export interface BaseOcppSenderArgs {
  ocppConnectionName: string;
  tenantId: number;
  protocol: OCPPVersionType;
  action: CallAction;
  eventGroup: EventGroup;
  origin?: MessageOrigin;
}

export interface SendCallArgs extends BaseOcppSenderArgs {
  payload: OcppRequest;
  callbackUrl?: string;
  correlationId?: string;
}

/**
 * Responses are only sent through the Call they answer (the *WithMessage methods): the Call's
 * timestamp is what shows whether the station is still waiting for one.
 */
export interface IOcppSender {
  sendCall(args: SendCallArgs): Promise<IMessageConfirmation>;
  sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse,
  ): Promise<IMessageConfirmation>;
  sendCallErrorWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppError,
  ): Promise<IMessageConfirmation>;
}

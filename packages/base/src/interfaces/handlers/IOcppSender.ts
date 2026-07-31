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
  OcppError,
} from '@citrineos/types';
import type { IMessage } from '@interfaces/messages/Message.js';
import type { IMessageConfirmation } from '@interfaces/messages/MessageConfirmation.js';

/**
 * Fields shared by the methods that build a new outbound message from scratch
 * ({@link IOcppSender.sendCall}, {@link IOcppSender.sendCallResult}, {@link IOcppSender.sendCallError}).
 * Methods that respond using an existing {@link IMessage} envelope already carry
 * these fields on `message` and don't take this type.
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

export interface SendCallResultArgs extends BaseOcppSenderArgs {
  payload: OcppResponse;
  correlationId: string;
}

export interface SendCallErrorArgs extends BaseOcppSenderArgs {
  payload: OcppError;
  correlationId: string;
}

export interface IOcppSender {
  sendCall(args: SendCallArgs): Promise<IMessageConfirmation>;
  sendCallResult(args: SendCallResultArgs): Promise<IMessageConfirmation>;
  sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse,
  ): Promise<IMessageConfirmation>;
  sendCallError(args: SendCallErrorArgs): Promise<IMessageConfirmation>;
  sendCallErrorWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppError,
  ): Promise<IMessageConfirmation>;
}

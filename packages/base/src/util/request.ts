// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type CallAction,
  type OCPPVersionType,
  type OcppRequest,
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { IMessage } from '@interfaces/messages/Message.js';

export class RequestBuilder {
  static buildCall(
    ocppConnectionName: string,
    correlationId: string,
    tenantId: number,
    action: CallAction,
    payload: OcppRequest,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    protocol: OCPPVersionType,
    timestamp: Date = new Date(),
  ): IMessage<OcppRequest> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        ocppConnectionName,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Request,
      protocol,
      payload,
    };
  }

  static buildCallResult(
    ocppConnectionName: string,
    correlationId: string,
    tenantId: number,
    action: CallAction,
    payload: OcppResponse,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    protocol: OCPPVersionType,
    timestamp: Date = new Date(),
  ): IMessage<OcppResponse> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        ocppConnectionName,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Response,
      protocol,
      payload,
    };
  }

  static buildCallError(
    ocppConnectionName: string,
    correlationId: string,
    tenantId: number,
    action: CallAction,
    payload: OcppError,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    protocol: OCPPVersionType,
    timestamp: Date = new Date(),
  ): IMessage<OcppError> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        ocppConnectionName,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Response,
      protocol,
      payload,
    };
  }
}

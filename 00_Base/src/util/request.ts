// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CallAction,
  EventGroup,
  IMessage,
  MessageOrigin,
  MessageState,
  OcppError,
  OcppRequest,
  OcppResponse,
} from '..';

export class RequestBuilder {
  static buildCall(
    stationId: string,
    correlationId: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    timestamp: Date = new Date(),
  ): IMessage<OcppRequest> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        stationId,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Request,
      payload,
    };
  }

  static buildCallResult(
    stationId: string,
    correlationId: string,
    tenantId: string,
    action: CallAction,
    payload: OcppResponse,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    timestamp: Date = new Date(),
  ): IMessage<OcppResponse> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        stationId,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Response,
      payload,
    };
  }

  static buildCallError(
    stationId: string,
    correlationId: string,
    tenantId: string,
    action: CallAction,
    payload: OcppError,
    eventGroup: EventGroup,
    origin: MessageOrigin,
    timestamp: Date = new Date(),
  ): IMessage<OcppError> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        stationId,
        correlationId,
        tenantId,
        timestamp: timestamp.toISOString(),
      },
      state: MessageState.Response,
      payload,
    };
  }
}

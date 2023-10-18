/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { v4 as uuidv4 } from "uuid";
import {
  CallAction,
  EventGroup,
  IMessage,
  MessageOrigin,
  MessageState,
  OcppRequest,
  OcppResponse
} from "..";

export class RequestBuilder {
  static buildCall(
    stationId: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    eventGroup: EventGroup,
    origin: MessageOrigin = MessageOrigin.CentralSystem,
  ): IMessage<OcppRequest> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        stationId,
        correlationId: uuidv4(),
        tenantId
      },
      state: MessageState.Request,
      payload
    };
  }

  static buildCallResult(
    correlationId: string,
    stationId: string,
    tenantId: string,
    action: CallAction,
    payload: OcppResponse,
    eventGroup: EventGroup,
    origin: MessageOrigin = MessageOrigin.ChargingStation,
  ): IMessage<OcppResponse> {
    return {
      origin: origin,
      eventGroup: eventGroup,
      action,
      context: {
        stationId,
        correlationId: correlationId,
        tenantId
      },
      state: MessageState.Response,
      payload
    };
  }
}

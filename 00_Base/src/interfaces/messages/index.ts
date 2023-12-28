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


export type HandlerProperties = string | object | undefined;

export enum MessageState {
  Request = 1,
  Response = 2,
  Unknown = 99,
}

export enum MessageOrigin {
  CentralSystem = 'csms',
  ChargingStation = 'cs',
}

export enum EventGroup {
  General = 'general',
  Certificates = "certificates",
  Configuration = "configuration",
  EVDriver = "evdriver",
  Monitoring = 'monitoring',
  Reporting = 'reporting',
  SmartCharging = 'smartcharging',
  Transactions = 'transactions',
}

export { IMessage, Message } from "./Message";
export { IMessageHandler } from "./MessageHandler";
export { IMessageSender } from "./MessageSender";
export { IMessageRouter } from "./MessageRouter";
export { IMessageContext } from "./MessageContext";
export { IMessageConfirmation } from "./MessageConfirmation";
export { AbstractMessageHandler } from "./AbstractMessageHandler";
export { AbstractMessageSender } from "./AbstractMessageSender";









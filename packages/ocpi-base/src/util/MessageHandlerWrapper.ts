// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IMessageHandler } from '@citrineos/base';

export class MessageHandlerWrapper {
  handler: IMessageHandler;

  constructor(handler: IMessageHandler) {
    this.handler = handler;
  }
}

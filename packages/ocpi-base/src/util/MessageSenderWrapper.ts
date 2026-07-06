// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IMessageSender } from '@citrineos/base';

export class MessageSenderWrapper {
  sender: IMessageSender;

  constructor(sender: IMessageSender) {
    this.sender = sender;
  }
}

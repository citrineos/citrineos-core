// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { MessageInfoType } from '@dto/shared/message-info.dto';

/** OCPP 2.0.1 / 2.1 SetDisplayMessage request. */

export class SetDisplayMessageRequest {
  @ValidateNested()
  @Type(() => MessageInfoType)
  message: MessageInfoType;
}

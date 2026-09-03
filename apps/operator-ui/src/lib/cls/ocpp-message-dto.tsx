// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, MessageOrigin, OCPPMessageDto, OCPPVersion } from '@citrineos/types';

export class OCPPMessageClass implements Partial<OCPPMessageDto> {
  origin!: MessageOrigin;
  protocol!: OCPPVersion;
  action?: CallAction;
}

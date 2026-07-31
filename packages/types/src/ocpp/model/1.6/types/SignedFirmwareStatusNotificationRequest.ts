// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcppRequest } from '../../../internal-types.js';
import type { SignedFirmwareStatusNotificationRequestStatus } from '../enums/index.js';

export interface SignedFirmwareStatusNotificationRequest extends OcppRequest {
  status: SignedFirmwareStatusNotificationRequestStatus;
}

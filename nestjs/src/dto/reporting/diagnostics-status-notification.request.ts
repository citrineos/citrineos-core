// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum } from 'class-validator';
import { DiagnosticsStatus16 } from '@enums/diagnostics-status-16.enum';

/** OCPP 1.6 DiagnosticsStatusNotification request. */

export class DiagnosticsStatusNotificationRequest {
  @IsEnum(DiagnosticsStatus16)
  status: DiagnosticsStatus16;
}

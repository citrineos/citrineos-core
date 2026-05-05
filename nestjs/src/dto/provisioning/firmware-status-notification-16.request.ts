// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum } from 'class-validator';

/** OCPP 1.6 FirmwareStatusNotificationRequest.status — superset of 2.0.1. */
export enum FirmwareStatus16 {
  Downloaded = 'Downloaded',
  DownloadFailed = 'DownloadFailed',
  Downloading = 'Downloading',
  Idle = 'Idle',
  InstallationFailed = 'InstallationFailed',
  Installing = 'Installing',
  Installed = 'Installed',
}

/**
 * OCPP 1.6 FirmwareStatusNotification request.
 * Differs from 2.0.1 by lacking `requestId` and the rich status enum.
 */
export class FirmwareStatusNotification16Request {
  @IsEnum(FirmwareStatus16)
  status: FirmwareStatus16;
}

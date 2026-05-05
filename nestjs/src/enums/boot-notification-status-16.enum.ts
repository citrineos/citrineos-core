// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP 1.6 BootNotification response status — the wire values
 * a `BootNotification.conf` carries back to the charger.
 */
export enum BootNotificationStatusEnum16 {
  Accepted = 'Accepted',
  Pending = 'Pending',
  Rejected = 'Rejected',
}

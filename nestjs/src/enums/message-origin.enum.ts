// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Who sent the frame. Mirrors `base/src/interfaces/messages/internal-types.ts`.
 */
export enum MessageOrigin {
  ChargingStation = 'cs',
  ChargingStationManagementSystem = 'csms',
}

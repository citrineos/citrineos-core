// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** OCPP 2.0.1 / 2.1 MessageTriggerEnumType — used by TriggerMessage. */
export enum MessageTriggerEnumType {
  BootNotification = 'BootNotification',
  LogStatusNotification = 'LogStatusNotification',
  FirmwareStatusNotification = 'FirmwareStatusNotification',
  Heartbeat = 'Heartbeat',
  MeterValues = 'MeterValues',
  SignChargingStationCertificate = 'SignChargingStationCertificate',
  SignV2GCertificate = 'SignV2GCertificate',
  StatusNotification = 'StatusNotification',
  TransactionEvent = 'TransactionEvent',
  SignCombinedCertificate = 'SignCombinedCertificate',
  PublishFirmwareStatusNotification = 'PublishFirmwareStatusNotification',
}

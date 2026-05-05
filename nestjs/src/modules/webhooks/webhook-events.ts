// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Semantic webhook event names emitted by handlers.
 *
 * Const enum so callers see typed completion at the call site and the
 * compiled JS is just the literal — no runtime indirection. Receivers
 * filter by these names via the `events` field of their endpoint config.
 */
export const enum WebhookEvent {
  // Lifecycle
  BootNotification = 'boot.notification',
  Heartbeat = 'heartbeat',

  // Transactions
  TransactionStarted = 'transaction.started',
  TransactionUpdated = 'transaction.updated',
  TransactionEnded = 'transaction.ended',

  // Connector status
  ConnectorStatus = 'connector.status',
  StatusNotification = 'status.notification',

  // Authorize
  Authorize = 'authorize',

  // Reservations
  ReservationStatus = 'reservation.status',
  ReservationCreated = 'reservation.created',
  ReservationCancelled = 'reservation.cancelled',

  // Smart charging
  SmartChargingNotifyEVChargingNeeds = 'smartcharging.notify-ev-charging-needs',
  SmartChargingNotifyEVChargingSchedule = 'smartcharging.notify-ev-charging-schedule',
  SmartChargingReportChargingProfiles = 'smartcharging.report-charging-profiles',
  ChargingLimitSet = 'charging-limit.set',
  ChargingLimitCleared = 'charging-limit.cleared',

  // Reporting / monitoring fan-outs
  NotifyEvent = 'notify.event',
  NotifyReport = 'notify.report',
  NotifyMonitoringReport = 'notify.monitoring-report',
  NotifyDisplayMessages = 'notify.display-messages',
  CustomerInformationCompleted = 'customer-information.completed',

  // Status notifications (raw + 1.6)
  SecurityEvent = 'security.event',
  FirmwareStatus = 'firmware.status',
  DiagnosticsStatus = 'diagnostics.status',
  LogStatus = 'log.status',

  // Misc
  DataTransfer = 'data-transfer',
}

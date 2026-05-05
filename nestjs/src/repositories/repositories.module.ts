// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { AuthorizationRepository } from '@repositories/authorization.repository';
import { BootRepository } from '@repositories/boot.repository';
import { CertificateAttemptRepository } from '@repositories/certificate-attempt.repository';
import { ChangeConfigurationRepository } from '@repositories/change-configuration.repository';
import { ChargingNeedsRepository } from '@repositories/charging-needs.repository';
import { ChargingProfileRepository } from '@repositories/charging-profile.repository';
import { ChargingStationRepository } from '@repositories/charging-station.repository';
import { ChargingStationSecurityInfoRepository } from '@repositories/charging-station-security-info.repository';
import { CompositeScheduleRepository } from '@repositories/composite-schedule.repository';
import { ConnectorRepository } from '@repositories/connector.repository';
import { DeviceModelRepository } from '@repositories/device-model.repository';
import { EventDataRepository } from '@repositories/event-data.repository';
import { EvseRepository } from '@repositories/evse.repository';
import { LatestStatusNotificationRepository } from '@repositories/latest-status-notification.repository';
import { LocalAuthListVersionRepository } from '@repositories/local-auth-list-version.repository';
import { LocationRepository } from '@repositories/location.repository';
import { MessageInfoRepository } from '@repositories/message-info.repository';
import { MeterValueRepository } from '@repositories/meter-value.repository';
import { NetworkProfileRepository } from '@repositories/network-profile.repository';
import { Ocpp16HistoryRepository } from '@repositories/ocpp16-history.repository';
import { OcppMessageRepository } from '@repositories/ocpp-message.repository';
import { RemoteCommandRepository } from '@repositories/remote-command.repository';
import { ReservationRepository } from '@repositories/reservation.repository';
import { SecurityEventRepository } from '@repositories/security-event.repository';
import { StatusNotificationRepository } from '@repositories/status-notification.repository';
import { TenantRepository } from '@repositories/tenant.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { VariableAttributeRepository } from '@repositories/variable-attribute.repository';
import { VariableMonitoringRepository } from '@repositories/variable-monitoring.repository';
import { VariableStatusRepository } from '@repositories/variable-status.repository';

/**
 * Single-source-of-truth registry for every repository in the project.
 *
 * Marked `@Global()` so consumer modules don't need an explicit
 * `imports: [RepositoriesModule]` — every provider is injectable
 * everywhere. Module folders no longer hold per-module `repositories/`
 * subfolders; everything lives at `nestjs/src/repositories/`.
 */
const repositories = [
  AuthorizationRepository,
  BootRepository,
  CertificateAttemptRepository,
  ChangeConfigurationRepository,
  ChargingNeedsRepository,
  ChargingProfileRepository,
  ChargingStationRepository,
  ChargingStationSecurityInfoRepository,
  CompositeScheduleRepository,
  ConnectorRepository,
  DeviceModelRepository,
  EventDataRepository,
  EvseRepository,
  LatestStatusNotificationRepository,
  LocalAuthListVersionRepository,
  LocationRepository,
  MessageInfoRepository,
  MeterValueRepository,
  NetworkProfileRepository,
  Ocpp16HistoryRepository,
  OcppMessageRepository,
  RemoteCommandRepository,
  ReservationRepository,
  SecurityEventRepository,
  StatusNotificationRepository,
  TenantRepository,
  TransactionRepository,
  VariableAttributeRepository,
  VariableMonitoringRepository,
  VariableStatusRepository,
];

@Global()
@Module({
  providers: repositories,
  exports: repositories,
})
/**
 * NestJS DI module wiring the Repositories surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class RepositoriesModule {}

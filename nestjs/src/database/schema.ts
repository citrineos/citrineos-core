// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Drizzle schema map.
 *
 * Each table lives in its own file under `./entities/`. This module is the
 * one place we glue them together so that `drizzle({ schema })` gets a
 * type-aware query builder (e.g. `db.query.boots.findFirst(...)`).
 *
 * Application code should import the table or the row types DIRECTLY from
 * the entity file (`@entities/boot.entity`), never from this file.
 */

import { asyncJobStatuses } from '@entities/async-job-status.entity';
import { authorizations } from '@entities/authorization.entity';
import { authorizationRestrictions } from '@entities/authorization-restriction.entity';
import { boots } from '@entities/boot.entity';
import { certificates } from '@entities/certificate.entity';
import { changeConfigurations } from '@entities/change-configuration.entity';
import { chargingNeeds } from '@entities/charging-needs.entity';
import { chargingProfiles } from '@entities/charging-profile.entity';
import { chargingSchedules } from '@entities/charging-schedule.entity';
import { chargingStationNetworkProfiles } from '@entities/charging-station-network-profile.entity';
import { chargingStationSequences } from '@entities/charging-station-sequence.entity';
import { chargingStations } from '@entities/charging-station.entity';
import { chargingStationSecurityInfos } from '@entities/charging-station-security-info.entity';
import { components } from '@entities/component.entity';
import { componentVariables } from '@entities/component-variable.entity';
import { compositeSchedules } from '@entities/composite-schedule.entity';
import { connectors } from '@entities/connector.entity';
import { deleteCertificateAttempts } from '@entities/delete-certificate-attempt.entity';
import { eventData } from '@entities/event-data.entity';
import { evses } from '@entities/evse.entity';
import { evseTypes } from '@entities/evse-type.entity';
import { fileStorageEntries } from '@entities/file-storage-entry.entity';
import { installCertificateAttempts } from '@entities/install-certificate-attempt.entity';
import { installedCertificates } from '@entities/installed-certificate.entity';
import { latestStatusNotifications } from '@entities/latest-status-notification.entity';
import { localAuthListVersions } from '@entities/local-auth-list-version.entity';
import { localListAuthorizations } from '@entities/local-list-authorization.entity';
import { localListVersionAuthorizations } from '@entities/local-list-version-authorization.entity';
import { locations } from '@entities/location.entity';
import { messageInfos } from '@entities/message-info.entity';
import { meterValueSignatures } from '@entities/meter-value-signature.entity';
import { meterValues } from '@entities/meter-value.entity';
import { ocppFirmwareUpdate } from '@entities/ocpp-firmware-update.entity';
import { ocppLog } from '@entities/ocpp-log.entity';
import { ocppMessages } from '@entities/ocpp-message.entity';
import { remoteCommands } from '@entities/remote-command.entity';
import { reservations } from '@entities/reservation.entity';
import { securityEvents } from '@entities/security-event.entity';
import { sendLocalListAuthorizations } from '@entities/send-local-list-authorization.entity';
import { sendLocalLists } from '@entities/send-local-list.entity';
import { serverNetworkProfiles } from '@entities/server-network-profile.entity';
import { setNetworkProfiles } from '@entities/set-network-profile.entity';
import { startTransactions } from '@entities/start-transaction.entity';
import { statusNotifications } from '@entities/status-notification.entity';
import { stopTransactions } from '@entities/stop-transaction.entity';
import { subscriptions } from '@entities/subscription.entity';
import { salesTariffs } from '@entities/sales-tariff.entity';
import { tariffs } from '@entities/tariff.entity';
import { tenantPartners } from '@entities/tenant-partner.entity';
import { tenantUserRoles } from '@entities/tenant-user-role.entity';
import { tenants } from '@entities/tenant.entity';
import { transactionEvents } from '@entities/transaction-event.entity';
import { transactions } from '@entities/transaction.entity';
import { variableAttributes } from '@entities/variable-attribute.entity';
import { variableCharacteristics } from '@entities/variable-characteristic.entity';
import { variableMonitorings } from '@entities/variable-monitoring.entity';
import { variableMonitoringStatuses } from '@entities/variable-monitoring-status.entity';
import { variables } from '@entities/variable.entity';
import { variableStatuses } from '@entities/variable-status.entity';

export const schema = {
  asyncJobStatuses,
  authorizations,
  authorizationRestrictions,
  boots,
  certificates,
  changeConfigurations,
  chargingNeeds,
  chargingProfiles,
  chargingSchedules,
  chargingStationNetworkProfiles,
  chargingStations,
  chargingStationSecurityInfos,
  chargingStationSequences,
  components,
  componentVariables,
  compositeSchedules,
  connectors,
  deleteCertificateAttempts,
  eventData,
  evses,
  evseTypes,
  fileStorageEntries,
  installCertificateAttempts,
  installedCertificates,
  latestStatusNotifications,
  localAuthListVersions,
  localListAuthorizations,
  localListVersionAuthorizations,
  locations,
  messageInfos,
  meterValueSignatures,
  meterValues,
  ocppFirmwareUpdate,
  ocppLog,
  ocppMessages,
  remoteCommands,
  reservations,
  securityEvents,
  sendLocalListAuthorizations,
  sendLocalLists,
  serverNetworkProfiles,
  setNetworkProfiles,
  startTransactions,
  statusNotifications,
  stopTransactions,
  subscriptions,
  salesTariffs,
  tariffs,
  tenantPartners,
  tenantUserRoles,
  tenants,
  transactionEvents,
  transactions,
  variableAttributes,
  variableCharacteristics,
  variableMonitorings,
  variableMonitoringStatuses,
  variables,
  variableStatuses,
} as const;

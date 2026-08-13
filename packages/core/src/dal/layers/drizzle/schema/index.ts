// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Barrel over every drizzle table declaration.
 *
 * This file defines what drizzle owns. The schema validator walks these modules on
 * startup and checks every exported table against the live database, so a new
 * schema file must be added here or its table is never verified.
 *
 * Namespaced re-exports (rather than `export *`) keep each table's helpers grouped
 * and make the barrel immune to name collisions between schema files.
 */

export * as asyncJobStatus from './AsyncJobStatus.js';
export * as authorization from './Authorization.js';
export * as boot from './Boot.js';
export * as certificate from './Certificate.js';
export * as changeConfiguration from './ChangeConfiguration.js';
export * as chargingNeeds from './ChargingNeeds.js';
export * as chargingProfile from './ChargingProfile.js';
export * as chargingSchedule from './ChargingSchedule.js';
export * as chargingStation from './ChargingStation.js';
export * as chargingStationNetworkProfile from './ChargingStationNetworkProfile.js';
export * as chargingStationSecurityInfo from './ChargingStationSecurityInfo.js';
export * as chargingStationSequence from './ChargingStationSequence.js';
export * as component from './Component.js';
export * as componentVariable from './ComponentVariable.js';
export * as compositeSchedule from './CompositeSchedule.js';
export * as connector from './Connector.js';
export * as deleteCertificateAttempt from './DeleteCertificateAttempt.js';
export * as eventData from './EventData.js';
export * as evse from './Evse.js';
export * as evseType from './EvseType.js';
export * as installCertificateAttempt from './InstallCertificateAttempt.js';
export * as installedCertificate from './InstalledCertificate.js';
export * as latestStatusNotification from './LatestStatusNotification.js';
export * as localListAuthorization from './LocalListAuthorization.js';
export * as localListVersion from './LocalListVersion.js';
export * as localListVersionAuthorization from './LocalListVersionAuthorization.js';
export * as location from './Location.js';
export * as messageInfo from './MessageInfo.js';
export * as meterValue from './MeterValue.js';
export * as ocppMessage from './OCPPMessage.js';
export * as reservation from './Reservation.js';
export * as salesTariff from './SalesTariff.js';
export * as securityEvent from './SecurityEvent.js';
export * as sendLocalList from './SendLocalList.js';
export * as sendLocalListAuthorization from './SendLocalListAuthorization.js';
export * as serverNetworkProfile from './ServerNetworkProfile.js';
export * as setNetworkProfile from './SetNetworkProfile.js';
export * as startTransaction from './StartTransaction.js';
export * as statusNotification from './StatusNotification.js';
export * as stopTransaction from './StopTransaction.js';
export * as subscription from './Subscription.js';
export * as tariff from './Tariff.js';
export * as tenant from './Tenant.js';
export * as tenantPartner from './TenantPartner.js';
export * as transaction from './Transaction.js';
export * as transactionEvent from './TransactionEvent.js';
export * as variable from './Variable.js';
export * as variableAttribute from './VariableAttribute.js';
export * as variableCharacteristics from './VariableCharacteristics.js';
export * as variableMonitoring from './VariableMonitoring.js';
export * as variableMonitoringStatus from './VariableMonitoringStatus.js';
export * as variableStatus from './VariableStatus.js';

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Base models that don't have cross-dependencies
export { BaseModelWithTenant } from './BaseModelWithTenant.js';
export { Boot } from './Boot.js';
export { ChangeConfiguration } from './ChangeConfiguration.js';
export { OCPPMessage } from './OCPPMessage.js';
export { Reservation } from './Reservation.js';
export { SecurityEvent } from './SecurityEvent.js';
export { Tenant } from './Tenant.js';
export { TenantPartner } from './TenantPartner.js';
export { ChargingStationSecurityInfo } from './ChargingStationSecurityInfo.js';

// Domain-specific models - these must be imported directly to avoid circular dependencies
// NOTE: The following domains have circular dependencies and must be imported directly:
//
// Location domain:
// export * from './Location/index.js';
// - ChargingStation, Location, Evse, Connector, etc.
//
// Certificate domain:
// export * from './Certificate/index.js';
// - Certificate, InstalledCertificate, InstallCertificateAttempt, DeleteCertificateAttempt
//
// Authorization domain:
// export * from './Authorization/index.js';
// - Authorization, LocalList*, SendLocalList, etc.
//
// DeviceModel domain:
// export * from './DeviceModel/index.js';
// - Component, Variable, VariableAttribute, etc.
//
// TransactionEvent domain:
// export * from './TransactionEvent/index.js';
// - Transaction, TransactionEvent, MeterValue, etc.
//
// ChargingProfile domain:
// export * from './ChargingProfile/index.js';
// - ChargingProfile, ChargingSchedule, etc.
//
// Other domains:
// export * from './AsyncJob/index.js';
// export * from './MessageInfo/index.js';
// export * from './Subscription/index.js';
// export * from './Tariff/index.js';
// export * from './VariableMonitoring/index.js';
// export * from './ChargingStationSequence/index.js';

// Use direct imports for models with circular dependencies:
// import { ChargingStation } from './Location/ChargingStation.js';
// import { Certificate } from './Certificate/Certificate.js';
// etc.

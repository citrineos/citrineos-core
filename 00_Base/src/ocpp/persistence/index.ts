// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { OCPP2_0_1_Namespace, OCPP1_6_Namespace, Namespace } from './namespace.js';
export { QuerySchema, MessageConfirmationSchema } from './querySchema.js';
export { default as AuthorizationDataSchema } from './schemas/AuthorizationDataSchema.json' with { type: 'json' };
export { default as BootConfigSchema } from './schemas/BootConfigSchema.json' with { type: 'json' };
export { default as ChargingStationTypeSchema } from './schemas/ChargingStationTypeSchema.json' with { type: 'json' };
export { default as ReportDataTypeSchema } from './schemas/ReportDataTypeSchema.json' with { type: 'json' };
export { default as SetVariableResultTypeSchema } from './schemas/SetVariableResultTypeSchema.json' with { type: 'json' };
export { default as UpdateChargingStationPasswordSchema } from './schemas/UpdateChargingStationPasswordRequestSchema.json' with { type: 'json' };

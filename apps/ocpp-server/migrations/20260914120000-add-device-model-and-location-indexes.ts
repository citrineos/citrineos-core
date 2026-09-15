// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { QueryInterface } from 'sequelize';

export const DEVICE_MODEL_AND_LOCATION_INDEXES: ReadonlyArray<{
  name: string;
  table: string;
  columns: string[];
}> = [
  {
    name: 'variable_attributes_tenant_connection_component_variable',
    table: 'VariableAttributes',
    columns: ['tenantId', 'ocppConnectionName', 'componentId', 'variableId'],
  },
  {
    name: 'variable_statuses_variable_attribute_id_created_at',
    table: 'VariableStatuses',
    columns: ['variableAttributeId', 'createdAt'],
  },
  {
    name: 'connectors_tenant_id_ocpp_connection_name_connector_id',
    table: 'Connectors',
    columns: ['tenantId', 'ocppConnectionName', 'connectorId'],
  },
  {
    name: 'evses_tenant_id_ocpp_connection_name_evse_type_id',
    table: 'Evses',
    columns: ['tenantId', 'ocppConnectionName', 'evseTypeId'],
  },
  {
    name: 'charging_station_sequences_tenant_id_ocpp_connection_name_type',
    table: 'ChargingStationSequences',
    columns: ['tenantId', 'ocppConnectionName', 'type'],
  },
];

const quoted = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');

export async function up(queryInterface: QueryInterface): Promise<void> {
  for (const index of DEVICE_MODEL_AND_LOCATION_INDEXES) {
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}" (${quoted(index.columns)})`,
    );
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  for (const index of DEVICE_MODEL_AND_LOCATION_INDEXES) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${index.name}"`);
  }
}

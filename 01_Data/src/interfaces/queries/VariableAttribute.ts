// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, OCPP2_0_1, QuerySchema } from '@citrineos/base';

export interface VariableAttributeQuerystring {
  stationId: string;
  tenantId: number;
  type?: OCPP2_0_1.AttributeEnumType;
  value?: string;
  status?: OCPP2_0_1.SetVariableStatusEnumType;
  component_evse_id?: number;
  component_evse_connectorId?: number | null;
  component_name?: string;
  component_instance?: string | null;
  variable_name?: string;
  variable_instance?: string | null;
}

export const VariableAttributeQuerySchema = QuerySchema('VariableAttributeQuerySchema', [
  {
    key: 'stationId',
    type: 'string',
    required: true,
  },
  {
    key: 'tenantId',
    type: 'number',
    required: true,
    defaultValue: String(DEFAULT_TENANT_ID),
  },
  {
    key: 'type',
    type: 'string',
  },
  {
    key: 'value',
    type: 'string',
  },
  {
    key: 'status',
    type: 'string',
  },
  {
    key: 'component_evse_id',
    type: 'number',
  },
  {
    key: 'component_evse_connectorId',
    type: 'number',
  },
  {
    key: 'component_name',
    type: 'string',
  },
  {
    key: 'component_instance',
    type: 'string',
  },
  {
    key: 'variable_name',
    type: 'string',
  },
  {
    key: 'variable_instance',
    type: 'string',
  },
]);

export interface CreateOrUpdateVariableAttributeQuerystring {
  tenantId: number;
  stationId: string;
  setOnCharger?: boolean; // Used to indicate value has already been accepted by the station via means other than ocpp
}

export const CreateOrUpdateVariableAttributeQuerySchema = QuerySchema(
  'CreateOrUpdateVariableAttributeQuerySchema',
  [
    {
      key: 'tenantId',
      type: 'number',
      required: true,
      defaultValue: String(DEFAULT_TENANT_ID),
    },
    {
      key: 'stationId',
      type: 'string',
      required: true,
    },
    {
      key: 'setOnCharger',
      type: 'boolean',
    },
  ],
);

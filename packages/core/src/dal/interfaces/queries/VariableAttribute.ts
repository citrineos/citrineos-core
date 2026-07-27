// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, QuerySchema } from '@citrineos/base';
import { type AttributeEnumType, type SetVariableStatusEnumType } from '@citrineos/types';

export interface VariableAttributeQuerystring {
  ocppConnectionName: string;
  tenantId: number;
  type?: AttributeEnumType;
  value?: string;
  status?: SetVariableStatusEnumType;
  component_evse_id?: number;
  component_evse_connectorId?: number | null;
  component_name?: string;
  component_instance?: string | null;
  variable_name?: string;
  variable_instance?: string | null;
}

export const VariableAttributeQuerySchema = QuerySchema('VariableAttributeQuerySchema', [
  {
    key: 'ocppConnectionName',
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
  ocppConnectionName: string;
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
      key: 'ocppConnectionName',
      type: 'string',
      required: true,
    },
    {
      key: 'setOnCharger',
      type: 'boolean',
    },
  ],
);

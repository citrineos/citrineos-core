// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, QuerySchema } from '@citrineos/base';

export interface VariableAttributeQuerystring {
  stationId: string;
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

export const VariableAttributeQuerySchema = QuerySchema(
  'VariableAttributeQuerySchema',
  [
    ['stationId', 'string'],
    ['type', 'string'],
    ['value', 'string'],
    ['status', 'string'],
    ['component_evse_id', 'number'],
    ['component_evse_connectorId', 'number'],
    ['component_name', 'string'],
    ['component_instance', 'string'],
    ['variable_name', 'string'],
    ['variable_instance', 'string'],
  ],
  ['stationId'],
);

export interface CreateOrUpdateVariableAttributeQuerystring {
  stationId: string;
  setOnCharger?: boolean; // Used to indicate value has already been accepted by the station via means other than ocpp
}

export const CreateOrUpdateVariableAttributeQuerySchema = QuerySchema(
  'CreateOrUpdateVariableAttributeQuerySchema',
  [
    ['stationId', 'string'],
    ['setOnCharger', 'boolean'],
  ],
  ['stationId'],
);

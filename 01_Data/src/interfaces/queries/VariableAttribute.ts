// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type AttributeEnumType, QuerySchema, type SetVariableStatusEnumType } from '@citrineos/base';

export interface VariableAttributeQuerystring {
  stationId: string;
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

export const VariableAttributeQuerySchema = QuerySchema(
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
  [
    ['stationId', 'string'],
    ['setOnCharger', 'boolean'],
  ],
  ['stationId'],
);

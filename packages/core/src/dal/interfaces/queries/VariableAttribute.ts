// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

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

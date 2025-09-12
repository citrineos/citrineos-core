// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { VariableAttribute, VariableStatus } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';

export function aVariableAttribute(override?: Partial<VariableAttribute>): VariableAttribute {
  const variableAttribute = {
    stationId: faker.string.uuid(),
    type: OCPP2_0_1.AttributeEnumType.Actual,
    dataType: OCPP2_0_1.DataEnumType.string,
    value: faker.string.alpha(),
    mutability: OCPP2_0_1.MutabilityEnumType.ReadWrite,
    persistent: true,
    constant: false,
    generatedAt: faker.date.recent().toISOString(),
    component: {
      name: 'SecurityCtrlr',
    },
    componentId: faker.number.int({ min: 1, max: 100_000 }),
    variable: {
      name: 'BasicAuthPassword',
    },
    variableId: faker.number.int({ min: 1, max: 100_000 }),
    ...override,
  } as VariableAttribute;

  variableAttribute.statuses =
    override?.statuses?.map(
      (status) => ({ ...status, variable: variableAttribute }) as VariableStatus,
    ) ??
    ([
      {
        value: faker.string.alpha(),
        status: 'Accepted',
        variable: variableAttribute,
      },
    ] as VariableStatus[]);

  return variableAttribute;
}

export function aBasicAuthPasswordVariable(
  override?: Partial<VariableAttribute>,
): VariableAttribute {
  return aVariableAttribute({
    ...override,
    dataType: OCPP2_0_1.DataEnumType.passwordString,
    mutability: OCPP2_0_1.MutabilityEnumType.WriteOnly,
    component: {
      tenantId: DEFAULT_TENANT_ID,
      ...override?.component,
      name: 'SecurityCtrlr',
    },
    variable: {
      tenantId: DEFAULT_TENANT_ID,
      ...override?.variable,
      name: 'BasicAuthPassword',
    },
    type: OCPP2_0_1.AttributeEnumType.Actual,
  });
}

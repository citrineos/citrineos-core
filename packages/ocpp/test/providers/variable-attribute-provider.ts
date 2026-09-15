// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1, type VariableAttributeDto } from '@citrineos/types';
import { faker } from '@faker-js/faker';

// `statuses` is a Sequelize association on the model, not a field on VariableAttributeDto, so it is
// carried here as a loose extension for the tests that inspect it.
type VariableAttributeFixture = VariableAttributeDto & { statuses?: unknown[] };

export function aVariableAttribute(
  override?: Partial<VariableAttributeFixture>,
): VariableAttributeDto {
  const variableAttribute = {
    ocppConnectionName: faker.string.uuid(),
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
  } as VariableAttributeFixture;

  variableAttribute.statuses =
    override?.statuses?.map((status) => ({
      ...(status as object),
      variable: variableAttribute,
    })) ??
    [
      {
        value: faker.string.alpha(),
        status: 'Accepted',
        variable: variableAttribute,
      },
    ];

  return variableAttribute;
}

export function aBasicAuthPasswordVariable(
  override?: Partial<VariableAttributeDto>,
): VariableAttributeDto {
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

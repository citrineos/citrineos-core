import { VariableAttribute, VariableStatus } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import {
  AttributeEnumType,
  DataEnumType,
  MutabilityEnumType,
} from '@citrineos/base';

export function aVariableAttribute(
  override?: Partial<VariableAttribute>,
): VariableAttribute {
  const variableAttribute = {
    stationId: faker.string.uuid(),
    type: AttributeEnumType.Actual,
    dataType: DataEnumType.string,
    value: faker.string.alpha(),
    mutability: MutabilityEnumType.ReadWrite,
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
      (status) =>
        ({ ...status, variable: variableAttribute }) as VariableStatus,
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
    dataType: DataEnumType.passwordString,
    mutability: MutabilityEnumType.WriteOnly,
    component: {
      ...override?.component,
      name: 'SecurityCtrlr',
    },
    variable: {
      ...override?.variable,
      name: 'BasicAuthPassword',
    },
    type: AttributeEnumType.Actual,
  });
}

import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { Boot, VariableAttribute } from '../../src';
import { OCPP2_0_1 } from '@citrineos/base';

export function aSetVariable(
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariableResultType>,
): OCPP2_0_1.SetVariableResultType {
  const setVariable: OCPP2_0_1.SetVariableResultType = {
    attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
    component: {
      name: faker.lorem.word(),
      instance: faker.string.uuid(),
    },
    variable: {
      name: faker.lorem.word(),
      instance: faker.string.uuid(),
    },
    customData: {
      vendorId: faker.string.uuid(),
    },
    attributeType: OCPP2_0_1.AttributeEnumType.Actual,
    attributeStatusInfo: {
      reasonCode: faker.lorem.word(),
      additionalInfo: faker.lorem.sentence(),
    },
  };

  return applyUpdateFunction(setVariable, updateFunction);
}

export function aBoot(updateFunction?: UpdateFunction<Boot>): Boot {
  const boot: Boot = {
    id: faker.string.uuid(),
    lastBootTime: faker.date.recent().toISOString(),
    heartbeatInterval: faker.number.int({ min: 30, max: 3600 }),
    bootRetryInterval: faker.number.int({ min: 30, max: 3600 }),
    status: 'Pending',
    getBaseReportOnPending: false,
    variablesRejectedOnLastBoot: [aSetVariable()],
    pendingBootSetVariables: [
      {
        stationId: faker.string.uuid(),
        evseDatabaseId: faker.number.int({ min: 0, max: 100 }),
        dataType: OCPP2_0_1.DataEnumType.string,
        type: OCPP2_0_1.AttributeEnumType.Actual,
        value: 'test',
        mutability: OCPP2_0_1.MutabilityEnumType.ReadWrite,
        persistent: false,
        constant: false,
        generatedAt: faker.date.recent().toISOString(),
        variableId: faker.number.int({ min: 0, max: 100 }),
        componentId: faker.number.int({ min: 0, max: 100 }),
      } as VariableAttribute,
    ],
    bootWithRejectedVariables: faker.datatype.boolean(),
  } as Boot;

  return applyUpdateFunction(boot, updateFunction);
}

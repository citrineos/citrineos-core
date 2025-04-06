import { Boot } from '@citrineos/data';
import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aValidSetVariableResult = (
  updateFunction?: UpdateFunction<OCPP2_0_1.SetVariableResultType>,
): OCPP2_0_1.SetVariableResultType => {
  const item: OCPP2_0_1.SetVariableResultType = {
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

  return applyUpdateFunction(item, updateFunction);
};

export const aValidBootConfig = (updateFunction?: UpdateFunction<Boot>): Boot => {
  const item: Boot = {
    id: faker.string.uuid(),
    lastBootTime: faker.date.recent().toISOString(),
    heartbeatInterval: faker.number.int({ min: 30, max: 3600 }),
    bootRetryInterval: faker.number.int({ min: 30, max: 3600 }),
    status: OCPP2_0_1.RegistrationStatusEnumType.Pending,
    getBaseReportOnPending: false,
    variablesRejectedOnLastBoot: [aValidSetVariableResult()],
    bootWithRejectedVariables: faker.datatype.boolean(),
  } as Boot;

  return applyUpdateFunction(item, updateFunction);
};

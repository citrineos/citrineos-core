import { Boot } from '@citrineos/data';
import {
  AttributeEnumType,
  RegistrationStatusEnumType,
  type SetVariableResultType,
  SetVariableStatusEnumType,
  SystemConfig,
} from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

type Configuration = SystemConfig['modules']['configuration'];

export const aValidSetVariableResult = (
  updateFunction?: UpdateFunction<SetVariableResultType>,
): SetVariableResultType => {
  const item: SetVariableResultType = {
    attributeStatus: SetVariableStatusEnumType.Accepted,
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
    attributeType: AttributeEnumType.Actual,
    attributeStatusInfo: {
      reasonCode: faker.lorem.word(),
      additionalInfo: faker.lorem.sentence(),
    },
  };

  return applyUpdateFunction(item, updateFunction);
};

export const aValidBootConfig = (
  updateFunction?: UpdateFunction<Boot>,
): Boot => {
  const item: Boot = {
    id: faker.string.uuid(),
    lastBootTime: faker.date.recent().toISOString(),
    heartbeatInterval: faker.number.int({ min: 30, max: 3600 }),
    bootRetryInterval: faker.number.int({ min: 30, max: 3600 }),
    status: RegistrationStatusEnumType.Pending,
    getBaseReportOnPending: false,
    variablesRejectedOnLastBoot: [aValidSetVariableResult()],
    bootWithRejectedVariables: faker.datatype.boolean(),
  } as Boot;

  return applyUpdateFunction(item, updateFunction);
};

export const aValidConfiguration = (
  updateFunction?: UpdateFunction<any>,
): any => {
  const item: Configuration = {
    bootRetryInterval: 0,
    bootWithRejectedVariables: false,
    endpointPrefix: '',
    heartbeatInterval: 0,
    unknownChargerStatus: RegistrationStatusEnumType.Rejected,
    getBaseReportOnPending: false,
    autoAccept: false,
  };

  return applyUpdateFunction(item, updateFunction);
};

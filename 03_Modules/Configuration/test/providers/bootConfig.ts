import { Boot } from '@citrineos/data';
import {
  AttributeEnumType,
  RegistrationStatusEnumType,
  type SetVariableResultType,
  SetVariableStatusEnumType,
} from '@citrineos/base';
import { faker } from '@faker-js/faker';

type UpdateFunction<T> = (item: T) => void;

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

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
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
    getBaseReportOnPending: faker.datatype.boolean(),
    variablesRejectedOnLastBoot: [aValidSetVariableResult()],
    bootWithRejectedVariables: faker.datatype.boolean(),
  } as Boot;

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};

export const aValidConfiguration = (
  updateFunction?: UpdateFunction<any>,
): any => {
  const item = {
    unknownChargerStatus: RegistrationStatusEnumType.Rejected,
    getBaseReportOnPending: false,
    autoAccept: false,
  };

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};

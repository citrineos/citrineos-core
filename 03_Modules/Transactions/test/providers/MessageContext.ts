import { IMessageContext } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aValidMessageContext = (
  updateFunction?: UpdateFunction<IMessageContext>,
): IMessageContext => {
  const item: IMessageContext = {
    correlationId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    stationId: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  };

  return applyUpdateFunction(item, updateFunction);
};

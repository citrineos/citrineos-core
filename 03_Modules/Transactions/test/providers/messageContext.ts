import { IMessageContext } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { UpdateFunction } from './update';

export const aValidMessageContext = (
  updateFunction?: UpdateFunction<IMessageContext>,
): IMessageContext => {
  const item: IMessageContext = {
    correlationId: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    stationId: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  };

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};

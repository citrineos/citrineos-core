import { DEFAULT_TENANT_ID, IMessageContext } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aMessageContext = (
  updateFunction?: UpdateFunction<IMessageContext>,
): IMessageContext => {
  const item: IMessageContext = {
    correlationId: faker.string.uuid(),
    tenantId: DEFAULT_TENANT_ID,
    stationId: faker.string.uuid(),
    timestamp: faker.date.recent().toISOString(),
  };

  return applyUpdateFunction(item, updateFunction);
};

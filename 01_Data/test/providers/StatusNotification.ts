import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { StatusNotification } from '../../src';

export function aStatusNotification(updateFunction?: UpdateFunction<StatusNotification>): StatusNotification {
  const statusNotification: StatusNotification = {
    stationId: faker.string.alpha(10),
    timestamp: new Date().toISOString(),
    connectorStatus: 'Available',
    evseId: 1,
    connectorId: 1,
    chargePointStatus: 'Available',
    errorCode: 'NoError',
    info: faker.lorem.sentence(),
    vendorId: faker.string.alpha(10),
    vendorErrorCode: 'NoError',
    customData: { vendorId: faker.string.alpha(10) },
  } as StatusNotification;

  return applyUpdateFunction(statusNotification, updateFunction);
}

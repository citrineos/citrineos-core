import { jest } from '@jest/globals';
import { faker } from '@faker-js/faker';
import { aRequest } from '../../providers/IncomingMessageProvider';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider';
import { CacheNamespace, DEFAULT_TENANT_ID, ICache } from '@citrineos/base';
import { ConnectedStationFilter } from '../../../src/networkconnection/authenticator/ConnectedStationFilter';

describe('ConnectedStationFilter', () => {
  let cache: jest.Mocked<ICache>;
  let filter: ConnectedStationFilter;

  beforeEach(() => {
    cache = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ICache>;

    filter = new ConnectedStationFilter(cache);
  });

  afterEach(() => {
    cache.get.mockReset();
  });

  it('should not reject when station is not connected', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsNotConnected();

    await filter.authenticate(DEFAULT_TENANT_ID, stationId, aRequest(), anAuthenticationOptions());

    expect(cache.get).toHaveBeenCalledWith(stationId, CacheNamespace.Connections);
  });

  it('should reject when station is already connected', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsConnected();

    await expect(
      filter.authenticate(DEFAULT_TENANT_ID, stationId, aRequest(), anAuthenticationOptions()),
    ).rejects.toThrow(`New connection attempted for already connected identifier ${stationId}`);

    expect(cache.get).toHaveBeenCalledWith(stationId, CacheNamespace.Connections);
  });

  function givenStationIsConnected() {
    cache.get.mockResolvedValue(faker.number.int({ min: 0, max: 3 }).toString() as any);
  }

  function givenStationIsNotConnected() {
    cache.get.mockResolvedValue(null as any);
  }
});

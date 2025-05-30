import { jest } from '@jest/globals';
import { ILocationRepository } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import { UnknownStationFilter } from '../../../src/networkconnection/authenticator/UnknownStationFilter';
import { aRequest } from '../../providers/IncomingMessageProvider';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

describe('UnknownStationFilter', () => {
  let locationRepository: jest.Mocked<ILocationRepository>;
  let filter: UnknownStationFilter;

  beforeEach(() => {
    locationRepository = {
      doesChargingStationExistByStationId: jest.fn(),
    } as unknown as jest.Mocked<ILocationRepository>;

    filter = new UnknownStationFilter(locationRepository);
  });

  afterEach(() => {
    locationRepository.doesChargingStationExistByStationId.mockReset();
  });

  it.each([true, false])(
    'should never reject known station',
    async (allowUnknownChargingStations) => {
      const stationId = faker.string.uuid().toString();
      givenStationExists();

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        stationId,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations }),
      );
    },
  );

  it('should reject unknown station when unknown stations are not allowed', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await expect(
      filter.authenticate(
        DEFAULT_TENANT_ID,
        stationId,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations: false }),
      ),
    ).rejects.toThrow(`Unknown identifier ${stationId}`);

    expect(locationRepository.doesChargingStationExistByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      stationId,
    );
  });

  it('should not reject unknown station when unknown stations are allowed', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await filter.authenticate(
      DEFAULT_TENANT_ID,
      stationId,
      aRequest(),
      anAuthenticationOptions({ allowUnknownChargingStations: true }),
    );

    expect(locationRepository.doesChargingStationExistByStationId).not.toHaveBeenCalledWith(
      stationId,
    );
  });

  function givenStationExists() {
    locationRepository.doesChargingStationExistByStationId.mockResolvedValue(true);
  }

  function givenStationDoesNotExist() {
    locationRepository.doesChargingStationExistByStationId.mockResolvedValue(false);
  }
});

import { jest } from '@jest/globals';
import { Authenticator } from '../../../src';
import { faker } from '@faker-js/faker';
import { ConnectedStationFilter } from '../../../src/networkconnection/authenticator/ConnectedStationFilter';
import { NetworkProfileFilter } from '../../../src/networkconnection/authenticator/NetworkProfileFilter';
import { BasicAuthenticationFilter } from '../../../src/networkconnection/authenticator/BasicAuthenticationFilter';
import { UnknownStationFilter } from '../../../src/networkconnection/authenticator/UnknownStationFilter';
import { aRequest } from '../../providers/IncomingMessageProvider';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

describe('Authenticator', () => {
  let unknownStationFilter: jest.Mocked<UnknownStationFilter>;
  let connectedStationFilter: jest.Mocked<ConnectedStationFilter>;
  let networkProfileFilter: jest.Mocked<NetworkProfileFilter>;
  let basicAuthenticationFilter: jest.Mocked<BasicAuthenticationFilter>;
  let authenticator: Authenticator;

  beforeEach(() => {
    unknownStationFilter = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<UnknownStationFilter>;

    connectedStationFilter = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<ConnectedStationFilter>;

    networkProfileFilter = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<NetworkProfileFilter>;

    basicAuthenticationFilter = {
      authenticate: jest.fn(),
    } as unknown as jest.Mocked<BasicAuthenticationFilter>;

    authenticator = new Authenticator(
      unknownStationFilter,
      connectedStationFilter,
      networkProfileFilter,
      basicAuthenticationFilter,
    );
  });

  afterEach(() => {
    unknownStationFilter.authenticate.mockReset();
    connectedStationFilter.authenticate.mockReset();
    networkProfileFilter.authenticate.mockReset();
    basicAuthenticationFilter.authenticate.mockReset();
  });

  it('should reject when unknown station filter rejects', async () => {
    const stationId = faker.string.uuid().toString();
    unknownStationFilter.authenticate.mockRejectedValue(new Error('Unknown station'));

    await expect(
      authenticator.authenticate(
        aRequest({ url: `wss://citrineos.io/${stationId}` }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions(),
      ),
    ).rejects.toThrow();

    expect(connectedStationFilter.authenticate).not.toHaveBeenCalled();
    expect(networkProfileFilter.authenticate).not.toHaveBeenCalled();
    expect(basicAuthenticationFilter.authenticate).not.toHaveBeenCalled();
  });

  it('should reject when connected station filter rejects', async () => {
    const stationId = faker.string.uuid().toString();
    unknownStationFilter.authenticate.mockResolvedValue(undefined);
    connectedStationFilter.authenticate.mockRejectedValue(new Error('Station already connected'));

    await expect(
      authenticator.authenticate(
        aRequest({ url: `wss://citrineos.io/${stationId}` }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions(),
      ),
    ).rejects.toThrow();

    expect(networkProfileFilter.authenticate).not.toHaveBeenCalled();
    expect(basicAuthenticationFilter.authenticate).not.toHaveBeenCalled();
  });

  it('should reject when network profile filter rejects', async () => {
    const stationId = faker.string.uuid().toString();
    unknownStationFilter.authenticate.mockResolvedValue(undefined);
    connectedStationFilter.authenticate.mockResolvedValue(undefined);
    networkProfileFilter.authenticate.mockRejectedValue(new Error('Unauthorized'));

    await expect(
      authenticator.authenticate(
        aRequest({ url: `wss://citrineos.io/${stationId}` }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions(),
      ),
    ).rejects.toThrow();

    expect(basicAuthenticationFilter.authenticate).not.toHaveBeenCalled();
  });

  it('should reject when basic authentication filter rejects', async () => {
    const stationId = faker.string.uuid().toString();
    unknownStationFilter.authenticate.mockResolvedValue(undefined);
    connectedStationFilter.authenticate.mockResolvedValue(undefined);
    networkProfileFilter.authenticate.mockResolvedValue(undefined);
    basicAuthenticationFilter.authenticate.mockRejectedValue(new Error('Unauthorized'));

    await expect(async () => {
      await authenticator.authenticate(
        aRequest({ url: `wss://citrineos.io/${stationId}` }),
        DEFAULT_TENANT_ID,
        anAuthenticationOptions(),
      );
    }).rejects.toThrow();
  });

  it('should return identifier when all filters pass', async () => {
    const stationId = faker.string.uuid().toString();
    unknownStationFilter.authenticate.mockResolvedValue(undefined);
    connectedStationFilter.authenticate.mockResolvedValue(undefined);
    networkProfileFilter.authenticate.mockResolvedValue(undefined);
    basicAuthenticationFilter.authenticate.mockResolvedValue(undefined);

    const identifier = await authenticator.authenticate(
      aRequest({ url: `wss://citrineos.io/${stationId}` }),
      DEFAULT_TENANT_ID,
      anAuthenticationOptions(),
    );

    expect(identifier).toEqual({ identifier: stationId });
  });
});

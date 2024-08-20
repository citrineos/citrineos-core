import { jest } from '@jest/globals';
import {
  ChargingStation,
  IDeviceModelRepository,
  ILocationRepository,
  VariableAttribute,
} from '@citrineos/data';
import {
  AttributeEnumType,
  CacheNamespace,
  ICache,
  SetVariableStatusEnumType,
} from '@citrineos/base';
import { Authenticator } from '../../../src';
import { faker } from '@faker-js/faker';
import { aBasicAuthPasswordVariable } from '../../providers/VariableAttributeProvider';
import { aChargingStation } from '../../providers/ChargingStationProvider';

type PasswordPair = {
  plaintext: string;
  hash: string;
};

describe('Authenticator', () => {
  const password: PasswordPair = {
    plaintext: 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3',
    hash: '$2b$10$p2i423u55xbzTZ4yiiRog.QIKEQpg6G3oMtv.FTMfZdST7f9NSC2u',
  };

  const anotherPassword: PasswordPair = {
    plaintext: '_Oec8yF4r1hH6ildo4yvM25:SU2hpL*jobDskYos',
    hash: '$2b$10$rLoAseNoS.CC2tBBfowOFudwh0g8PiJeD1a7Zcw5ux.HREo/qblzC',
  };

  let cache: jest.Mocked<ICache>;
  let locationRepository: jest.Mocked<ILocationRepository>;
  let deviceModelRepository: jest.Mocked<IDeviceModelRepository>;
  let authenticator: Authenticator;

  beforeEach(() => {
    cache = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ICache>;

    locationRepository = {
      readChargingStationByStationId: jest.fn(),
    } as unknown as jest.Mocked<ILocationRepository>;

    deviceModelRepository = {
      readAllByQuerystring: jest.fn(),
    } as unknown as jest.Mocked<IDeviceModelRepository>;

    authenticator = new Authenticator(
      cache,
      locationRepository,
      deviceModelRepository,
    );
  });

  afterEach(() => {
    cache.get.mockReset();
    locationRepository.readChargingStationByStationId.mockReset();
    deviceModelRepository.readAllByQuerystring.mockReset();
  });

  it('should return false for unknown station when unknown stations are not allowed', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsNotConnected();
    givenPassword(stationId, password.hash);

    const result = await authenticator.authenticate(
      false,
      stationId,
      stationId,
      password.plaintext,
    );

    expect(result).toEqual(false);
    expect(
      locationRepository.readChargingStationByStationId,
    ).toHaveBeenCalledWith(stationId);
  });

  it('should return false when known station is already connected', async () => {
    const station = givenChargingStation(aChargingStation());
    givenStationIsConnected();
    givenPassword(station.id, password.hash);

    const result = await authenticator.authenticate(
      false,
      station.id,
      station.id,
      password.plaintext,
    );

    expect(result).toEqual(false);
    expect(cache.get).toHaveBeenCalledWith(
      station.id,
      CacheNamespace.Connections,
    );
  });

  it('should return false when unknown station is already connected', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsConnected();
    givenPassword(stationId, password.hash);

    const result = await authenticator.authenticate(
      true,
      stationId,
      stationId,
      password.plaintext,
    );

    expect(result).toEqual(false);
    expect(cache.get).toHaveBeenCalledWith(
      stationId,
      CacheNamespace.Connections,
    );
  });

  it.each([
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      ' 9a06661c-2332-4897-b0d4-2187671dbe7b',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '9a06661c-2332-4897-b0d4-2187671dbe7b ',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '9a06661c-2332-4897-b0d4-2187671dbe7bb',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '8a06661c-2332-4897-b0d4-2187671dbe7b',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      'bc2696f3-66d5-4027-9eae-be74c1e85fa7',
    ],
  ])(
    'should return false when unknown station identifier does not match username',
    async (stationId, username) => {
      givenStationIsNotConnected();
      givenPassword(stationId, password.hash);

      const result = await authenticator.authenticate(
        true,
        stationId,
        username,
        password.plaintext,
      );

      expect(result).toEqual(false);
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      ' 9a06661c-2332-4897-b0d4-2187671dbe7b',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '9a06661c-2332-4897-b0d4-2187671dbe7b ',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '9a06661c-2332-4897-b0d4-2187671dbe7bb',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      '8a06661c-2332-4897-b0d4-2187671dbe7b',
    ],
    [
      '9a06661c-2332-4897-b0d4-2187671dbe7b',
      'bc2696f3-66d5-4027-9eae-be74c1e85fa7',
    ],
  ])(
    'should return false when known station identifier does not match username',
    async (stationId, username) => {
      const station = givenChargingStation(aChargingStation({ id: stationId }));
      givenStationIsNotConnected();
      givenPassword(stationId, password.hash);

      const result = await authenticator.authenticate(
        false,
        station.id,
        username,
        password.plaintext,
      );

      expect(result).toEqual(false);
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    },
  );

  it('should return false when password is not found for unknown station', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsNotConnected();
    givenNoVariableAttributes();

    const result = await authenticator.authenticate(
      true,
      stationId,
      stationId,
      password.plaintext,
    );

    expect(result).toEqual(false);
    expect(deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith({
      stationId: stationId,
      component_name: 'SecurityCtrlr',
      variable_name: 'BasicAuthPassword',
      type: AttributeEnumType.Actual,
    });
  });

  it('should return false when password is not found for known station', async () => {
    const station = givenChargingStation(aChargingStation());
    givenStationIsNotConnected();
    givenNoVariableAttributes();

    const result = await authenticator.authenticate(
      false,
      station.id,
      station.id,
      password.plaintext,
    );

    expect(result).toEqual(false);
    expect(deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith({
      stationId: station.id,
      component_name: 'SecurityCtrlr',
      variable_name: 'BasicAuthPassword',
      type: AttributeEnumType.Actual,
    });
  });

  it.each([
    {
      statuses: [
        {
          value: password.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
      ],
      authenticationPassword: password.plaintext,
      expectedAuthenticationResult: true,
    },
    {
      statuses: [
        {
          value: password.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
      ],
      authenticationPassword: anotherPassword.plaintext,
      expectedAuthenticationResult: false,
    },
    ...[
      SetVariableStatusEnumType.Rejected,
      SetVariableStatusEnumType.UnknownComponent,
      SetVariableStatusEnumType.UnknownVariable,
      SetVariableStatusEnumType.NotSupportedAttributeType,
      SetVariableStatusEnumType.RebootRequired,
    ].map((status) => ({
      statuses: faker.helpers.shuffle([
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T16:03:53Z'),
        },
        {
          value: anotherPassword.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T14:30:00Z'),
        },
      ]),
      authenticationPassword: anotherPassword.plaintext,
      expectedAuthenticationResult: true,
    })),
    ...[
      SetVariableStatusEnumType.Rejected,
      SetVariableStatusEnumType.UnknownComponent,
      SetVariableStatusEnumType.UnknownVariable,
      SetVariableStatusEnumType.NotSupportedAttributeType,
      SetVariableStatusEnumType.RebootRequired,
    ].map((status) => ({
      statuses: faker.helpers.shuffle([
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T16:03:53Z'),
        },
        {
          value: anotherPassword.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T14:30:00Z'),
        },
      ]),
      authenticationPassword: password.plaintext,
      expectedAuthenticationResult: false,
    })),
  ])(
    'should use the latest successfully set charger password',
    async ({
      statuses,
      authenticationPassword,
      expectedAuthenticationResult,
    }) => {
      const station = givenChargingStation(aChargingStation());
      givenStationIsNotConnected();
      givenVariableAttribute(
        aBasicAuthPasswordVariable({
          stationId: station.id,
          statuses: statuses,
        } as Partial<VariableAttribute>),
      );

      const result = await authenticator.authenticate(
        false,
        station.id,
        station.id,
        authenticationPassword,
      );

      expect(result).toEqual(expectedAuthenticationResult);
    },
  );

  it.each([
    {
      statuses: [
        {
          value: password.hash,
          status: SetVariableStatusEnumType.Rejected,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
      ],
      authenticationPassword: password.plaintext,
      expectedAuthenticationResult: false,
    },
    ...[
      SetVariableStatusEnumType.Rejected,
      SetVariableStatusEnumType.UnknownComponent,
      SetVariableStatusEnumType.UnknownVariable,
      SetVariableStatusEnumType.NotSupportedAttributeType,
      SetVariableStatusEnumType.RebootRequired,
    ].map((status) => ({
      statuses: faker.helpers.shuffle([
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T16:03:53Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
        {
          value: anotherPassword.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T14:30:00Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T14:12:41Z'),
        },
      ]),
      authenticationPassword: anotherPassword.plaintext,
      expectedAuthenticationResult: true,
    })),
    ...[
      SetVariableStatusEnumType.Rejected,
      SetVariableStatusEnumType.UnknownComponent,
      SetVariableStatusEnumType.UnknownVariable,
      SetVariableStatusEnumType.NotSupportedAttributeType,
      SetVariableStatusEnumType.RebootRequired,
    ].map((status) => ({
      statuses: faker.helpers.shuffle([
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T16:03:53Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T15:30:00Z'),
        },
        {
          value: anotherPassword.hash,
          status: SetVariableStatusEnumType.Accepted,
          createdAt: new Date('2024-08-19T14:30:00Z'),
        },
        {
          value: password.hash,
          status: status,
          createdAt: new Date('2024-08-19T14:12:41Z'),
        },
      ]),
      authenticationPassword: password.plaintext,
      expectedAuthenticationResult: false,
    })),
  ])(
    'should ignore rejected password updates',
    async ({
      statuses,
      authenticationPassword,
      expectedAuthenticationResult,
    }) => {
      const station = givenChargingStation(aChargingStation());
      givenStationIsNotConnected();
      givenVariableAttribute(
        aBasicAuthPasswordVariable({
          stationId: station.id,
          statuses: statuses,
        } as Partial<VariableAttribute>),
      );

      const result = await authenticator.authenticate(
        false,
        'cp001',
        'cp001',
        authenticationPassword,
      );

      expect(result).toEqual(expectedAuthenticationResult);
    },
  );

  function givenChargingStation(station: ChargingStation): ChargingStation {
    locationRepository.readChargingStationByStationId.mockResolvedValue(
      station,
    );
    return station;
  }

  function givenStationIsConnected() {
    cache.get.mockResolvedValue(
      faker.number.int({ min: 0, max: 3 }).toString() as any,
    );
  }

  function givenStationIsNotConnected() {
    cache.get.mockResolvedValue(null as any);
  }

  function givenVariableAttribute(
    attribute: VariableAttribute,
  ): VariableAttribute {
    deviceModelRepository.readAllByQuerystring.mockResolvedValue([attribute]);
    return attribute;
  }

  function givenPassword(stationId: string, passwordHash: string): void {
    givenVariableAttribute(
      aBasicAuthPasswordVariable({
        stationId: stationId,
        statuses: [
          {
            value: passwordHash,
            status: SetVariableStatusEnumType.Accepted,
            createdAt: new Date('2024-08-19T15:30:00Z'),
          },
        ],
      } as Partial<VariableAttribute>),
    );
  }

  function givenNoVariableAttributes() {
    deviceModelRepository.readAllByQuerystring.mockResolvedValue([]);
  }
});

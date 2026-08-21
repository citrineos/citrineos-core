// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import { type BootstrapConfig, DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  AuthorizationStatusEnum,
  EventGroup,
  IdTokenEnum,
  type IdTokenEnumType,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP2_0_1,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
} from '@citrineos/types';
import {
  Authorization,
  ChargingStation,
  DefaultSequelizeInstance,
  SequelizeAuthorizationRepository,
  SequelizeTransactionEventRepository,
  Tenant,
  Transaction,
} from '@citrineos/dal';
import { AuthorizeRequestOcpp16Handler, AuthorizeRequestOcpp201Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';

/**
 * The round trip a depot vehicle makes: enrolled once as an Authorization row keyed on its MAC,
 * then presented by the charger on plug-in over whichever OCPP version that charger speaks, and
 * finally joined back to the kWh it drew. Enrolment here writes the row the Hasura mutation writes
 * - insert_Authorizations_one against public.Authorizations, whose insert permission grants role
 * `user` every column under a tenantId check - so the row under test is the row a fleet portal
 * would create.
 *
 * The three legs resolve the token differently, and that asymmetry is the reason this exists:
 * 2.0.1 matches on (idToken, idTokenType), 1.6 has no type to match on and so matches on the
 * string alone, and attribution matches on the pair again.
 */
const VEHICLE_MAC = 'AA:BB:CC:DD:EE:FF';
const STATION = 'CP-DEPOT-1';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: BootstrapConfig;

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  config = {
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

/** Enrols a token exactly as the Hasura insert mutation would. */
async function enrol(idToken: string, idTokenType: IdTokenEnumType) {
  return Authorization.create({
    idToken,
    idTokenType,
    status: AuthorizationStatusEnum.Accepted,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

function anOcpp201Authorize(
  idToken: string,
  type: OCPP2_0_1.IdTokenEnumType,
): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-1',
      timestamp: new Date().toISOString(),
    },
    payload: { idToken: { idToken, type } },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Authorize,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OcppRequest>;
}

function anOcpp16Authorize(idTag: string): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-1',
      timestamp: new Date().toISOString(),
    },
    payload: { idTag },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Authorize,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OcppRequest>;
}

describe('A depot vehicle token, enrolled once and presented by a charger', () => {
  const { container } = createTestContainer();

  function anAuthorizationRepository() {
    return new SequelizeAuthorizationRepository({
      config,
      logger: undefined,
      sequelizeInstance,
    } as never);
  }

  /** Runs the real handler and hands back the AuthorizeResponse it put on the wire. */
  async function authorizeOver201(idToken: string, type: OCPP2_0_1.IdTokenEnumType) {
    const ocppSender = makeMockOcppSender();
    const handler = getTestInstance(container, AuthorizeRequestOcpp201Handler, {
      ocppSender,
      authorizers: [],
      authorizationRepository: anAuthorizationRepository(),
      // Neither is reachable for a token carrying no certificate and no EVSE restrictions.
      certificateAuthorityService: {} as never,
      deviceModelRepository: { readAllByQuerystring: async () => [] } as never,
    });

    await handler.handle(anOcpp201Authorize(idToken, type) as never);

    return ocppSender.sendCallResultWithMessage.mock.calls[0]?.[1] as OCPP2_0_1.AuthorizeResponse;
  }

  async function authorizeOver16(idTag: string) {
    const ocppSender = makeMockOcppSender();
    const handler = getTestInstance(container, AuthorizeRequestOcpp16Handler, {
      ocppSender,
      authorizers: [],
      authorizationRepository: anAuthorizationRepository(),
    });

    await handler.handle(anOcpp16Authorize(idTag) as never);

    return ocppSender.sendCallResultWithMessage.mock.calls[0]?.[1] as OCPP1_6.AuthorizeResponse;
  }

  beforeEach(async () => {
    await Transaction.destroy({ where: {}, truncate: true, cascade: true });
    await Authorization.destroy({ where: {}, truncate: true, cascade: true });
    await ChargingStation.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'Depot' } as never);
    await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
  });

  it('authorises over 2.0.1 when the charger presents the MAC it was enrolled under', async () => {
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);

    const response = await authorizeOver201(VEHICLE_MAC, OCPP2_0_1.IdTokenEnumType.MacAddress);

    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
  });

  it('authorises over 1.6, where the same row is found by the idTag alone', async () => {
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);

    const response = await authorizeOver16(VEHICLE_MAC);

    expect(response.idTagInfo.status).toBe(OCPP1_6.AuthorizeResponseStatus.Accepted);
  });

  it('refuses a 2.0.1 request that names the right MAC under the wrong type', async () => {
    // A remote start sent with idTokenType Central rather than the vehicle's own type resolves
    // against nothing, because 2.0.1 matches on both columns. The session is refused outright,
    // not merely left unattributed.
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);

    const response = await authorizeOver201(VEHICLE_MAC, OCPP2_0_1.IdTokenEnumType.Central);

    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Unknown);
  });

  it('matches the MAC irrespective of case, because idToken is CITEXT', async () => {
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);

    const over201 = await authorizeOver201(
      VEHICLE_MAC.toLowerCase(),
      OCPP2_0_1.IdTokenEnumType.MacAddress,
    );
    const over16 = await authorizeOver16(VEHICLE_MAC.toLowerCase());

    expect(over201.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
    expect(over16.idTagInfo.status).toBe(OCPP1_6.AuthorizeResponseStatus.Accepted);
  });

  it('does not match the same MAC written with different separators', async () => {
    // Case is forgiving; punctuation is not. AA:BB:.. , AA-BB-.. and AABB.. are three tokens, so
    // the MAC has to be normalised to one form at enrolment and emitted in that form by every
    // charger. All three are valid OCPP identifierStrings, so nothing rejects them earlier.
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);

    const unpunctuated = await authorizeOver201(
      'AABBCCDDEEFF',
      OCPP2_0_1.IdTokenEnumType.MacAddress,
    );
    const hyphenated = await authorizeOver201(
      'AA-BB-CC-DD-EE-FF',
      OCPP2_0_1.IdTokenEnumType.MacAddress,
    );

    expect(unpunctuated.idTokenInfo.status).toBe(AuthorizationStatusEnum.Unknown);
    expect(hyphenated.idTokenInfo.status).toBe(AuthorizationStatusEnum.Unknown);
  });

  it('breaks 1.6 if the same MAC is enrolled a second time under another type', async () => {
    // The composite unique is (idToken, idTokenType, tenantId), so enrolling the MAC a second time
    // as Central to satisfy a Central-typed remote start is permitted. 1.6 then finds two rows for
    // one idTag and refuses, so the workaround for 2.0.1 is what takes 1.6 down.
    await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);
    await enrol(VEHICLE_MAC, IdTokenEnum.Central);

    const over201 = await authorizeOver201(VEHICLE_MAC, OCPP2_0_1.IdTokenEnumType.MacAddress);
    const over16 = await authorizeOver16(VEHICLE_MAC);

    expect(over201.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
    expect(over16.idTagInfo.status).toBe(OCPP1_6.AuthorizeResponseStatus.Invalid);
  });

  it('joins the energy back to the enrolled vehicle through Transaction.authorizationId', async () => {
    // The half of the round trip a fleet portal bills on: the session has to name the row, so the
    // kWh can be attributed to one truck.
    const enrolled = await enrol(VEHICLE_MAC, IdTokenEnum.MacAddress);
    const repository = new SequelizeTransactionEventRepository({
      config,
      logger: undefined,
      sequelizeInstance,
    } as never);

    const transaction = await repository.createOrUpdateTransactionByTransactionEventAndStationId(
      DEFAULT_TENANT_ID,
      {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.Authorized,
        seqNo: 0,
        transactionInfo: { transactionId: 'txn-1' },
        idToken: { idToken: VEHICLE_MAC, type: OCPP2_0_1.IdTokenEnumType.MacAddress },
      } as never,
      STATION,
    );

    expect(transaction.authorizationId).toBe((enrolled as unknown as { id: number }).id);
  });
});

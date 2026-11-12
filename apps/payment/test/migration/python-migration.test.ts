// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryTypes } from 'sequelize';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyPlan, OpenPythonCheckoutsError } from '../../src/migration/apply.js';
import { readCoreSnapshot } from '../../src/migration/core-snapshot.js';
import { planMigration } from '../../src/migration/plan.js';
import { readPythonData } from '../../src/migration/python-source.js';
import type { PlanOptions } from '../../src/migration/types.js';
import { AccountAction, Comparison, TariffMatch } from '../../src/migration/types.js';
import { SequelizePaymentAccountRepository } from '../../src/repositories/index.js';
import {
  resetDatabase,
  startTestDatabase,
  TENANT_A,
  type TestDatabase,
} from '../support/database.js';

let db: TestDatabase;
let source: string;
let stationId: number;
const accounts = new SequelizePaymentAccountRepository();
const OPTIONS: PlanOptions = {
  publicUrl: 'http://localhost:9010',
  pythonIdTokenPrefix: 'PAY_',
  idTokenPrefix: 'PAY_',
};

beforeAll(async () => {
  db = await startTestDatabase();
  const { host, port, database, username, password } = db.sequelize.config;
  source = `postgres://${username}:${password}@${host}:${port}/${database}`;
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

/** The tables citrineos-payment's init_db.py creates, with DB_TABLE_PREFIX `ampay_`. */
async function aPythonInstallation() {
  await db.sequelize.query(`
    DROP TABLE IF EXISTS ampay_checkouts, ampay_connectors, ampay_evses, ampay_locations,
      ampay_operators, ampay_tariffs CASCADE;
    CREATE TABLE ampay_operators (id serial PRIMARY KEY, name varchar(255) NOT NULL UNIQUE,
      stripe_account_id varchar(255) NOT NULL UNIQUE);
    CREATE TABLE ampay_locations (id serial PRIMARY KEY, location_id varchar(36) NOT NULL UNIQUE,
      address varchar(255), postal_code varchar(10), city varchar(45), state varchar(45),
      country varchar(3), operator_id integer REFERENCES ampay_operators(id));
    CREATE TABLE ampay_tariffs (id serial PRIMARY KEY, price_kwh float, price_minute float,
      price_session float, currency varchar(3) NOT NULL, tax_rate float NOT NULL,
      authorization_amount float NOT NULL, payment_fee float NOT NULL, stripe_price_id varchar(255) UNIQUE);
    CREATE TABLE ampay_evses (id serial PRIMARY KEY, evse_id varchar(48) NOT NULL UNIQUE,
      ocpp_evse_id integer NOT NULL, status varchar(48) NOT NULL, station_id varchar(255) NOT NULL,
      tenant_id varchar(3) NOT NULL, location_id integer REFERENCES ampay_locations(id));
    CREATE TABLE ampay_connectors (id serial PRIMARY KEY, connector_id varchar(36) NOT NULL,
      power_type varchar(20) NOT NULL, max_voltage integer NOT NULL, max_amperage integer NOT NULL,
      evse_id integer REFERENCES ampay_evses(id), tariff_id integer REFERENCES ampay_tariffs(id));
    CREATE TABLE ampay_checkouts (id serial PRIMARY KEY, payment_intent_id varchar(255) UNIQUE,
      authorization_amount float, connector_id integer REFERENCES ampay_connectors(id),
      tariff_id integer REFERENCES ampay_tariffs(id), qr_code_message_id integer,
      remote_request_status varchar(8), remote_request_transaction_id varchar(36),
      transaction_start_time timestamptz, transaction_end_time timestamptz,
      transaction_last_meter_reading float, transaction_kwh float, power_active_import float,
      transaction_soc float);
    INSERT INTO ampay_operators (name, stripe_account_id) VALUES ('CitrineOS', 'acct_citrineos');
    INSERT INTO ampay_locations (location_id, address, postal_code, city, state, country, operator_id)
      VALUES ('LOC1', '1 Main Street', '02110', 'Boston', 'MA', 'USA', 1);
    INSERT INTO ampay_tariffs (price_kwh, price_minute, price_session, currency, tax_rate,
      authorization_amount, payment_fee) VALUES (0.42, 0.05, 1.5, 'USD', 19, 50, 2);
    INSERT INTO ampay_evses (evse_id, ocpp_evse_id, status, station_id, tenant_id, location_id)
      VALUES ('US*CIT*E1', 1, 'Available', 'CS-1', 'T01', 1);
    INSERT INTO ampay_connectors (connector_id, power_type, max_voltage, max_amperage, evse_id, tariff_id)
      VALUES ('1', 'AC_3_PHASE', 400, 32, 1, 1);
    INSERT INTO ampay_checkouts (id, payment_intent_id, authorization_amount, connector_id,
      transaction_end_time) VALUES (57, 'pi_old', 5000, 1, now() - interval '30 days');
    -- Opened, never paid: its payment intent id was set when the Checkout Session was created.
    INSERT INTO ampay_checkouts (id, payment_intent_id, connector_id) VALUES (56, 'pi_abandoned', 1);
  `);
}

async function insert(table: string, row: Record<string, unknown>): Promise<number> {
  const columns = Object.keys(row);
  const [result] = await db.sequelize.query<{ id: number }>(
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}, "createdAt", "updatedAt")
     VALUES (${columns.map((c) => `:${c}`).join(', ')}, now(), now()) RETURNING id`,
    { replacements: row, type: QueryTypes.SELECT },
  );
  return result.id;
}

beforeEach(async () => {
  await db.sequelize.query(
    'TRUNCATE TABLE "Authorizations", "Transactions", "Connectors", "Evses", "ChargingStations" RESTART IDENTITY CASCADE;',
  );
  await resetDatabase(db);
  await db.sequelize.query(`SELECT setval('"Checkouts_id_seq"', 1, false)`);
  await aPythonInstallation();
  stationId = await insert('ChargingStations', {
    ocppConnectionName: 'CS-1',
    isOnline: true,
    protocol: 'ocpp2.0.1',
    tenantId: TENANT_A,
  });
  const evseId = await insert('Evses', { stationId, evseTypeId: 1, tenantId: TENANT_A });
  await insert('Connectors', {
    stationId,
    evseId,
    connectorId: 1,
    evseTypeConnectorId: 1,
    tenantId: TENANT_A,
  });
  // An idToken the Python service issued, with the same prefix.
  await insert('Authorizations', {
    idToken: 'PAY_90',
    idTokenType: 'Central',
    status: 'Accepted',
    concurrentTransaction: false,
    tenantId: TENANT_A,
  });
});

describe('the Python migration', () => {
  it('reads the Python tables and Core, and plans the move', async () => {
    const python = await readPythonData(source, 'ampay_');
    const core = await readCoreSnapshot(db.sequelize, 'PAY_');

    expect(python).toMatchObject({
      operators: [{ name: 'CitrineOS', stripeAccountId: 'acct_citrineos' }],
      locations: [{ address: { address: '1 Main Street', city: 'Boston', country: 'USA' } }],
      evses: [{ emi3EvseId: 'US*CIT*E1', stationId: 'CS-1', tenantId: 'T01' }],
      tariffs: [{ currency: 'USD', pricePerKwh: 0.42, authorizationAmount: 50 }],
      maxCheckoutId: 57,
      paidCheckouts: [],
    });
    expect(core).toMatchObject({ highestIssuedCheckoutId: 90, nextCheckoutId: 1 });

    const plan = planMigration(python, core, OPTIONS);
    expect(plan.accounts).toEqual([
      {
        tenantId: TENANT_A,
        stripeAccountId: 'acct_citrineos',
        operators: ['CitrineOS'],
        action: AccountAction.Create,
      },
    ]);
    expect(plan.evses[0]).toMatchObject({
      tenantId: TENANT_A,
      emi3: { status: Comparison.Missing },
      qrCodeUrl: expect.stringMatching(/^http:\/\/localhost:9010\/checkout\/\d+$/),
      address: { status: Comparison.Missing, python: '1 Main Street, 02110 Boston, MA, USA' },
      connectors: [{ tariff: { status: TariffMatch.Missing } }],
    });
    expect(plan.checkoutSequence).toEqual({ current: 1, next: 91 });
  });

  it('creates the accounts and moves the checkout ids on, once', async () => {
    const run = async () =>
      planMigration(
        await readPythonData(source, 'ampay_'),
        await readCoreSnapshot(db.sequelize, 'PAY_'),
        OPTIONS,
      );

    const first = await run();
    expect(await applyPlan(first, db.sequelize, accounts, { scanAndChargeEnabled: true })).toEqual({
      accountsCreated: 1,
      checkoutSequenceSetTo: 91,
    });
    expect(await accounts.findByTenantId(TENANT_A)).toMatchObject({
      stripeAccountId: 'acct_citrineos',
      scanAndChargeEnabled: true,
    });
    const [{ next }] = await db.sequelize.query<{ next: string }>(
      `SELECT nextval('"Checkouts_id_seq"') AS next`,
      { type: QueryTypes.SELECT },
    );
    expect(Number(next)).toBe(91);

    const second = await run();
    expect(second.accounts[0].action).toBe(AccountAction.Exists);
    expect(second.checkoutSequence).toBeNull();
  });

  it('leaves the Python tables as they were', async () => {
    await applyPlan(
      planMigration(
        await readPythonData(source, 'ampay_'),
        await readCoreSnapshot(db.sequelize, 'PAY_'),
        OPTIONS,
      ),
      db.sequelize,
      accounts,
      { scanAndChargeEnabled: false },
    );

    const [{ count }] = await db.sequelize.query<{ count: string }>(
      'SELECT count(*) AS count FROM ampay_checkouts',
      { type: QueryTypes.SELECT },
    );
    expect(Number(count)).toBe(2);
  });

  it('changes nothing while a session the Python service took payment for is charging', async () => {
    await db.sequelize.query(`
      INSERT INTO ampay_checkouts (id, payment_intent_id, authorization_amount, connector_id,
        remote_request_status, remote_request_transaction_id)
        VALUES (58, 'pi_open', 5000, 1, 'Accepted', 'tx-58');
    `);
    await insert('Transactions', {
      stationId,
      transactionId: 'tx-58',
      isActive: true,
      tenantId: TENANT_A,
    });
    const python = await readPythonData(source, 'ampay_');
    expect(python.paidCheckouts).toEqual([
      {
        id: 58,
        paymentIntentId: 'pi_open',
        stripeAccountId: 'acct_citrineos',
        stationId: 'CS-1',
        transactionId: 'tx-58',
        ended: false,
      },
    ]);
    const plan = planMigration(python, await readCoreSnapshot(db.sequelize, 'PAY_'), OPTIONS);
    expect(plan.pythonSessions.running).toMatchObject([{ checkoutId: 58 }]);

    await expect(
      applyPlan(plan, db.sequelize, accounts, { scanAndChargeEnabled: false }),
    ).rejects.toThrow(OpenPythonCheckoutsError);
    expect(await accounts.findByTenantId(TENANT_A)).toBeUndefined();

    expect(
      await applyPlan(plan, db.sequelize, accounts, {
        scanAndChargeEnabled: false,
        ignoreOpenPythonCheckouts: true,
      }),
    ).toMatchObject({ accountsCreated: 1 });
  });

  it('refuses a table prefix that is not a plain identifier', async () => {
    await expect(readPythonData(source, 'x"; DROP TABLE y; --')).rejects.toThrow(
      'plain identifier',
    );
  });
});

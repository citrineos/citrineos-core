// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { planMigration } from '../../src/migration/plan.js';
import { formatReport } from '../../src/migration/report.js';
import type {
  Address,
  CoreSnapshot,
  PlanOptions,
  PythonData,
  PythonPaidCheckout,
  StripeFindings,
  TariffValues,
} from '../../src/migration/types.js';
import { AccountAction, Comparison, TariffMatch } from '../../src/migration/types.js';

const OPTIONS: PlanOptions = {
  publicUrl: 'https://pay.example.com/',
  pythonIdTokenPrefix: 'PAY_',
  idTokenPrefix: 'PAY_',
};

const PRICES: TariffValues = {
  currency: 'USD',
  pricePerKwh: 0.42,
  pricePerMin: 0.05,
  pricePerSession: 1.5,
  taxRate: 19,
  authorizationAmount: 50,
  paymentFee: 2,
};

const ADDRESS: Address = {
  address: '1 Main Street',
  postalCode: '02110',
  city: 'Boston',
  state: 'MA',
  country: 'USA',
};

function aPython(overrides: Partial<PythonData> = {}): PythonData {
  return {
    operators: [{ id: 1, name: 'CitrineOS', stripeAccountId: 'acct_citrineos' }],
    locations: [{ id: 1, operatorId: 1, address: ADDRESS }],
    evses: [
      {
        id: 1,
        emi3EvseId: 'US*CIT*E1',
        ocppEvseId: 1,
        stationId: 'CS-1',
        // Core's tenant id before Core had tenants.
        tenantId: 'T01',
        locationId: 1,
      },
    ],
    connectors: [{ id: 1, connectorId: '1', evseId: 1, tariffId: 1 }],
    tariffs: [{ id: 1, ...PRICES }],
    maxCheckoutId: 120,
    paidCheckouts: [],
    ...overrides,
  };
}

function aCore(overrides: Partial<CoreSnapshot> = {}): CoreSnapshot {
  return {
    tenants: [
      { id: 1, name: 'Default Tenant' },
      { id: 2, name: 'CitrineOS' },
    ],
    stations: [{ id: 10, tenantId: 1, ocppConnectionName: 'CS-1', locationId: 5 }],
    evses: [{ id: 20, tenantId: 1, stationId: 10, evseTypeId: 1, evseId: null }],
    connectors: [
      {
        id: 30,
        tenantId: 1,
        evseId: 20,
        stationId: 10,
        connectorId: undefined,
        evseTypeConnectorId: 1,
        tariffId: null,
      },
    ],
    tariffs: [],
    locations: [{ id: 5, tenantId: 1, ...ADDRESS }],
    activeTransactions: [],
    paymentAccounts: [],
    highestIssuedCheckoutId: 0,
    nextCheckoutId: 1,
    ...overrides,
  };
}

/** Plans with the options a run passes. */
function planFor(python: PythonData, core: CoreSnapshot, stripe?: StripeFindings) {
  return planMigration(python, core, { ...OPTIONS, stripe });
}

function aPaidCheckout(overrides: Partial<PythonPaidCheckout> = {}): PythonPaidCheckout {
  return {
    id: 57,
    paymentIntentId: 'pi_57',
    stripeAccountId: 'acct_citrineos',
    stationId: 'CS-1',
    transactionId: 'tx-57',
    ended: false,
    ...overrides,
  };
}

function stripeSays(held: string[], unknown: string[] = []): StripeFindings {
  return { held: new Set(held), unknown: new Set(unknown), unreachableAccounts: new Set() };
}

describe('planMigration', () => {
  it('gives each tenant its operator’s Stripe account', () => {
    expect(planFor(aPython(), aCore()).accounts).toEqual([
      {
        tenantId: 1,
        stripeAccountId: 'acct_citrineos',
        operators: ['CitrineOS'],
        action: AccountAction.Create,
      },
    ]);
  });

  it('leaves an account the tenant already has', () => {
    const plan = planFor(
      aPython(),
      aCore({ paymentAccounts: [{ tenantId: 1, stripeAccountId: 'acct_citrineos' }] }),
    );

    expect(plan.accounts[0].action).toBe(AccountAction.Exists);
  });

  it.each([
    [
      'the tenant already takes payments elsewhere',
      aPython(),
      aCore({ paymentAccounts: [{ tenantId: 1, stripeAccountId: 'acct_other' }] }),
      'already takes payments on acct_other',
    ],
    [
      'two operators serve one tenant',
      aPython({
        operators: [
          { id: 1, name: 'CitrineOS', stripeAccountId: 'acct_citrineos' },
          { id: 2, name: 'Other', stripeAccountId: 'acct_other' },
        ],
        locations: [
          { id: 1, operatorId: 1, address: ADDRESS },
          { id: 2, operatorId: 2, address: ADDRESS },
        ],
        evses: [
          ...aPython().evses,
          { ...aPython().evses[0], id: 2, emi3EvseId: 'US*OTH*E2', locationId: 2 },
        ],
      }),
      aCore(),
      "has 2 operators' Stripe accounts",
    ],
    [
      'one operator serves two tenants',
      aPython({
        evses: [...aPython().evses, { ...aPython().evses[0], id: 2, stationId: 'CS-2' }],
      }),
      aCore({
        stations: [
          ...aCore().stations,
          { id: 11, tenantId: 2, ocppConnectionName: 'CS-2', locationId: null },
        ],
        evses: [
          ...aCore().evses,
          { id: 21, tenantId: 2, stationId: 11, evseTypeId: 1, evseId: null },
        ],
      }),
      'a Stripe account belongs to one tenant',
    ],
  ])('flags a conflict when %s', (_name, python, core, reason) => {
    const conflicts = planFor(python, core).accounts.filter(
      (account) => account.action === AccountAction.Conflict,
    );

    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].reason).toContain(reason);
  });

  it('matches each EVSE and connector to Core’s, and reports a missing eMI3 id and tariff', () => {
    const [evse] = planFor(aPython(), aCore()).evses;

    expect(evse).toMatchObject({
      coreEvseId: 20,
      emi3: { status: Comparison.Missing, core: null },
      connectors: [
        {
          pythonConnectorId: '1',
          coreConnectorId: 30,
          tariff: { status: TariffMatch.Missing, python: PRICES },
        },
      ],
    });
  });

  it('compares a tariff Core has with the Python one', () => {
    const core = aCore({
      evses: [{ ...aCore().evses[0], evseId: 'uscite1' }],
      connectors: [{ ...aCore().connectors[0], tariffId: 40 }],
      tariffs: [{ id: 40, tenantId: 1, ...PRICES, pricePerKwh: 0.45, paymentFee: null }],
    });

    const [evse] = planFor(aPython(), core).evses;

    expect(evse.emi3).toEqual({ status: Comparison.Same, core: 'uscite1' });
    expect(evse.connectors[0].tariff).toMatchObject({
      status: TariffMatch.Differs,
      coreTariffId: 40,
      differences: ['pricePerKwh: Python 0.42, Core 0.45', 'paymentFee: Python 2, Core none'],
    });

    const same = aCore({
      connectors: [{ ...aCore().connectors[0], tariffId: 40 }],
      tariffs: [{ id: 40, tenantId: 1, ...PRICES, pricePerKwh: 0.42000001 }],
    });
    expect(planFor(aPython(), same).evses[0].connectors[0].tariff.status).toBe(TariffMatch.Same);
  });

  it('finds the station by its identity, whatever the old tenant id', () => {
    const inTenant2 = aCore({ stations: [{ ...aCore().stations[0], tenantId: 2 }] });

    expect(planFor(aPython(), aCore()).evses[0]).toMatchObject({ tenantId: 1, coreEvseId: 20 });
    expect(planFor(aPython(), inTenant2).evses[0]).toMatchObject({ tenantId: 2, coreEvseId: 20 });
  });

  it('picks between stations of the same identity by a numeric tenant id', () => {
    const core = aCore({
      stations: [
        ...aCore().stations,
        { id: 11, tenantId: 2, ocppConnectionName: 'CS-1', locationId: null },
      ],
      evses: [
        ...aCore().evses,
        { id: 21, tenantId: 2, stationId: 11, evseTypeId: 1, evseId: null },
      ],
    });
    const onTenant = (tenantId: string) =>
      planFor(aPython({ evses: [{ ...aPython().evses[0], tenantId }] }), core).evses[0];

    expect(onTenant('2')).toMatchObject({ tenantId: 2, coreEvseId: 21 });
    expect(onTenant('T01')).toMatchObject({ coreEvseId: null });
    expect(onTenant('T01').unmatched).toContain('exists in tenants 1, 2');
  });

  it('reports an EVSE of a station Core does not have', () => {
    const python = aPython({ evses: [{ ...aPython().evses[0], stationId: 'CS-9' }] });

    const [evse] = planFor(python, aCore()).evses;

    expect(evse.coreEvseId).toBeNull();
    expect(evse.unmatched).toContain('station CS-9 does not exist');
    expect(evse.connectors[0].tariff.status).toBe(TariffMatch.Unmatched);
  });

  it('matches an OCPP 1.6 connector by its station-wide number', () => {
    const core = aCore({
      evses: [{ ...aCore().evses[0], evseTypeId: undefined }],
      connectors: [
        { ...aCore().connectors[0], id: 31, connectorId: 1, evseTypeConnectorId: undefined },
        { ...aCore().connectors[0], id: 32, connectorId: 2, evseTypeConnectorId: undefined },
      ],
    });
    const python = aPython({ connectors: [{ id: 1, connectorId: '2', evseId: 1, tariffId: 1 }] });

    expect(planFor(python, core).evses[0].connectors[0].coreConnectorId).toBe(32);
  });

  it('moves the checkout ids past every id an old checkout or Authorization used', () => {
    expect(planFor(aPython(), aCore()).checkoutSequence).toEqual({ current: 1, next: 121 });
    expect(planFor(aPython(), aCore({ highestIssuedCheckoutId: 400 })).checkoutSequence).toEqual({
      current: 1,
      next: 401,
    });
    expect(planFor(aPython(), aCore({ nextCheckoutId: 500 })).checkoutSequence).toBeNull();
  });

  it('leaves the Python checkout ids out when its idTokens start differently', () => {
    const differing = planMigration(aPython(), aCore(), {
      ...OPTIONS,
      pythonIdTokenPrefix: 'AMPAY-',
    });

    expect(differing.idTokenPrefixesMatch).toBe(false);
    expect(differing.checkoutSequence).toBeNull();
    expect(
      planMigration(aPython(), aCore({ highestIssuedCheckoutId: 7 }), {
        ...OPTIONS,
        pythonIdTokenPrefix: 'AMPAY-',
      }).checkoutSequence,
    ).toEqual({ current: 1, next: 8 });
  });

  it('gives each EVSE found in Core the address its new QR code encodes', () => {
    const python = aPython({
      evses: [...aPython().evses, { ...aPython().evses[0], id: 2, stationId: 'CS-9' }],
    });

    expect(planFor(python, aCore()).evses.map((evse) => evse.qrCodeUrl)).toEqual([
      'https://pay.example.com/checkout/20',
      null,
    ]);
  });

  it('compares the address drivers see with the one the Python service showed', () => {
    const address = (core: CoreSnapshot) => planFor(aPython(), core).evses[0].address;
    const python = '1 Main Street, 02110 Boston, MA, USA';

    expect(address(aCore())).toEqual({ status: Comparison.Same, python, core: python });
    expect(
      address(aCore({ locations: [{ id: 5, tenantId: 1, ...ADDRESS, address: '1 main street.' }] }))
        ?.status,
    ).toBe(Comparison.Same);
    expect(
      address(aCore({ locations: [{ id: 5, tenantId: 1, ...ADDRESS, city: 'Cambridge' }] })),
    ).toEqual({
      status: Comparison.Differs,
      python,
      core: '1 Main Street, 02110 Cambridge, MA, USA',
    });
    expect(address(aCore({ stations: [{ ...aCore().stations[0], locationId: null }] }))).toEqual({
      status: Comparison.Missing,
      python,
      core: null,
    });
  });

  it('warns that per-minute prices now bill charging time only', () => {
    expect(planFor(aPython(), aCore()).warnings.join('\n')).toContain('idle time');
    expect(
      planFor(aPython({ tariffs: [{ id: 1, ...PRICES, pricePerMin: null }] }), aCore()).warnings,
    ).toEqual([]);
  });

  it('warns where an old QR code would open another EVSE', () => {
    const python = aPython({ evses: [{ ...aPython().evses[0], emi3EvseId: '20' }] });

    expect(planFor(python, aCore()).warnings.join('\n')).toContain('EVSE id(s) 20 are digits only');
  });

  it('warns about an operator account this app’s Stripe key cannot reach', () => {
    const stripe = { ...stripeSays([]), unreachableAccounts: new Set(['acct_citrineos']) };

    expect(planFor(aPython(), aCore(), stripe).warnings.join('\n')).toContain(
      'Stripe account acct_citrineos is not connected',
    );
  });

  it('lists where drivers will see another operator name than the Python service showed', () => {
    const onTenant = (tenantId: string) =>
      aPython({ evses: [{ ...aPython().evses[0], tenantId }] });
    const core = aCore({ stations: [{ ...aCore().stations[0], tenantId: 2 }] });

    expect(planFor(onTenant('1'), aCore()).operatorNames).toEqual([
      { tenantId: 1, pythonOperators: ['CitrineOS'], shownToDrivers: null },
    ]);
    expect(planFor(onTenant('2'), core).operatorNames).toEqual([]);
    expect(
      planFor(onTenant('2'), aCore({ ...core, tenants: [{ id: 2, name: 'Acme' }] })).operatorNames,
    ).toEqual([{ tenantId: 2, pythonOperators: ['CitrineOS'], shownToDrivers: 'Acme' }]);
  });

  it('keeps a paid session still charging in Core for the Python service to finish', () => {
    const python = aPython({ paidCheckouts: [aPaidCheckout()] });
    const charging = (transaction: CoreSnapshot['activeTransactions'][number]) =>
      planFor(python, aCore({ activeTransactions: [transaction] }), stripeSays(['pi_57']))
        .pythonSessions;

    expect(
      charging({ stationId: 10, transactionId: 'tx-57', remoteStartId: null }).running,
    ).toMatchObject([{ checkoutId: 57, paymentIntentId: 'pi_57' }]);
    expect(
      charging({ stationId: 10, transactionId: 'other', remoteStartId: 57 }).running,
    ).toHaveLength(1);
    expect(charging({ stationId: 99, transactionId: 'tx-57', remoteStartId: 57 })).toMatchObject({
      running: [],
      toSettleByHand: [{ checkoutId: 57 }],
    });
  });

  it('leaves a session to settle by hand when Stripe still holds it and nothing charges', () => {
    const plan = planFor(
      aPython({
        paidCheckouts: [
          aPaidCheckout(),
          aPaidCheckout({ id: 58, paymentIntentId: 'pi_58', ended: true }),
          aPaidCheckout({ id: 59, paymentIntentId: 'pi_59' }),
        ],
      }),
      aCore(),
      stripeSays(['pi_57', 'pi_58']),
    );

    expect(plan.pythonSessions).toMatchObject({
      stripeChecked: true,
      running: [],
      toSettleByHand: [{ checkoutId: 57 }, { checkoutId: 58 }],
      unverified: [],
    });
  });

  it('lists sessions it cannot check without Stripe', () => {
    const plan = planFor(
      aPython({
        paidCheckouts: [
          aPaidCheckout(),
          aPaidCheckout({ id: 58, paymentIntentId: 'pi_58', ended: true }),
        ],
      }),
      aCore(),
    );

    expect(plan.pythonSessions).toMatchObject({
      stripeChecked: false,
      toSettleByHand: [],
      unverified: [{ checkoutId: 57 }],
    });
  });
});

describe('formatReport', () => {
  it('says what to do in Core, and what already matches', () => {
    const report = formatReport(planFor(aPython(), aCore()), false);

    expect(report).toContain('# Migration from citrineos-payment: dry run');
    expect(report).toContain('- to create — tenant 1: acct_citrineos (CitrineOS)');
    expect(report).toContain('- to move from 1 to 121');
    expect(report).toContain("set Core EVSE 20's evseId to US*CIT*E1");
    expect(report).toContain(
      'Core connector 30 has no tariff; the Python one was USD, 0.42/kWh, 0.05/min, 1.5/session, VAT 19%, hold 50, payment fee 2',
    );
    expect(report).toContain("- none: it holds no driver's money");
    expect(report).toContain('Stripe was not asked');
    expect(report).toContain('US*CIT*E1 (station CS-1): https://pay.example.com/checkout/20');
    expect(report).toContain('drivers who type the printed EVSE ID find it');
    expect(report).toContain('tenant 1: drivers see no operator name, as it is the default tenant');
    expect(report).not.toContain('old QR codes');
  });

  it('says which sessions the Python service has to finish, and which a person settles', () => {
    const report = formatReport(
      planFor(
        aPython({
          paidCheckouts: [
            aPaidCheckout(),
            aPaidCheckout({ id: 58, paymentIntentId: 'pi_58', transactionId: 'tx-58' }),
          ],
        }),
        aCore({
          activeTransactions: [{ stationId: 10, transactionId: 'tx-57', remoteStartId: 57 }],
        }),
        stripeSays(['pi_57', 'pi_58']),
      ),
      false,
    );

    expect(report).toContain('1 still charging');
    expect(report).toContain('- checkout 57, station CS-1: payment intent pi_57 on acct_citrineos');
    expect(report).toContain('1 held on Stripe with no session charging');
    expect(report).not.toContain('Stripe was not asked');
  });

  it('asks for a location where a station has none, or says the address changed', () => {
    const core = aCore({ stations: [{ ...aCore().stations[0], locationId: null }] });

    expect(formatReport(planFor(aPython(), core), false)).toContain(
      'station CS-1 (tenant 1): has no location in Core, so drivers see no address; the Python service showed 1 Main Street, 02110 Boston, MA, USA',
    );
    expect(
      formatReport(
        planFor(
          aPython(),
          aCore({ locations: [{ id: 5, tenantId: 1, ...ADDRESS, address: '9 Elm Street' }] }),
        ),
        false,
      ),
    ).toContain('drivers now see 9 Elm Street, 02110 Boston, MA, USA; the Python service showed');
  });

  it('points a conflict at the admin API', () => {
    const report = formatReport(
      planFor(
        aPython(),
        aCore({ paymentAccounts: [{ tenantId: 1, stripeAccountId: 'acct_other' }] }),
      ),
      true,
    );

    expect(report).toContain('applied');
    expect(report).toContain('CONFLICT — tenant 1: acct_citrineos (CitrineOS)');
    expect(report).toContain('PUT /api/admin/tenants/1/payment-account');
  });
});

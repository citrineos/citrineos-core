// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  AccountPlan,
  Address,
  ConnectorPlan,
  CoreSnapshot,
  EvsePlan,
  MigrationPlan,
  OperatorNamePlan,
  PlanOptions,
  PythonData,
  PythonSession,
  PythonSessionsPlan,
  StripeFindings,
  TariffValues,
} from './types.js';
import { AccountAction, Comparison, TariffMatch } from './types.js';

const TARIFF_FIELDS: (keyof TariffValues)[] = [
  'currency',
  'pricePerKwh',
  'pricePerMin',
  'pricePerSession',
  'taxRate',
  'authorizationAmount',
  'paymentFee',
];

/** eMI3 ids compare without their optional `*` separators and case. */
function sameEmi3(a: string, b: string): boolean {
  const normalize = (id: string) => id.replaceAll('*', '').toUpperCase();
  return normalize(a) === normalize(b);
}

/** Prices compare to the cent's hundredth; a price of 0 and no price are the same thing. */
function differences(python: TariffValues, core: TariffValues): string[] {
  return TARIFF_FIELDS.flatMap((field) => {
    const a = python[field];
    const b = core[field];
    if (field === 'currency') {
      return String(a).toUpperCase() === String(b).toUpperCase() ? [] : [`${field}: ${a} → ${b}`];
    }
    const x = a === null ? 0 : Number(a);
    const y = b === null ? 0 : Number(b);
    return Math.abs(x - y) < 1e-4 ? [] : [`${field}: Python ${a ?? 'none'}, Core ${b ?? 'none'}`];
  });
}

/** An address as one line, or null when it has none. */
function formatAddress(address: Partial<Address>): string | null {
  const city = [address.postalCode, address.city].filter(Boolean).join(' ');
  const line = [address.address, city, address.state, address.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  return line || null;
}

function sameText(a: string, b: string): boolean {
  const normalize = (text: string) =>
    text
      .replace(/[\s,.]+/g, ' ')
      .trim()
      .toUpperCase();
  return normalize(a) === normalize(b);
}

type Station = CoreSnapshot['stations'][number];

/**
 * Finds Core's station for a Python EVSE by its OCPP identity. The Python service predates
 * tenants in Core: its tenant id is the old string id (`T01`), and Core's upgrade moved every
 * station to the default tenant, so the identity decides. A numeric tenant id that exists picks
 * between stations with the same identity in several tenants.
 */
function findStation(
  core: CoreSnapshot,
  stationId: string,
  pythonTenantId: string,
): { station: Station } | { reason: string } {
  const candidates = core.stations.filter(
    (candidate) => candidate.ocppConnectionName === stationId,
  );
  const numeric = /^\d+$/.test(pythonTenantId.trim()) ? Number(pythonTenantId) : undefined;
  const inTenant = candidates.filter((candidate) => candidate.tenantId === numeric);
  if (inTenant.length === 1) {
    return { station: inTenant[0] };
  }
  if (candidates.length === 1) {
    return { station: candidates[0] };
  }
  if (!candidates.length) {
    return { reason: `station ${stationId} does not exist in Core` };
  }
  return {
    reason: `station ${stationId} exists in tenants ${candidates.map((candidate) => candidate.tenantId).join(', ')}; the Python tenant ${pythonTenantId} does not say which`,
  };
}

/**
 * Works out, without changing anything, what moving off the Python service takes: which tenants
 * get which Stripe account, and where Core's EVSEs and tariffs differ from what the Python service
 * had. Only the payment accounts and the checkout id sequence are this app's to change; the rest is
 * reported for an operator to settle in Core.
 */
export function planMigration(
  python: PythonData,
  core: CoreSnapshot,
  options: PlanOptions,
): MigrationPlan {
  const warnings: string[] = [];
  const publicUrl = options.publicUrl.replace(/\/$/, '');

  const stations = new Map(
    python.evses.map((evse) => [evse.id, findStation(core, evse.stationId, evse.tenantId)]),
  );

  const evses = python.evses.map((evse): EvsePlan => {
    const found = stations.get(evse.id);
    const station = found && 'station' in found ? found.station : undefined;
    const base = {
      emi3EvseId: evse.emi3EvseId,
      stationId: evse.stationId,
      tenantId: station?.tenantId ?? null,
    };
    const connectors = python.connectors.filter((connector) => connector.evseId === evse.id);
    const unmatched = (reason: string): EvsePlan => ({
      ...base,
      coreEvseId: null,
      unmatched: reason,
      emi3: null,
      qrCodeUrl: null,
      address: null,
      connectors: connectors.map((connector) => ({
        pythonConnectorId: connector.connectorId,
        coreConnectorId: null,
        tariff: { status: TariffMatch.Unmatched, python: tariffOf(python, connector.tariffId) },
      })),
    });

    if (!station) {
      return unmatched(found && 'reason' in found ? found.reason : 'not found');
    }
    const stationEvses = core.evses.filter((candidate) => candidate.stationId === station.id);
    const coreEvse =
      stationEvses.find((candidate) => candidate.evseTypeId === evse.ocppEvseId) ??
      (stationEvses.length === 1 ? stationEvses[0] : undefined);
    if (!coreEvse) {
      return unmatched(`station ${evse.stationId} has no EVSE ${evse.ocppEvseId}`);
    }

    const coreConnectors = core.connectors.filter((candidate) => candidate.evseId === coreEvse.id);
    return {
      ...base,
      coreEvseId: coreEvse.id,
      emi3: coreEvse.evseId
        ? {
            status: sameEmi3(coreEvse.evseId, evse.emi3EvseId)
              ? Comparison.Same
              : Comparison.Differs,
            core: coreEvse.evseId,
          }
        : { status: Comparison.Missing, core: null },
      qrCodeUrl: `${publicUrl}/checkout/${coreEvse.id}`,
      address: compareAddress(python, evse.locationId, core, station),
      connectors: connectors.map((connector): ConnectorPlan => {
        const number = /^\d+$/.test(connector.connectorId.trim())
          ? Number(connector.connectorId)
          : undefined;
        const coreConnector =
          coreConnectors.find(
            (candidate) =>
              number !== undefined &&
              (candidate.evseTypeConnectorId === number || candidate.connectorId === number),
          ) ??
          (coreConnectors.length === 1 && connectors.length === 1 ? coreConnectors[0] : undefined);
        const pythonTariff = tariffOf(python, connector.tariffId);
        if (!coreConnector) {
          return {
            pythonConnectorId: connector.connectorId,
            coreConnectorId: null,
            tariff: { status: TariffMatch.Unmatched, python: pythonTariff },
          };
        }
        if (!pythonTariff) {
          return {
            pythonConnectorId: connector.connectorId,
            coreConnectorId: coreConnector.id,
            tariff: { status: TariffMatch.NoPythonTariff },
          };
        }
        const coreTariff = core.tariffs.find(
          (candidate) =>
            candidate.id === coreConnector.tariffId &&
            candidate.tenantId === coreConnector.tenantId,
        );
        if (!coreTariff) {
          return {
            pythonConnectorId: connector.connectorId,
            coreConnectorId: coreConnector.id,
            tariff: { status: TariffMatch.Missing, python: pythonTariff },
          };
        }
        const found = differences(pythonTariff, coreTariff);
        return {
          pythonConnectorId: connector.connectorId,
          coreConnectorId: coreConnector.id,
          tariff: {
            status: found.length ? TariffMatch.Differs : TariffMatch.Same,
            python: pythonTariff,
            coreTariffId: coreTariff.id,
            differences: found,
          },
        };
      }),
    };
  });

  const tenantOf = (evseId: number) => {
    const resolved = stations.get(evseId);
    return resolved && 'station' in resolved ? resolved.station.tenantId : undefined;
  };
  const accounts = planAccounts(python, core, tenantOf, warnings);
  const idTokenPrefixesMatch = options.pythonIdTokenPrefix === options.idTokenPrefix;
  warnings.push(...pricingWarnings(python), ...qrCodeWarnings(python));
  if (options.stripe) {
    for (const account of [...options.stripe.unreachableAccounts].sort()) {
      warnings.push(
        `Stripe account ${account} is not connected to the platform of this app's STRIPE_API_KEY, so this app cannot take payments on it; use the platform key the Python service used`,
      );
    }
  }
  return {
    accounts,
    evses,
    operatorNames: planOperatorNames(accounts, core),
    checkoutSequence: planSequence(python, core, idTokenPrefixesMatch),
    idTokenPrefixesMatch,
    pythonSessions: planPythonSessions(python, core, options.stripe),
    warnings,
  };
}

function compareAddress(
  python: PythonData,
  pythonLocationId: number | null,
  core: CoreSnapshot,
  station: Station,
): EvsePlan['address'] {
  const pythonLocation = python.locations.find((candidate) => candidate.id === pythonLocationId);
  const pythonAddress = pythonLocation ? formatAddress(pythonLocation.address) : null;
  const coreLocation = core.locations.find(
    (candidate) => candidate.id === station.locationId && candidate.tenantId === station.tenantId,
  );
  if (!coreLocation) {
    return { status: Comparison.Missing, python: pythonAddress, core: null };
  }
  const coreAddress = formatAddress(coreLocation);
  const same = !pythonAddress || (coreAddress !== null && sameText(pythonAddress, coreAddress));
  return {
    status: same ? Comparison.Same : Comparison.Differs,
    python: pythonAddress,
    core: coreAddress,
  };
}

/** The Python service billed time from the session's start to its end; Core bills charging time. */
function pricingWarnings(python: PythonData): string[] {
  const used = new Set(python.connectors.map((connector) => connector.tariffId));
  const perMinute = python.tariffs.filter(
    (tariff) => used.has(tariff.id) && (tariff.pricePerMin ?? 0) > 0,
  );
  return perMinute.length
    ? [
        `${perMinute.length} Python tariff(s) charge per minute. The Python service charged every minute from the session's start to its end; this app charges Core's time spent charging, so idle time while plugged in is no longer billed. Raise the per-minute price, or add an idle fee in Core, if that matters`,
      ]
    : [];
}

/**
 * An old QR code encodes `/checkout/<eMI3 id>`. This app's page is `/checkout/<Core EVSE id>`, so
 * an eMI3 id of digits only opens whichever Core EVSE has that number.
 */
function qrCodeWarnings(python: PythonData): string[] {
  const numeric = python.evses.filter((evse) => /^\d{1,9}$/.test(evse.emi3EvseId));
  return numeric.length
    ? [
        `EVSE id(s) ${numeric.map((evse) => evse.emi3EvseId).join(', ')} are digits only: their old QR codes would open Core EVSE ${numeric.length > 1 ? 'ids' : 'id'} ${numeric.map((evse) => evse.emi3EvseId).join(', ')} on this app, which may be a different charger. Take those codes down before this app serves the Python service's address`,
      ]
    : [];
}

/**
 * Sorts the Python service's paid sessions by what still has to happen to the driver's money.
 * Running ones it settles itself when they end; held ones it will not settle any more need a person.
 */
function planPythonSessions(
  python: PythonData,
  core: CoreSnapshot,
  stripe: StripeFindings | undefined,
): PythonSessionsPlan {
  const plan: PythonSessionsPlan = {
    stripeChecked: stripe !== undefined,
    running: [],
    toSettleByHand: [],
    unverified: [],
  };
  for (const checkout of python.paidCheckouts) {
    const session: PythonSession = {
      checkoutId: checkout.id,
      paymentIntentId: checkout.paymentIntentId,
      stripeAccountId: checkout.stripeAccountId,
      stationId: checkout.stationId,
    };
    const held = stripe?.held.has(checkout.paymentIntentId);
    const unknown = !stripe || stripe.unknown.has(checkout.paymentIntentId);
    if (!held && !unknown) {
      continue; // Captured or released.
    }
    const stationIds = new Set(
      core.stations
        .filter((station) => station.ocppConnectionName === checkout.stationId)
        .map((station) => station.id),
    );
    const running =
      !checkout.ended &&
      core.activeTransactions.some(
        (transaction) =>
          stationIds.has(transaction.stationId) &&
          (transaction.remoteStartId === checkout.id ||
            (checkout.transactionId !== null &&
              transaction.transactionId === checkout.transactionId)),
      );
    if (running) {
      plan.running.push(session);
    } else if (held) {
      plan.toSettleByHand.push(session);
    } else if (!checkout.ended) {
      plan.unverified.push(session);
    }
  }
  return plan;
}

function tariffOf(python: PythonData, tariffId: number | null): TariffValues | null {
  const tariff = python.tariffs.find((candidate) => candidate.id === tariffId);
  if (!tariff) {
    return null;
  }
  const { id: _id, ...values } = tariff;
  return values;
}

/**
 * An operator's Stripe account goes to the tenants its EVSEs belong to. This app keeps one account
 * per tenant and Stripe accounts are not shared, so a tenant with several operators, or an
 * operator across tenants, needs a person to decide.
 */
function planAccounts(
  python: PythonData,
  core: CoreSnapshot,
  tenantOf: (pythonEvseId: number) => number | undefined,
  warnings: string[],
): AccountPlan[] {
  const tenants = new Set(core.tenants.map((tenant) => tenant.id));
  const accountsByTenant = new Map<number, Map<string, Set<string>>>();
  const tenantsByAccount = new Map<string, Set<number>>();

  for (const evse of python.evses) {
    const location = python.locations.find((candidate) => candidate.id === evse.locationId);
    const operator = python.operators.find((candidate) => candidate.id === location?.operatorId);
    if (!operator) {
      warnings.push(`EVSE ${evse.emi3EvseId} has no operator, so no Stripe account`);
      continue;
    }
    const tenantId = tenantOf(evse.id);
    if (tenantId === undefined || !tenants.has(tenantId)) {
      continue;
    }
    const accounts = accountsByTenant.get(tenantId) ?? new Map<string, Set<string>>();
    accounts.set(
      operator.stripeAccountId,
      (accounts.get(operator.stripeAccountId) ?? new Set()).add(operator.name),
    );
    accountsByTenant.set(tenantId, accounts);
    tenantsByAccount.set(
      operator.stripeAccountId,
      (tenantsByAccount.get(operator.stripeAccountId) ?? new Set()).add(tenantId),
    );
  }

  const plans: AccountPlan[] = [];
  for (const [tenantId, accounts] of [...accountsByTenant].sort(([a], [b]) => a - b)) {
    const existing = core.paymentAccounts.find((account) => account.tenantId === tenantId);
    for (const [stripeAccountId, operators] of accounts) {
      const plan = { tenantId, stripeAccountId, operators: [...operators].sort() };
      const sharedWith = [...(tenantsByAccount.get(stripeAccountId) ?? [])].filter(
        (other) => other !== tenantId,
      );
      const takenBy = core.paymentAccounts.find(
        (account) => account.stripeAccountId === stripeAccountId && account.tenantId !== tenantId,
      );
      if (existing?.stripeAccountId === stripeAccountId) {
        plans.push({ ...plan, action: AccountAction.Exists });
      } else if (existing) {
        plans.push({
          ...plan,
          action: AccountAction.Conflict,
          reason: `tenant ${tenantId} already takes payments on ${existing.stripeAccountId}`,
        });
      } else if (accounts.size > 1) {
        plans.push({
          ...plan,
          action: AccountAction.Conflict,
          reason: `tenant ${tenantId} has ${accounts.size} operators' Stripe accounts; one has to be chosen`,
        });
      } else if (takenBy || sharedWith.length) {
        plans.push({
          ...plan,
          action: AccountAction.Conflict,
          reason: `the account also serves tenant(s) ${[takenBy?.tenantId, ...sharedWith].filter((id) => id !== undefined).join(', ')}; a Stripe account belongs to one tenant`,
        });
      } else {
        plans.push({ ...plan, action: AccountAction.Create });
      }
    }
  }
  return plans;
}

/**
 * Drivers now see Core's tenant name as the operator, where the Python service showed its
 * operator's name: listed wherever the two differ, so the tenant can be renamed.
 */
function planOperatorNames(accounts: AccountPlan[], core: CoreSnapshot): OperatorNamePlan[] {
  const operatorsByTenant = new Map<number, Set<string>>();
  for (const account of accounts) {
    const operators = operatorsByTenant.get(account.tenantId) ?? new Set<string>();
    account.operators.forEach((operator) => operators.add(operator));
    operatorsByTenant.set(account.tenantId, operators);
  }
  return [...operatorsByTenant].flatMap(([tenantId, operators]): OperatorNamePlan[] => {
    const shownToDrivers =
      tenantId === DEFAULT_TENANT_ID
        ? null
        : (core.tenants.find((tenant) => tenant.id === tenantId)?.name ?? null);
    const pythonOperators = [...operators].sort();
    return pythonOperators.length === 1 && pythonOperators[0] === shownToDrivers
      ? []
      : [{ tenantId, pythonOperators, shownToDrivers }];
  });
}

/**
 * The Python service's idTokens were its prefix and a checkout id. Only when that prefix is this
 * app's too could a new checkout's idToken name one of its Authorizations in Core.
 */
function planSequence(
  python: PythonData,
  core: CoreSnapshot,
  idTokenPrefixesMatch: boolean,
): MigrationPlan['checkoutSequence'] {
  const next =
    Math.max(idTokenPrefixesMatch ? python.maxCheckoutId : 0, core.highestIssuedCheckoutId) + 1;
  return next > core.nextCheckoutId ? { current: core.nextCheckoutId, next } : null;
}

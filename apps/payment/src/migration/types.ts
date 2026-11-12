// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto, ConnectorDto, EvseDto, TenantDto } from '@citrineos/types';
import type { PaymentAccountDto } from '../types/index.js';

/** What citrineos-payment (Python) kept, as read from its tables. */
export interface PythonData {
  operators: { id: number; name: string; stripeAccountId: string }[];
  /** Its own copy of the address, which its checkout page showed drivers. */
  locations: { id: number; operatorId: number | null; address: Address }[];
  evses: {
    id: number;
    /** eMI3, as printed on the charger and encoded in its QR code. */
    emi3EvseId: string;
    ocppEvseId: number;
    /** The station's OCPP identity. */
    stationId: string;
    /**
     * Core's tenant id as it was before Core had tenants, typically `T01`. Core's own upgrade moved
     * every station to its default tenant, so the station's identity is what finds it now.
     */
    tenantId: string;
    locationId: number | null;
  }[];
  connectors: { id: number; connectorId: string; evseId: number | null; tariffId: number | null }[];
  tariffs: ({ id: number } & TariffValues)[];
  /** The highest checkout id it issued; its idTokens were its prefix and this id. */
  maxCheckoutId: number;
  /**
   * Checkouts a driver paid for that may still hold money: the session has not ended, or ended
   * within the last 8 days (Stripe releases a hold it was never asked to capture after 7).
   */
  paidCheckouts: PythonPaidCheckout[];
}

export interface Address {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface PythonPaidCheckout {
  id: number;
  paymentIntentId: string;
  /** The connected account the payment was taken on; null if the operator is gone. */
  stripeAccountId: string | null;
  /** The OCPP identity of the station it started. */
  stationId: string | null;
  /** The OCPP transactionId it recorded, for sessions it started remotely. */
  transactionId: string | null;
  /** Whether it saw the session end, and so tried to capture it. */
  ended: boolean;
}

/** The prices both services describe a tariff with, in major units. */
export interface TariffValues {
  currency: string;
  pricePerKwh: number | null;
  pricePerMin: number | null;
  pricePerSession: number | null;
  taxRate: number | null;
  authorizationAmount: number | null;
  paymentFee: number | null;
}

/** A row of Core's, read straight from its table: the primary key and tenant are set. */
type Saved = { id: number; tenantId: number };

/** The part of Core's data the migration matches against. */
export interface CoreSnapshot {
  /** The name is what drivers see as the operator. */
  tenants: (Pick<TenantDto, 'name'> & { id: number })[];
  /** A station without a location shows drivers no address. */
  stations: (Saved & Pick<ChargingStationDto, 'ocppConnectionName' | 'locationId'>)[];
  /** `evseId` is the eMI3 id, as in Core. */
  evses: (Saved & Pick<EvseDto, 'stationId' | 'evseTypeId' | 'evseId'>)[];
  connectors: (Saved &
    Pick<
      ConnectorDto,
      'evseId' | 'stationId' | 'connectorId' | 'evseTypeConnectorId' | 'tariffId'
    >)[];
  tariffs: (Saved & TariffValues)[];
  /** Read from the table, where these columns may be null. */
  locations: (Saved & Address)[];
  /** Sessions still running, which a Python checkout's may be among. */
  activeTransactions: { stationId: number; transactionId: string; remoteStartId: number | null }[];
  paymentAccounts: Pick<PaymentAccountDto, 'tenantId' | 'stripeAccountId'>[];
  /** The highest checkout id an Authorization `<prefix><id>` in Core already names. */
  highestIssuedCheckoutId: number;
  /** The next id the Checkouts table hands out. */
  nextCheckoutId: number;
}

/** How the migration settles the payment account of a tenant. */
export const AccountAction = {
  /** Created by --apply. */
  Create: 'create',
  /** The tenant already has this account. */
  Exists: 'exists',
  /** Cannot be decided automatically; see `reason`. */
  Conflict: 'conflict',
} as const;
export type AccountAction = (typeof AccountAction)[keyof typeof AccountAction];

export interface AccountPlan {
  tenantId: number;
  stripeAccountId: string;
  operators: string[];
  action: AccountAction;
  reason?: string;
}

/** How Core's value compares with the Python service's. */
export const Comparison = {
  Same: 'same',
  Missing: 'missing',
  Differs: 'differs',
} as const;
export type Comparison = (typeof Comparison)[keyof typeof Comparison];

/** How a Python connector's tariff compares with Core's, beyond a plain comparison. */
export const TariffMatch = {
  ...Comparison,
  /** The Python connector had no tariff, so there is nothing to compare. */
  NoPythonTariff: 'no-python-tariff',
  /** Core has no such connector. */
  Unmatched: 'unmatched',
} as const;
export type TariffMatch = (typeof TariffMatch)[keyof typeof TariffMatch];

export interface ConnectorPlan {
  pythonConnectorId: string;
  coreConnectorId: number | null;
  tariff:
    | { status: typeof TariffMatch.NoPythonTariff }
    | { status: typeof TariffMatch.Missing; python: TariffValues }
    | {
        status: typeof TariffMatch.Same | typeof TariffMatch.Differs;
        python: TariffValues;
        coreTariffId: number;
        differences: string[];
      }
    | { status: typeof TariffMatch.Unmatched; python: TariffValues | null };
}

export interface EvsePlan {
  emi3EvseId: string;
  stationId: string;
  tenantId: number | null;
  coreEvseId: number | null;
  /** Why the EVSE was not found in Core. */
  unmatched?: string;
  emi3: { status: Comparison; core: string | null } | null;
  /** What a new QR code on the charger encodes; the Python service's codes no longer work. */
  qrCodeUrl: string | null;
  /**
   * The address drivers see, from the location of Core's station, against the one the Python
   * service showed. `missing` when the station has no location, so drivers see none.
   */
  address: { status: Comparison; python: string | null; core: string | null } | null;
  connectors: ConnectorPlan[];
}

/** What drivers now see as the operator, where it is not what the Python service showed. */
export interface OperatorNamePlan {
  tenantId: number;
  /** The Python operators whose EVSEs the tenant takes over. */
  pythonOperators: string[];
  /** Core's tenant name, shown to drivers; null for the default tenant, which shows none. */
  shownToDrivers: string | null;
}

export interface MigrationPlan {
  accounts: AccountPlan[];
  evses: EvsePlan[];
  operatorNames: OperatorNamePlan[];
  /** Raised so a new checkout's idToken can never be one an old checkout already used. */
  checkoutSequence: { current: number; next: number } | null;
  /** False when the two services' idTokens start differently, so they cannot collide. */
  idTokenPrefixesMatch: boolean;
  pythonSessions: PythonSessionsPlan;
  warnings: string[];
}

export interface PythonSession {
  checkoutId: number;
  paymentIntentId: string;
  stripeAccountId: string | null;
  stationId: string | null;
}

/** The Python service's paid sessions that still hold a driver's money, or may. */
export interface PythonSessionsPlan {
  /** Whether Stripe was asked which payments are still held. */
  stripeChecked: boolean;
  /**
   * Still charging in Core: the Python service captures them when they end, so it has to keep
   * running until then. --apply refuses while there are any.
   */
  running: PythonSession[];
  /**
   * Held on Stripe with no session running: the Python service will not settle them any more
   * (its capture failed, or the station never reported the session's end with its remoteStartId).
   * Capture or cancel them in Stripe; it cancels them itself 7 days after the payment.
   */
  toSettleByHand: PythonSession[];
  /** Not ended in the Python service and not running in Core, unchecked as Stripe was not asked. */
  unverified: PythonSession[];
}

/** What Stripe said, when the migration could ask it. */
export interface StripeFindings {
  /** Payment intents still waiting to be captured. */
  held: ReadonlySet<string>;
  /** Payment intents Stripe could not be asked about. */
  unknown: ReadonlySet<string>;
  /** Accounts this app's Stripe key cannot act on: not connected to its platform. */
  unreachableAccounts: ReadonlySet<string>;
}

/** What the plan needs besides the two services' data. */
export interface PlanOptions {
  /** This app's PAYMENT_PUBLIC_URL, which new QR codes point at. */
  publicUrl: string;
  /** The Python service's OCPP_REMOTESTART_IDTAG_PREFIX. */
  pythonIdTokenPrefix: string;
  /** This app's PAYMENT_ID_TOKEN_PREFIX. */
  idTokenPrefix: string;
  /** Left out when Stripe was not asked. */
  stripe?: StripeFindings;
}

// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import { ConnectorStatusEnum, OCPPVersion } from '@citrineos/types';
import { randomUUID } from 'node:crypto';
import type {
  ClearDisplayMessageRequest,
  DisplayMessageRequest,
  ICoreApiClient,
  RemoteStartRequest,
  RemoteStartResult,
} from '../../src/core/core-api-client.js';
import type {
  ConnectorTarget,
  EvseView,
  ICoreData,
  TransactionView,
} from '../../src/core/core-data.js';
import type {
  CheckoutFilter,
  ICheckoutRepository,
  IPaymentAccountRepository,
} from '../../src/repositories/index.js';
import type {
  CheckoutSessionCreated,
  CheckoutSessionRequest,
  IPaymentProvider,
  PaymentEvent,
} from '../../src/stripe/payment-provider.js';
import type {
  CheckoutCreate,
  CheckoutDto,
  CheckoutStatus,
  CheckoutUpdate,
  PaymentAccountCreate,
  PaymentAccountDto,
  PaymentAccountUpdate,
} from '../../src/types/index.js';
import { CheckoutStatus as Status } from '../../src/types/index.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

export const TENANT = 1;
export const OTHER_TENANT = 2;
export const ACCOUNT = 'acct_tenant_1';

export function aTariff(overrides: Partial<TariffData> = {}): TariffData {
  return {
    id: 10,
    currency: 'USD',
    pricePerKwh: 0.42,
    pricePerMin: 0.05,
    pricePerSession: 1.5,
    taxRate: 19,
    authorizationAmount: 50,
    paymentFee: 2,
    ...overrides,
  };
}

export function anEvse(overrides: Partial<EvseView> = {}): EvseView {
  const id = overrides.id ?? 7;
  return {
    id,
    tenantId: TENANT,
    evseId: `US*CIT*E${id}`,
    evseTypeId: 1,
    removed: false,
    station: { ocppConnectionName: 'CS-1', protocol: OCPPVersion.OCPP2_0_1, isOnline: true },
    connectors: [
      {
        id: id * 10,
        evseTypeConnectorId: 1,
        status: ConnectorStatusEnum.Available,
        type: 'IEC62196T2',
        powerType: 'AC3Phase',
        maximumPowerWatts: 22000,
      },
    ],
    location: {
      name: 'Depot',
      address: '1 Main Street',
      city: 'Boston',
      postalCode: '02110',
      state: 'MA',
      country: 'USA',
    },
    operatorName: 'CitrineOS',
    ...overrides,
  };
}

export function aTransaction(overrides: Partial<TransactionView> = {}): TransactionView {
  return {
    id: 500,
    transactionId: 'tx-1',
    isActive: true,
    startTime: '2026-10-23T10:00:00.000Z',
    totalKwh: null,
    timeSpentCharging: null,
    authorizationId: 900,
    evseId: 7,
    connectorId: 70,
    ...overrides,
  };
}

export class FakeCoreData implements ICoreData {
  evses = new Map<number, EvseView>();
  tariffs = new Map<string, TariffData>();
  targets = new Map<string, ConnectorTarget>();
  authorizations = new Map<string, number>();
  transactions: (TransactionView & { tenantId: number; ocppConnectionName: string })[] = [];
  /** Reads of a transaction before it shows up, to mimic Core writing it after the message. */
  transactionDelay = 0;
  private _nextAuthorizationId = 900;
  private _remoteStartIds = new Map<string, number>();

  addEvse(evse: EvseView, tariff: TariffData | null = aTariff()): void {
    this.evses.set(evse.id, evse);
    for (const connector of evse.connectors) {
      if (tariff) {
        this.tariffs.set(`${evse.tenantId}:${connector.id}`, tariff);
      }
      this.targets.set(`${evse.tenantId}:${connector.id}`, {
        evseId: evse.id,
        ocppConnectionName: evse.station.ocppConnectionName,
        protocol: evse.station.protocol,
        evseTypeId: evse.evseTypeId,
        connectorId: connector.connectorId,
      });
    }
  }

  async resolveEvseTenant(evseDatabaseId: number): Promise<number | undefined> {
    return this.evses.get(evseDatabaseId)?.tenantId;
  }

  async findEvsesByEmi3Id(emi3EvseId: string): Promise<number[]> {
    const normalize = (id: string) => id.replaceAll('*', '').toUpperCase();
    return [...this.evses.values()]
      .filter((evse) => evse.evseId != null && normalize(evse.evseId) === normalize(emi3EvseId))
      .map((evse) => evse.id);
  }

  async readEvse(tenantId: number, evseDatabaseId: number): Promise<EvseView | undefined> {
    const evse = this.evses.get(evseDatabaseId);
    return evse?.tenantId === tenantId ? evse : undefined;
  }

  async readConnectorTarget(
    tenantId: number,
    connectorId: number,
  ): Promise<ConnectorTarget | undefined> {
    return this.targets.get(`${tenantId}:${connectorId}`);
  }

  async readTariffForConnector(
    tenantId: number,
    connectorId: number,
  ): Promise<TariffData | undefined> {
    return this.tariffs.get(`${tenantId}:${connectorId}`);
  }

  async ensureAuthorization(tenantId: number, idToken: string): Promise<number> {
    const key = `${tenantId}:${idToken}`;
    if (!this.authorizations.has(key)) {
      this.authorizations.set(key, this._nextAuthorizationId++);
    }
    return this.authorizations.get(key)!;
  }

  async readAuthorizationId(tenantId: number, idToken: string): Promise<number | undefined> {
    return this.authorizations.get(`${tenantId}:${idToken}`);
  }

  async nextRemoteStartId(tenantId: number, ocppConnectionName: string): Promise<number> {
    const key = `${tenantId}:${ocppConnectionName}`;
    const next = (this._remoteStartIds.get(key) ?? 0) + 1;
    this._remoteStartIds.set(key, next);
    return next;
  }

  async readActiveTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
  ): Promise<TransactionView | undefined> {
    if (this.transactionDelay > 0) {
      this.transactionDelay--;
      return undefined;
    }
    return this.transactions.find(
      (t) => t.tenantId === tenantId && t.authorizationId === authorizationId && t.isActive,
    );
  }

  async readTransaction(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionView | undefined> {
    if (this.transactionDelay > 0) {
      this.transactionDelay--;
      return undefined;
    }
    return this.transactions.find(
      (t) =>
        t.tenantId === tenantId &&
        t.ocppConnectionName === ocppConnectionName &&
        t.transactionId === transactionId,
    );
  }

  async readLatestTransactionForAuthorization(
    tenantId: number,
    authorizationId: number,
    since: Date,
  ): Promise<TransactionView | undefined> {
    return this.transactions
      .filter(
        (t) =>
          t.tenantId === tenantId &&
          t.authorizationId === authorizationId &&
          (t.startTime == null || Date.parse(t.startTime) >= since.getTime()),
      )
      .sort((a, b) => b.id - a.id)[0];
  }

  async readTransactionById(tenantId: number, id: number): Promise<TransactionView | undefined> {
    return this.transactions.find((t) => t.tenantId === tenantId && t.id === id);
  }
}

export class FakeCoreApi implements ICoreApiClient {
  requests: RemoteStartRequest[] = [];
  result: RemoteStartResult | Error = { sent: true, detail: '{}' };
  displayMessages: DisplayMessageRequest[] = [];
  clearedMessages: ClearDisplayMessageRequest[] = [];
  displayResult: RemoteStartResult | Error = { sent: true, detail: '{}' };

  async remoteStart(request: RemoteStartRequest): Promise<RemoteStartResult> {
    this.requests.push(request);
    if (this.result instanceof Error) {
      throw this.result;
    }
    return this.result;
  }

  async setDisplayMessage(request: DisplayMessageRequest): Promise<RemoteStartResult> {
    this.displayMessages.push(request);
    if (this.displayResult instanceof Error) {
      throw this.displayResult;
    }
    return this.displayResult;
  }

  async clearDisplayMessage(request: ClearDisplayMessageRequest): Promise<RemoteStartResult> {
    this.clearedMessages.push(request);
    return { sent: true, detail: '{}' };
  }
}

export class RecordingPayments implements IPaymentProvider {
  sessions: CheckoutSessionRequest[] = [];
  captures: { account: string; paymentIntentId: string; amount: number; key: string }[] = [];
  cancels: { account: string; paymentIntentId: string; key: string }[] = [];
  failSessions = false;
  failCaptures = false;
  webhookEvent: PaymentEvent = { type: PaymentEventType.Unhandled, stripeType: 'ping' };

  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionCreated> {
    if (this.failSessions) {
      throw new Error('Stripe is down');
    }
    this.sessions.push(request);
    return { url: `https://checkout.stripe.test/${request.checkoutPublicId}` };
  }

  async capture(account: string, paymentIntentId: string, amount: number, key: string) {
    if (this.failCaptures) {
      throw new Error('Card declined');
    }
    this.captures.push({ account, paymentIntentId, amount, key });
  }

  async cancel(account: string, paymentIntentId: string, key: string) {
    this.cancels.push({ account, paymentIntentId, key });
  }

  parseWebhook(_rawBody: Buffer, _signature: string): PaymentEvent {
    return this.webhookEvent;
  }
}

export class InMemoryPaymentAccounts implements IPaymentAccountRepository {
  accounts: PaymentAccountDto[] = [];

  async create(tenantId: number, input: PaymentAccountCreate): Promise<PaymentAccountDto> {
    const account = {
      id: this.accounts.length + 1,
      tenantId,
      stripeAccountId: input.stripeAccountId,
      scanAndChargeEnabled: input.scanAndChargeEnabled ?? false,
      termsUrl: input.termsUrl ?? null,
    };
    this.accounts.push(account);
    return account;
  }

  async findByTenantId(tenantId: number): Promise<PaymentAccountDto | undefined> {
    return this.accounts.find((account) => account.tenantId === tenantId);
  }

  async findByStripeAccountId(stripeAccountId: string): Promise<PaymentAccountDto | undefined> {
    return this.accounts.find((account) => account.stripeAccountId === stripeAccountId);
  }

  async list(tenantId?: number): Promise<PaymentAccountDto[]> {
    return this.accounts.filter(
      (account) => tenantId === undefined || account.tenantId === tenantId,
    );
  }

  async update(
    tenantId: number,
    changes: PaymentAccountUpdate,
  ): Promise<PaymentAccountDto | undefined> {
    const account = this.accounts.find((candidate) => candidate.tenantId === tenantId);
    return account && Object.assign(account, changes);
  }

  async delete(tenantId: number): Promise<boolean> {
    const before = this.accounts.length;
    this.accounts = this.accounts.filter((account) => account.tenantId !== tenantId);
    return this.accounts.length < before;
  }
}

export class InMemoryCheckouts implements ICheckoutRepository {
  checkouts: CheckoutDto[] = [];
  /** What createdAt and updatedAt are set to. */
  now = new Date('2026-10-23T10:00:00.000Z');

  async create(tenantId: number, input: CheckoutCreate): Promise<CheckoutDto> {
    const checkout: CheckoutDto = {
      id: this.checkouts.length + 1,
      publicId: randomUUID(),
      tenantId,
      stripeAccountId: input.stripeAccountId,
      flow: input.flow,
      status: Status.Created,
      connectorId: input.connectorId,
      tariffId: input.tariffSnapshot.id,
      tariffSnapshot: input.tariffSnapshot,
      transactionDatabaseId: input.transactionDatabaseId ?? null,
      currency: input.tariffSnapshot.currency,
      authorizedAmount: null,
      capturedAmount: null,
      paymentIntentId: null,
      remoteStartStatus: null,
      qrDisplayMessageId: null,
      createdAt: this.now,
      updatedAt: this.now,
    };
    this.checkouts.push(checkout);
    return { ...checkout };
  }

  async findById(tenantId: number, id: number): Promise<CheckoutDto | undefined> {
    return this._copy((c) => c.tenantId === tenantId && c.id === id);
  }

  async findByPublicId(publicId: string): Promise<CheckoutDto | undefined> {
    return this._copy((c) => c.publicId === publicId);
  }

  async findByTransactionDatabaseId(
    tenantId: number,
    transactionDatabaseId: number,
  ): Promise<CheckoutDto | undefined> {
    return this._copy(
      (c) => c.tenantId === tenantId && c.transactionDatabaseId === transactionDatabaseId,
    );
  }

  async update(
    tenantId: number,
    id: number,
    changes: CheckoutUpdate,
  ): Promise<CheckoutDto | undefined> {
    const checkout = this.checkouts.find((c) => c.tenantId === tenantId && c.id === id);
    if (!checkout) {
      return undefined;
    }
    Object.assign(checkout, changes, { updatedAt: this.now });
    return { ...checkout };
  }

  async transition(
    tenantId: number,
    id: number,
    from: CheckoutStatus[],
    changes: CheckoutUpdate & { status: CheckoutStatus },
  ): Promise<CheckoutDto | undefined> {
    const checkout = this.checkouts.find((c) => c.tenantId === tenantId && c.id === id);
    if (!checkout || !from.includes(checkout.status)) {
      return undefined;
    }
    Object.assign(checkout, changes, { updatedAt: this.now });
    return { ...checkout };
  }

  async list(filter: CheckoutFilter): Promise<CheckoutDto[]> {
    return this.checkouts
      .filter(
        (c) =>
          (filter.tenantId === undefined || c.tenantId === filter.tenantId) &&
          (!filter.statuses || filter.statuses.includes(c.status)) &&
          (filter.beforeId === undefined || c.id < filter.beforeId),
      )
      .sort((a, b) => b.id - a.id)
      .slice(0, filter.limit)
      .map((c) => ({ ...c }));
  }

  async findStale(statuses: CheckoutStatus[], before: Date, limit: number): Promise<CheckoutDto[]> {
    return this.checkouts
      .filter((c) => statuses.includes(c.status) && (c.updatedAt ?? this.now) < before)
      .slice(0, limit)
      .map((c) => ({ ...c }));
  }

  async countByStatus(tenantId: number, statuses: CheckoutStatus[]): Promise<number> {
    return this.checkouts.filter((c) => c.tenantId === tenantId && statuses.includes(c.status))
      .length;
  }

  only(): CheckoutDto {
    if (this.checkouts.length !== 1) {
      throw new Error(`Expected one checkout, found ${this.checkouts.length}`);
    }
    return this.checkouts[0];
  }

  private _copy(match: (checkout: CheckoutDto) => boolean): CheckoutDto | undefined {
    const checkout = this.checkouts.find(match);
    return checkout ? { ...checkout } : undefined;
  }
}

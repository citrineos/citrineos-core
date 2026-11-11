// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// What the payment server's /api answers, as src/services/checkout-service.ts defines it: the
// parts of Core's DTOs a driver is shown, under Core's field names.

import type {
  ConnectorDto,
  EvseDto,
  LocationDto,
  TariffDto,
  TenantDto,
  TransactionDto,
} from '@citrineos/types';
import type {
  CheckoutFlow,
  CheckoutStatus,
  RemoteStartStatus,
} from '../../src/types/checkout-enums';

export { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../../src/types/checkout-enums';

/** Where an EVSE stands. */
export type EvseLocation = Pick<
  LocationDto,
  'name' | 'address' | 'city' | 'postalCode' | 'state' | 'country'
>;

export type TariffSummary = Pick<
  TariffDto,
  'currency' | 'pricePerMin' | 'pricePerSession' | 'taxRate'
> & {
  /** Major units, before VAT. */
  pricePerKwh: TariffDto['pricePerKwh'];
  /** Minor units, unlike Core's. */
  authorizationAmount: number | null;
};

export type Connector = Pick<
  ConnectorDto,
  'connectorId' | 'evseTypeConnectorId' | 'status' | 'type' | 'powerType' | 'maximumPowerWatts'
> & {
  id: number;
  tariff: TariffSummary | null;
};

/** Where a checkout's session runs; `evseId` is the printed eMI3 id, `id` Core's database id. */
export type CheckoutEvse = Pick<EvseDto, 'evseId'> & {
  id: number;
  location: EvseLocation | null;
  operatorName: TenantDto['name'] | null;
};

export interface EvseOffer extends CheckoutEvse {
  stationOnline: boolean;
  payable: boolean;
  termsUrl: string | null;
  connectors: Connector[];
}

/** Minor units, except the kWh and minutes. */
export interface Pricing {
  currency: string;
  taxRate: number;
  paymentFee: number;
  energyKwh: number;
  energyCosts: number;
  chargingMinutes: number;
  timeCosts: number;
  sessionCosts: number;
  totalCostsNet: number;
  taxCosts: number;
  totalCostsGross: number;
  paymentCosts: number;
}

export interface CheckoutState {
  publicId: string;
  flow: CheckoutFlow;
  status: CheckoutStatus;
  remoteStartStatus: RemoteStartStatus | null;
  currency: string;
  authorizedAmount: number | null;
  capturedAmount: number | null;
  tariff: TariffSummary;
  evse: CheckoutEvse | null;
  transaction: Pick<TransactionDto, 'startTime' | 'endTime' | 'isActive'> | null;
  pricing: Pricing | null;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : response.statusText;
    throw new ApiError(response.status, message);
  }
  const body: T = await response.json();
  return body;
}

export const api = {
  findEvse: (query: string) =>
    request<{ evseId: number }>(`/api/evses/lookup?q=${encodeURIComponent(query)}`),
  describeEvse: (evseId: number) => request<EvseOffer>(`/api/evses/${evseId}`),
  createCheckout: (evseId: number, connectorId: number) =>
    request<{ publicId: string; url: string }>('/api/checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evseId, connectorId }),
    }),
  checkout: (publicId: string) =>
    request<CheckoutState>(`/api/checkouts/${encodeURIComponent(publicId)}`),
  /** Scan and charge: where the QR code sends the driver to pay. */
  payUrl: (publicId: string) => `/api/checkouts/${encodeURIComponent(publicId)}/pay`,
};

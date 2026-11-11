// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CheckoutState, Connector, EvseOffer, Pricing } from '../src/api';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../src/api';

export const PUBLIC_ID = 'c0ffee00-0000-4000-8000-000000000000';

export const TARIFF = {
  currency: 'USD',
  pricePerKwh: 0.42,
  pricePerMin: 0.05,
  pricePerSession: 1.5,
  taxRate: 19,
  authorizationAmount: 5000,
};

export function aConnector(overrides: Partial<Connector> = {}): Connector {
  return {
    id: 70,
    evseTypeConnectorId: 1,
    status: 'Available',
    type: 'IEC62196T2',
    powerType: 'AC3Phase',
    maximumPowerWatts: 22000,
    tariff: TARIFF,
    ...overrides,
  };
}

export function anOffer(overrides: Partial<EvseOffer> = {}): EvseOffer {
  return {
    id: 7,
    evseId: 'US*CIT*E7',
    stationOnline: true,
    location: {
      name: 'Depot',
      address: '1 Main Street',
      city: 'Boston',
      postalCode: '02110',
      state: 'MA',
      country: 'USA',
    },
    operatorName: 'CitrineOS',
    payable: true,
    termsUrl: null,
    connectors: [aConnector()],
    ...overrides,
  };
}

export const PRICING: Pricing = {
  currency: 'USD',
  taxRate: 19,
  paymentFee: 2,
  energyKwh: 10,
  energyCosts: 420,
  chargingMinutes: 30,
  timeCosts: 150,
  sessionCosts: 150,
  totalCostsNet: 720,
  taxCosts: 136,
  totalCostsGross: 856,
  paymentCosts: 17,
};

export function aState(overrides: Partial<CheckoutState> = {}): CheckoutState {
  return {
    publicId: PUBLIC_ID,
    flow: CheckoutFlow.WebPortal,
    status: CheckoutStatus.Charging,
    remoteStartStatus: RemoteStartStatus.Accepted,
    currency: 'USD',
    authorizedAmount: 5000,
    capturedAmount: null,
    tariff: TARIFF,
    evse: {
      id: 7,
      evseId: 'US*CIT*E7',
      location: anOffer().location,
      operatorName: 'CitrineOS',
    },
    transaction: { startTime: '2026-10-23T10:00:00.000Z', isActive: true },
    pricing: PRICING,
    ...overrides,
  };
}

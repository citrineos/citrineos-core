// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import pg from 'pg';
import type { Address, PythonData } from './types.js';

/** Numeric columns come back as strings, or null. */
function num(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function text(value: unknown): string | null {
  return value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value);
}

/**
 * Reads the Python service's tables (`<prefix>operators` and so on, as its init_db.py creates
 * them). Read-only: those tables stay as the archive of what the Python service did.
 */
export async function readPythonData(
  connectionString: string,
  prefix: string,
): Promise<PythonData> {
  if (!/^[A-Za-z0-9_]*$/.test(prefix)) {
    throw new Error(`Table prefix ${prefix} is not a plain identifier`);
  }
  const table = (name: string) => `"${prefix}${name}"`;
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const rows = async (sql: string) => (await client.query(sql)).rows;
    const operators = await rows(`SELECT id, name, stripe_account_id FROM ${table('operators')}`);
    const locations = await rows(
      `SELECT id, operator_id, address, postal_code, city, state, country FROM ${table('locations')}`,
    );
    const evses = await rows(
      `SELECT id, evse_id, ocpp_evse_id, station_id, tenant_id, location_id FROM ${table('evses')}`,
    );
    const connectors = await rows(
      `SELECT id, connector_id, evse_id, tariff_id FROM ${table('connectors')}`,
    );
    const tariffs = await rows(
      `SELECT id, currency, price_kwh, price_minute, price_session, tax_rate,
              authorization_amount, payment_fee FROM ${table('tariffs')}`,
    );
    const [maxCheckout] = await rows(`SELECT max(id) AS max FROM ${table('checkouts')}`);
    // authorization_amount is only set by its webhook once the driver has paid; payment_intent_id
    // can be set on a checkout nobody paid. Older than 8 days, Stripe has released the hold.
    const paidCheckouts = await rows(
      `SELECT c.id, c.payment_intent_id, c.remote_request_transaction_id,
              c.transaction_end_time IS NOT NULL AS ended, e.station_id, o.stripe_account_id
         FROM ${table('checkouts')} c
         LEFT JOIN ${table('connectors')} k ON k.id = c.connector_id
         LEFT JOIN ${table('evses')} e ON e.id = k.evse_id
         LEFT JOIN ${table('locations')} l ON l.id = e.location_id
         LEFT JOIN ${table('operators')} o ON o.id = l.operator_id
        WHERE c.payment_intent_id IS NOT NULL AND c.authorization_amount IS NOT NULL
          AND (c.transaction_end_time IS NULL OR c.transaction_end_time > now() - interval '8 days')
        ORDER BY c.id`,
    );
    return {
      operators: operators.map((row) => ({
        id: row.id,
        name: row.name,
        stripeAccountId: row.stripe_account_id,
      })),
      locations: locations.map((row) => ({
        id: row.id,
        operatorId: row.operator_id,
        address: {
          address: text(row.address),
          postalCode: text(row.postal_code),
          city: text(row.city),
          state: text(row.state),
          country: text(row.country),
        } satisfies Address,
      })),
      evses: evses.map((row) => ({
        id: row.id,
        emi3EvseId: row.evse_id,
        ocppEvseId: row.ocpp_evse_id,
        stationId: row.station_id,
        tenantId: String(row.tenant_id),
        locationId: row.location_id,
      })),
      connectors: connectors.map((row) => ({
        id: row.id,
        connectorId: String(row.connector_id),
        evseId: row.evse_id,
        tariffId: row.tariff_id,
      })),
      tariffs: tariffs.map((row) => ({
        id: row.id,
        currency: row.currency,
        pricePerKwh: num(row.price_kwh),
        pricePerMin: num(row.price_minute),
        pricePerSession: num(row.price_session),
        taxRate: num(row.tax_rate),
        authorizationAmount: num(row.authorization_amount),
        paymentFee: num(row.payment_fee),
      })),
      maxCheckoutId: num(maxCheckout?.max) ?? 0,
      paidCheckouts: paidCheckouts.map((row) => ({
        id: Number(row.id),
        paymentIntentId: String(row.payment_intent_id),
        stripeAccountId: text(row.stripe_account_id),
        stationId: text(row.station_id),
        transactionId: text(row.remote_request_transaction_id),
        ended: row.ended === true,
      })),
    };
  } finally {
    await client.end();
  }
}

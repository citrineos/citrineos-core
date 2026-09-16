// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Type definitions for the OCA "OCPP & California Pricing Requirements" (v3.1) customization,
 * carried over OCPP 1.6 DataTransfer messages. The JSON below is serialized into the opaque
 * DataTransfer `data` string field. See the application note, section 3.
 */

/** Vendor identifier that scopes every DataTransfer message of this customization. */
export const COSTMSG_VENDOR_ID = 'org.openchargealliance.costmsg';

/** DataTransfer `messageId` values used by this customization */
export enum CostMsgId {
  SetUserPrice = 'SetUserPrice',
  RunningCost = 'RunningCost',
  FinalCost = 'FinalCost',
}

/** Configuration key a Central System reads to detect/enable the customization. */
export const CUSTOM_DISPLAY_COST_AND_PRICE_KEY = 'CustomDisplayCostAndPrice';

/** Configuration key that holds the station-wide default price (set via ChangeConfiguration). */
export const DEFAULT_PRICE_KEY = 'DefaultPrice';

/** Whether a running/final cost is being charged for active charging or for idle time. */
export type CostState = 'Charging' | 'Idle';

/** Unit prices applied while the EV is charging (Table 5). */
export interface ChargingPrice {
  kWhPrice?: number;
  hourPrice?: number;
  flatFee?: number;
}

/** SetUserPrice payload (Table 2) */
export interface SetUserPriceData {
  idToken: string;
  priceText: string;
}

/** RunningCost payload (Table 4) */
export interface RunningCostData {
  transactionId: number;
  timestamp: string;
  meterValue: number;
  cost: number;
  state: CostState;
  chargingPrice: ChargingPrice;
}

/** FinalCost payload (Table 3) */
export interface FinalCostData {
  transactionId: number;
  cost: number;
  priceText: string;
  qrCodeText?: string;
}

/** DefaultPrice value (Table 1) */
export interface DefaultPriceData {
  priceText: string;
  priceTextOffline?: string;
  chargingPrice?: ChargingPrice;
}

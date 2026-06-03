// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTransferEncoding } from '@citrineos/data';

/**
 * Result of decoding the DataTransfer `data` field. Decoding is best-effort and
 * NEVER throws — a failure is a recorded event (encoding = text/unknown), not an error.
 */
export interface DecodedData {
  parsed: any | null;
  encoding: DataTransferEncoding;
}

/**
 * The raw form of `data` as stored: a string for OCPP1.6, JSON-stringified for 2.0.1 objects.
 */
export function rawDataString(data?: string | Record<string, unknown> | null): string | null {
  if (data == null) return null;
  return typeof data === 'string' ? data : JSON.stringify(data);
}

function tryJsonParse(s: string): any | null {
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? v : null;
  } catch {
    return null;
  }
}

/**
 * Decode the `data` field defensively. OCPP2.0.1 delivers an object (taken as-is);
 * OCPP1.6 delivers a string decoded as json → base64-json → text/unknown.
 *
 * NOTE: malformed-but-recognizable vendor payloads (e.g. wl's unclosed `vid` quote)
 * are NOT repaired here — a vendor parser recovers fields from the raw string instead.
 */
export function decodeDataField(data?: string | Record<string, unknown> | null): DecodedData {
  if (data == null || data === '') {
    return { parsed: null, encoding: DataTransferEncoding.Text };
  }

  if (typeof data === 'object') {
    return { parsed: data, encoding: DataTransferEncoding.Json };
  }

  const asJson = tryJsonParse(data);
  if (asJson) return { parsed: asJson, encoding: DataTransferEncoding.Json };

  // base64 → JSON (some firmwares base64 the payload)
  if (/^[A-Za-z0-9+/=\s]+$/.test(data) && data.replace(/\s/g, '').length % 4 === 0) {
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf8');
      const asB64Json = tryJsonParse(decoded);
      if (asB64Json) return { parsed: asB64Json, encoding: DataTransferEncoding.Base64Json };
    } catch {
      /* fall through */
    }
  }

  return { parsed: null, encoding: DataTransferEncoding.Unknown };
}

/**
 * Normalized output of a vendor parser. All fields optional — populate what the
 * payload carried so the handler can store/resolve them.
 */
export interface ParsedPayload {
  transactionId?: number | string;
  connectorId?: number;
  vid?: string | null;
  soc?: number;
  power?: number;
  location?: { lat?: number; lng?: number; alt?: number };
  [k: string]: unknown;
}

export interface VendorParser {
  /** Registry key label, also stored on the row (e.g. `wl:vidInfoReport`). */
  readonly name: string;
  /**
   * @param parsed structured payload when strict decode succeeded, else null
   * @param raw    the raw data string, for tolerant extraction when `parsed` is null
   * @returns the extracted payload, or null if nothing usable could be extracted
   */
  parse(parsed: any | null, raw: string | null): ParsedPayload | null;
}

/** Placeholder vid sent when no card/vehicle is present. */
const VID_PLACEHOLDER = '01FF00000000';

function normalizeVid(rawVid?: string | null): string | null {
  if (!rawVid) return null;
  const v = String(rawVid).trim();
  return v && v !== VID_PLACEHOLDER ? v : null;
}

/**
 * wl `vidInfoReport`. Strict-parses when possible; otherwise tolerantly extracts
 * fields from the raw string — wl emits malformed JSON with an unclosed `vid` quote,
 * e.g. `{"transactionId":5, "connecterId":1, "vid":"1063A350C4E8, "timestamp":"..."}`.
 */
const wlVidInfoReport: VendorParser = {
  name: 'wl:vidInfoReport',
  parse: (parsed, raw) => {
    const src = parsed ?? extractWlFields(raw);
    if (!src) return null;
    return {
      transactionId: src.transactionId,
      connectorId: src.connectorId ?? src.connecterId, // vendor typo: "connecterId"
      vid: normalizeVid(src.vid),
    };
  },
};

/** Tolerant field extraction from wl's malformed `data` string. */
function extractWlFields(raw: string | null): Record<string, any> | null {
  if (!raw) return null;
  const num = (key: string): number | undefined => {
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
    return m ? Number(m[1]) : undefined;
  };
  // vid value: capture up to the next quote OR a comma (the unclosed-quote case)
  const vidMatch = raw.match(/"vid"\s*:\s*"([^",]+)/);
  const out: Record<string, any> = {
    transactionId: num('transactionId'),
    connecterId: num('connecterId') ?? num('connectorId'),
    vid: vidMatch ? vidMatch[1].trim() : undefined,
  };
  return out.transactionId === undefined && out.vid === undefined ? null : out;
}

const numField = (key: string): VendorParser['parse'] => (parsed) => {
  const v = parsed?.[key];
  return typeof v === 'number' ? ({ [key]: v } as ParsedPayload) : null;
};

const chargeFairySoc: VendorParser = { name: 'com.chargefairy:soc', parse: numField('soc') };
const chargeFairyPower: VendorParser = { name: 'com.chargefairy:power', parse: numField('power') };
const chargeFairyLocation: VendorParser = {
  name: 'com.chargefairy:Location',
  parse: (parsed) =>
    parsed ? { location: { lat: parsed.lat, lng: parsed.lng, alt: parsed.alt } } : null,
};

/**
 * Registry keyed by `${vendorId}:${messageId}`. Add a vendor message here to start
 * parsing + Accepting it. Unknown vendor → UnknownVendorId; known vendor, unknown
 * messageId → UnknownMessageId.
 */
const REGISTRY: ReadonlyMap<string, VendorParser> = new Map([
  [wlVidInfoReport.name, wlVidInfoReport],
  [chargeFairySoc.name, chargeFairySoc],
  [chargeFairyPower.name, chargeFairyPower],
  [chargeFairyLocation.name, chargeFairyLocation],
]);

const KNOWN_VENDORS: ReadonlySet<string> = new Set(['wl', 'com.chargefairy']);

export function isKnownVendor(vendorId: string): boolean {
  return KNOWN_VENDORS.has(vendorId);
}

export function lookupParser(vendorId: string, messageId?: string | null): VendorParser | undefined {
  return REGISTRY.get(`${vendorId}:${messageId ?? ''}`);
}

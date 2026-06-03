// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DataTransferEncoding } from '@citrineos/data';
import { describe, expect, it } from 'vitest';
import {
  decodeDataField,
  isKnownVendor,
  lookupParser,
  rawDataString,
} from '../../src/module/dataTransfer/parser.js';

describe('DataTransfer parser', () => {
  describe('decodeDataField', () => {
    it('decodes clean JSON', () => {
      const { parsed, encoding } = decodeDataField('{"soc":10.0}');
      expect(parsed).toEqual({ soc: 10 });
      expect(encoding).toBe(DataTransferEncoding.Json);
    });

    it('does not strict-parse wl malformed JSON (unclosed vid quote)', () => {
      const raw =
        '{"transactionId":5, "connecterId":1, "vid":"1063A350C4E8, "timestamp":"2026-06-03T16:08:57.212Z"}';
      const { parsed, encoding } = decodeDataField(raw);
      expect(parsed).toBeNull();
      expect(encoding).toBe(DataTransferEncoding.Unknown);
    });

    it('decodes base64-encoded JSON', () => {
      const b64 = Buffer.from('{"power":-1024.0}', 'utf8').toString('base64');
      const { parsed, encoding } = decodeDataField(b64);
      expect(parsed).toEqual({ power: -1024 });
      expect(encoding).toBe(DataTransferEncoding.Base64Json);
    });

    it('falls back to unknown for non-JSON text without throwing', () => {
      const { parsed, encoding } = decodeDataField('QueryCard');
      expect(parsed).toBeNull();
      expect(encoding).toBe(DataTransferEncoding.Unknown);
    });

    it('treats null/empty as text', () => {
      expect(decodeDataField(null).encoding).toBe(DataTransferEncoding.Text);
      expect(decodeDataField('').encoding).toBe(DataTransferEncoding.Text);
    });

    it('takes an OCPP2.0.1 object payload as-is', () => {
      const { parsed, encoding } = decodeDataField({ soc: 42 });
      expect(parsed).toEqual({ soc: 42 });
      expect(encoding).toBe(DataTransferEncoding.Json);
    });
  });

  describe('rawDataString', () => {
    it('returns strings unchanged and stringifies objects', () => {
      expect(rawDataString('x')).toBe('x');
      expect(rawDataString({ a: 1 })).toBe('{"a":1}');
      expect(rawDataString(null)).toBeNull();
    });
  });

  describe('vendor registry', () => {
    it('recognizes known vendors only', () => {
      expect(isKnownVendor('wl')).toBe(true);
      expect(isKnownVendor('com.chargefairy')).toBe(true);
      expect(isKnownVendor('nope')).toBe(false);
    });

    it('wl:vidInfoReport extracts vid from a clean object and nulls the placeholder', () => {
      const p = lookupParser('wl', 'vidInfoReport')!;
      expect(p.parse({ vid: '1063A350C4E8', connecterId: 2, transactionId: 7 }, null)).toMatchObject(
        { vid: '1063A350C4E8', connectorId: 2, transactionId: 7 },
      );
      expect(p.parse({ vid: '01FF00000000' }, null)!.vid).toBeNull();
    });

    it('wl:vidInfoReport recovers fields from the malformed raw string', () => {
      const p = lookupParser('wl', 'vidInfoReport')!;
      const raw =
        '{"transactionId":5, "connecterId":1, "vid":"1063A350C4E8, "timestamp":"2026-06-03T16:08:57.212Z"}';
      expect(p.parse(null, raw)).toMatchObject({
        vid: '1063A350C4E8',
        connectorId: 1,
        transactionId: 5,
      });
    });

    it('maps chargefairy telemetry messageIds', () => {
      expect(lookupParser('com.chargefairy', 'soc')!.parse({ soc: 10 }, null)).toEqual({ soc: 10 });
      expect(lookupParser('com.chargefairy', 'power')!.parse({ power: -1024 }, null)).toEqual({
        power: -1024,
      });
      expect(
        lookupParser('com.chargefairy', 'Location')!.parse({ lat: 1, lng: 2, alt: 0 }, null),
      ).toEqual({ location: { lat: 1, lng: 2, alt: 0 } });
    });

    it('returns undefined for unknown messageId', () => {
      expect(lookupParser('wl', 'somethingElse')).toBeUndefined();
    });
  });
});

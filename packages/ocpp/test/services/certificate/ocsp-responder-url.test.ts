// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  assertAllowedOcspResponder,
  OCSP_RESPONSE_MAX_BYTES,
  readCappedBody,
} from '@/services/certificate/ocsp-responder-url.js';

describe('assertAllowedOcspResponder', () => {
  it('returns the parsed url when no hosts are configured', () => {
    const url = assertAllowedOcspResponder('http://ocsp.example.com/status', []);

    expect(url.hostname).toBe('ocsp.example.com');
  });

  it('accepts a host on the configured list', () => {
    const url = assertAllowedOcspResponder('https://ocsp.example.com/status', ['ocsp.example.com']);

    expect(url.hostname).toBe('ocsp.example.com');
  });

  it.each([
    ['upper case in the configured host', ['OCSP.EXAMPLE.COM']],
    ['surrounding whitespace in the configured host', ['  ocsp.example.com  ']],
  ])('matches despite %s', (_label, allowed) => {
    expect(assertAllowedOcspResponder('http://ocsp.example.com/', allowed).hostname).toBe(
      'ocsp.example.com',
    );
  });

  it('refuses a host that is not on the configured list', () => {
    expect(() =>
      assertAllowedOcspResponder('http://169.254.169.254/latest/meta-data', ['ocsp.example.com']),
    ).toThrow(/not permitted/);
  });

  it.each(['file:///etc/passwd', 'ftp://ocsp.example.com/'])(
    'refuses the protocol in %s',
    (url) => {
      expect(() => assertAllowedOcspResponder(url, [])).toThrow(/protocol/);
    },
  );

  it('refuses a value that is not a URL', () => {
    expect(() => assertAllowedOcspResponder('not-a-url', [])).toThrow(/not a URL/);
  });
});

function aResponse(chunks: Uint8Array[], contentLength?: number): Response {
  const headers = new Headers();
  if (contentLength !== undefined) {
    headers.set('content-length', String(contentLength));
  }
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new Response(body, { headers });
}

describe('readCappedBody', () => {
  it('returns the body when it is within the cap', async () => {
    const body = await readCappedBody(aResponse([Uint8Array.from([1, 2, 3])]), 16);

    expect([...body]).toEqual([1, 2, 3]);
  });

  it('refuses a body whose declared length exceeds the cap', async () => {
    await expect(readCappedBody(aResponse([Uint8Array.from([1])], 99), 16)).rejects.toThrow(
      /exceeds the 16 byte cap/,
    );
  });

  it('refuses a body that exceeds the cap while streaming', async () => {
    const chunks = [Uint8Array.from([1, 2, 3, 4]), Uint8Array.from([5, 6, 7, 8])];

    await expect(readCappedBody(aResponse(chunks), 6)).rejects.toThrow(/exceeds the 6 byte cap/);
  });

  it('caps at 64KiB by default', () => {
    expect(OCSP_RESPONSE_MAX_BYTES).toBe(65536);
  });
});

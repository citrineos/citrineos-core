// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const OCSP_REQUEST_TIMEOUT_MS = 10_000;
export const OCSP_RESPONSE_MAX_BYTES = 64 * 1024;

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function assertAllowedOcspResponder(responderURL: string, allowedHosts: string[]): URL {
  let url: URL;
  try {
    url = new URL(responderURL);
  } catch {
    throw new Error(`Refusing OCSP responder URL that is not a URL: ${responderURL}`);
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`Refusing OCSP responder URL with protocol ${url.protocol}: ${responderURL}`);
  }

  if (allowedHosts.length === 0) {
    return url;
  }

  const host = url.hostname.toLowerCase();
  if (!allowedHosts.some((allowed) => allowed.trim().toLowerCase() === host)) {
    throw new Error(`Refusing OCSP responder host that is not permitted: ${responderURL}`);
  }

  return url;
}

export async function readCappedBody(response: Response, maxBytes: number): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error(`OCSP response of ${declared} bytes exceeds the ${maxBytes} byte cap`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return Buffer.alloc(0);
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`OCSP response exceeds the ${maxBytes} byte cap`);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks);
}

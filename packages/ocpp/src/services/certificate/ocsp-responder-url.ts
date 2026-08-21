// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { type RequestOptions, request as httpsRequest } from 'node:https';

/**
 * Every OCSP responder URL the CSMS fetches is chosen by the charging station: GetCertificateStatus
 * and AuthorizeRequest both carry it as OCSPRequestDataType.responderURL, and the chain check reads
 * it out of the AIA extension of a certificate the station supplied. None of those is a value the
 * CSMS picked, so the URL is treated as untrusted input and has to name a public responder before
 * anything is sent to it.
 *
 * Checking the name and then handing the URL to a client that resolves it again leaves the check
 * meaningless: the second answer decides where the request goes, and whoever runs the name's DNS
 * chooses both answers. The request is therefore sent to the address that was checked, with the
 * original host carried in the Host header and in SNI so the responder still sees the name it
 * expects and TLS is still verified against it.
 */

/** A responder lives on the public internet; nothing else is a legitimate target. */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

function isPrivateIPv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local, and the cloud metadata address
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast and reserved
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const normalised = address.toLowerCase().split('%')[0];
  if (normalised === '::1' || normalised === '::') return true;
  if (normalised.startsWith('fe80')) return true; // link-local
  if (/^f[cd]/.test(normalised)) return true; // unique local
  // An IPv4-mapped address reaches the same host, so it gets the same test.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalised);
  return mapped ? isPrivateIPv4(mapped[1]) : false;
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIPv4(address);
  if (version === 6) return isPrivateIPv6(address);
  return false;
}

export interface PinnedResponder {
  url: URL;
  /** The address the request will be sent to, already checked. */
  address: string;
}

/**
 * Resolves a responder URL to the single public address the request may go to, refusing anything
 * that is not an http(s) URL naming a public host. Every address a name resolves to is checked, so
 * a name answering with one public and one private address is refused rather than half-accepted.
 */
export async function resolvePublicOcspResponder(responderURL: string): Promise<PinnedResponder> {
  let url: URL;
  try {
    url = new URL(responderURL);
  } catch {
    throw new Error(`Refusing OCSP responder URL that is not a URL: ${responderURL}`);
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`Refusing OCSP responder URL with protocol ${url.protocol}: ${responderURL}`);
  }

  // A bracketed IPv6 literal keeps its brackets in url.hostname.
  const host = url.hostname.replace(/^\[|]$/g, '');

  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new Error(`Refusing OCSP responder URL on a private address: ${responderURL}`);
    }
    return { url, address: host };
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch (error) {
    throw new Error(
      `Refusing OCSP responder URL whose host does not resolve: ${responderURL}: ${error}`,
    );
  }

  if (addresses.length === 0) {
    throw new Error(`Refusing OCSP responder URL whose host does not resolve: ${responderURL}`);
  }

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error(`Refusing OCSP responder URL resolving to a private address: ${responderURL}`);
  }

  return { url, address: addresses[0].address };
}

export interface OcspResponderReply {
  status: number;
  body: string;
}

/**
 * Sends one OCSP request to a station-named responder, having first established that it is public,
 * and sends it to the address that was established rather than to the name. Redirects are not
 * followed: the caller treats any non-2xx as a failure, and following one would reach an address
 * that was never checked.
 */
export async function sendToPublicOcspResponder(
  responderURL: string,
  body: string,
  timeoutMs: number,
): Promise<OcspResponderReply> {
  const { url, address } = await resolvePublicOcspResponder(responderURL);
  const isSecure = url.protocol === 'https:';

  const options: RequestOptions = {
    host: address,
    port: url.port || (isSecure ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/ocsp-request',
      Accept: 'application/ocsp-response',
      'Content-Length': Buffer.byteLength(body),
      // The responder is reached by address, so it is told the name it was asked for.
      Host: url.host,
    },
    timeout: timeoutMs,
  };
  if (isSecure) {
    // Both SNI and the certificate identity check use this, so TLS is still verified against the
    // name rather than against the address the connection went to.
    options.servername = url.hostname.replace(/^\[|]$/g, '');
  }

  return new Promise<OcspResponderReply>((resolve, reject) => {
    const send = isSecure ? httpsRequest : httpRequest;
    const req = send(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString() }),
      );
      res.on('error', reject);
    });
    req.on('timeout', () => {
      req.destroy(new Error(`OCSP responder ${responderURL} did not answer within ${timeoutMs}ms`));
    });
    req.on('error', reject);
    req.end(body);
  });
}

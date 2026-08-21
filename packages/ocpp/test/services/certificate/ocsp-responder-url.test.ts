// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookup = vi.hoisted(() => vi.fn());
const httpsRequest = vi.hoisted(() => vi.fn());
const httpRequest = vi.hoisted(() => vi.fn());

vi.mock('node:dns/promises', () => ({ lookup }));
vi.mock('node:https', () => ({ request: httpsRequest }));
vi.mock('node:http', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:http')>()),
  request: httpRequest,
}));

const { isPrivateAddress, resolvePublicOcspResponder, sendToPublicOcspResponder } = await import(
  '@/services/certificate/ocsp-responder-url.js'
);

/**
 * The responder URL is chosen by the charging station, and the CSMS fetches it from inside its own
 * network. GetCertificateStatus hands the body straight back to the station, so an unchecked URL
 * reads whatever the CSMS can reach.
 */
describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fe80::1',
    'fd00::1',
    '::ffff:169.254.169.254',
  ])('treats %s as private', (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '192.169.0.1', '2606:4700:4700::1111'])(
    'treats %s as public',
    (address) => {
      expect(isPrivateAddress(address)).toBe(false);
    },
  );
});

describe('resolvePublicOcspResponder', () => {
  beforeEach(() => {
    lookup.mockReset();
  });

  it('accepts a literal public address without resolving anything', async () => {
    await expect(resolvePublicOcspResponder('http://8.8.8.8/ocsp')).resolves.toMatchObject({
      address: '8.8.8.8',
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('refuses the cloud metadata address', async () => {
    await expect(
      resolvePublicOcspResponder('http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(/private address/);
  });

  it.each(['http://127.0.0.1:8080/ocsp', 'http://10.0.0.5/ocsp', 'http://[::1]:8080/ocsp'])(
    'refuses %s',
    async (url) => {
      await expect(resolvePublicOcspResponder(url)).rejects.toThrow(/private address/);
    },
  );

  it.each(['file:///etc/passwd', 'ftp://example.com/ocsp', 'gopher://example.com/'])(
    'refuses the %s scheme',
    async (url) => {
      await expect(resolvePublicOcspResponder(url)).rejects.toThrow(/protocol/);
    },
  );

  it('refuses something that is not a URL at all', async () => {
    await expect(resolvePublicOcspResponder('not a url')).rejects.toThrow(/not a URL/);
  });

  it('refuses a name resolving to a private address', async () => {
    lookup.mockResolvedValue([{ address: '10.0.0.5' }]);

    await expect(resolvePublicOcspResponder('http://ocsp.example.com/')).rejects.toThrow(
      /resolving to a private address/,
    );
  });

  it('refuses a name that answers with one public and one private address', async () => {
    // Accepting the public answer and discarding the other would leave the choice of which is used
    // to whoever runs the name.
    lookup.mockResolvedValue([{ address: '8.8.8.8' }, { address: '169.254.169.254' }]);

    await expect(resolvePublicOcspResponder('http://ocsp.example.com/')).rejects.toThrow(
      /resolving to a private address/,
    );
  });

  it('refuses a host that does not resolve', async () => {
    lookup.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(resolvePublicOcspResponder('http://ocsp.example.com/')).rejects.toThrow(
      /does not resolve/,
    );
  });
});

describe('sendToPublicOcspResponder', () => {
  beforeEach(() => {
    lookup.mockReset();
    httpsRequest.mockReset();
    httpRequest.mockReset();
  });

  /** Captures the options a request was issued with and answers 200. */
  function captureRequest(mock: typeof httpsRequest) {
    mock.mockImplementation((_options: unknown, onResponse: (res: unknown) => void) => {
      const listeners: Record<string, (arg?: unknown) => void> = {};
      queueMicrotask(() => {
        onResponse({
          statusCode: 200,
          on: (event: string, handler: (arg?: unknown) => void) => {
            listeners[event] = handler;
            if (event === 'end') queueMicrotask(() => handler());
          },
        });
      });
      return { on: () => undefined, end: () => undefined };
    });
  }

  it('sends the request to the address that was checked, not to the name', async () => {
    // The whole point of resolving first is lost if the client resolves the name again: the second
    // answer decides where the request goes, and the name's owner chooses both answers.
    lookup.mockResolvedValue([{ address: '203.0.113.10' }]);
    captureRequest(httpsRequest);

    await sendToPublicOcspResponder('https://ocsp.example.com/path', 'ABCD', 5_000);

    expect(httpsRequest).toHaveBeenCalledOnce();
    expect(httpsRequest.mock.calls[0][0]).toMatchObject({
      host: '203.0.113.10',
      // TLS is still verified against the name, and the responder is still told which name.
      servername: 'ocsp.example.com',
      headers: expect.objectContaining({ Host: 'ocsp.example.com' }),
    });
  });

  it('returns the responder status and body', async () => {
    lookup.mockResolvedValue([{ address: '203.0.113.10' }]);
    captureRequest(httpRequest);

    const reply = await sendToPublicOcspResponder('http://ocsp.example.com/', 'ABCD', 5_000);

    expect(reply.status).toBe(200);
  });

  it('does not issue a request at all when the responder is private', async () => {
    await expect(
      sendToPublicOcspResponder('http://169.254.169.254/latest/meta-data/', 'ABCD', 5_000),
    ).rejects.toThrow(/private address/);

    expect(httpRequest).not.toHaveBeenCalled();
    expect(httpsRequest).not.toHaveBeenCalled();
  });
});

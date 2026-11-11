// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** The headers that authenticate a request to Core on behalf of a tenant. */
export interface ICoreAuth {
  headersFor(tenantId: number): Promise<Record<string, string>>;
  /** Core refused the headers: whatever was cached for the tenant is stale. */
  invalidate(tenantId: number): void;
}

/** Headers as configured: per tenant where given, the shared ones otherwise. */
export class StaticCoreAuth implements ICoreAuth {
  constructor(
    private readonly _headers: Record<string, string>,
    private readonly _tenantHeaders: Record<string, Record<string, string>> = {},
  ) {}

  async headersFor(tenantId: number): Promise<Record<string, string>> {
    return this._tenantHeaders[String(tenantId)] ?? this._headers;
  }

  invalidate(): void {}
}

/** A token is renewed this long before it says it expires. */
const RENEW_MARGIN_MS = 60_000;

/**
 * For a Core in auth mode localDev, which mints its own tokens: one is asked for per tenant from
 * /dev/token and kept until shortly before it expires. Core refuses localDev in production.
 */
export class LocalDevCoreAuth implements ICoreAuth {
  private readonly _tokens = new Map<number, MintedToken>();
  private readonly _minting = new Map<number, Promise<MintedToken>>();

  constructor(
    private readonly _baseUrl: string,
    private readonly _roles: string[],
    private readonly _fetch: typeof fetch = fetch,
    private readonly _now: () => number = Date.now,
  ) {}

  async headersFor(tenantId: number): Promise<Record<string, string>> {
    const cached = this._tokens.get(tenantId);
    if (cached && cached.renewAt > this._now()) {
      return { Authorization: `Bearer ${cached.token}` };
    }
    // Concurrent requests for a tenant share one mint.
    let minting = this._minting.get(tenantId);
    if (!minting) {
      minting = this._mint(tenantId).finally(() => this._minting.delete(tenantId));
      this._minting.set(tenantId, minting);
    }
    const minted = await minting;
    this._tokens.set(tenantId, minted);
    return { Authorization: `Bearer ${minted.token}` };
  }

  invalidate(tenantId: number): void {
    this._tokens.delete(tenantId);
  }

  private async _mint(tenantId: number): Promise<MintedToken> {
    const response = await this._fetch(new URL('/dev/token', this._baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: this._roles, tenantId }),
    });
    if (!response.ok) {
      throw new Error(`Core minted no localDev token for tenant ${tenantId}: ${response.status}`);
    }
    const body: unknown = await response.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('accessToken' in body) ||
      typeof body.accessToken !== 'string'
    ) {
      throw new Error('Core answered /dev/token without an accessToken');
    }
    return { token: body.accessToken, renewAt: this._expiryOf(body.accessToken) - RENEW_MARGIN_MS };
  }

  /** A JWT's `exp` in milliseconds; a token without one is kept for an hour. */
  private _expiryOf(token: string): number {
    try {
      const payload: unknown = JSON.parse(
        Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf-8'),
      );
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'exp' in payload &&
        typeof payload.exp === 'number'
      ) {
        return payload.exp * 1000;
      }
    } catch {
      // Not a JWT: kept as one without an expiry.
    }
    return this._now() + 3_600_000;
  }
}

interface MintedToken {
  token: string;
  renewAt: number;
}

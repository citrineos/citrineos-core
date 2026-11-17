// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { AdminAuthenticator, AdminScope, PaymentPermission } from '../../src/admin/admin-auth.js';
import type { CallerPermissions, ICorePermissions } from '../../src/admin/core-permissions.js';
import { PaymentError, PaymentErrorCode } from '../../src/services/errors.js';

const API_KEY = 'an-admin-api-key-that-is-long-enough';

/** Core, as far as the authenticator sees it: what it says about each Authorization header. */
class FakeCorePermissions implements ICorePermissions {
  asked: (string | undefined)[] = [];

  constructor(private readonly _callers: Record<string, CallerPermissions> = {}) {}

  async forCaller(authorization: string | undefined): Promise<CallerPermissions | undefined> {
    this.asked.push(authorization);
    return this._callers[authorization ?? ''];
  }
}

const operator: CallerPermissions = {
  tenantId: 3,
  permissions: [PaymentPermission.CheckoutsGet, 'permissions.user.get'],
  enforcing: true,
};

async function refusal(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  if (!(error instanceof PaymentError)) {
    throw new Error(`Expected a PaymentError, got ${String(error)}`);
  }
  return error.code;
}

describe('AdminAuthenticator', () => {
  it('grants the platform access to the API key, without asking Core', async () => {
    const core = new FakeCorePermissions();

    expect(
      await new AdminAuthenticator({ apiKey: API_KEY }, core).authenticate(
        `Bearer ${API_KEY}`,
        PaymentPermission.AccountsDelete,
      ),
    ).toEqual({ scope: AdminScope.Platform });
    expect(core.asked).toEqual([]);
  });

  it('grants a caller Core gives the permission access to the caller’s tenant', async () => {
    const authenticator = new AdminAuthenticator(
      {},
      new FakeCorePermissions({ 'Bearer op': operator }),
    );

    expect(await authenticator.authenticate('Bearer op', PaymentPermission.CheckoutsGet)).toEqual({
      scope: AdminScope.Tenant,
      tenantId: 3,
    });
  });

  it('refuses a caller Core does not give the permission', async () => {
    const authenticator = new AdminAuthenticator(
      {},
      new FakeCorePermissions({ 'Bearer op': operator }),
    );

    expect(
      await refusal(authenticator.authenticate('Bearer op', PaymentPermission.CheckoutsCancel)),
    ).toBe(PaymentErrorCode.Forbidden);
  });

  it('grants everything, in the caller’s tenant, when Core enforces no permissions', async () => {
    const authenticator = new AdminAuthenticator(
      {},
      new FakeCorePermissions({ '': { tenantId: 1, permissions: [], enforcing: false } }),
    );

    expect(await authenticator.authenticate(undefined, PaymentPermission.AccountsDelete)).toEqual({
      scope: AdminScope.Tenant,
      tenantId: 1,
    });
  });

  it.each([
    ['nothing, which Core refuses', undefined, PaymentErrorCode.Unauthorized],
    ['credentials Core refuses', 'Bearer stolen', PaymentErrorCode.Forbidden],
    [
      'a wrong API key, which Core refuses too',
      `Bearer ${API_KEY.replace('a', 'b')}`,
      PaymentErrorCode.Forbidden,
    ],
  ])('refuses %s', async (_name, authorization, code) => {
    const authenticator = new AdminAuthenticator({ apiKey: API_KEY }, new FakeCorePermissions());

    expect(
      await refusal(authenticator.authenticate(authorization, PaymentPermission.CheckoutsGet)),
    ).toBe(code);
  });
});

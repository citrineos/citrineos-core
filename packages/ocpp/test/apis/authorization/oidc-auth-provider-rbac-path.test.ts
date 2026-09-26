// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import { describe, expect, it, vi } from 'vitest';

const loaderPaths = vi.hoisted(() => [] as string[]);

// Only the path the provider hands the loader matters here, so the loader itself is replaced.
vi.mock('@/apis/authorization/rbac/rbac-rules-loader.js', () => ({
  RbacRulesLoader: class {
    constructor(rulesFilePath: string) {
      loaderPaths.push(rulesFilePath);
    }
    getRequiredRoles() {
      return null;
    }
  },
}));

import { OIDCAuthProvider } from '@/apis/authorization/provider/oidc-auth-provider.js';

const OIDC = {
  jwksUri: 'http://jwks.invalid/keys',
  issuer: 'https://idp.example.test/realms/citrineos',
  audience: 'citrineos-central-system',
};

describe('OIDCAuthProvider rbac rules file', () => {
  it('falls back to rbac-rules.json when no rbac config is given', () => {
    loaderPaths.length = 0;

    new OIDCAuthProvider(OIDC);

    expect(loaderPaths).toEqual(['rbac-rules.json']);
  });

  it('takes the file name from the rbac config', () => {
    loaderPaths.length = 0;

    new OIDCAuthProvider(OIDC, undefined, { rulesFileName: 'my-rbac.json' });

    expect(loaderPaths).toEqual(['my-rbac.json']);
  });

  it('joins the configured rules directory with the file name', () => {
    loaderPaths.length = 0;

    new OIDCAuthProvider(OIDC, undefined, {
      rulesDir: '/etc/citrine',
      rulesFileName: 'my-rbac.json',
    });

    expect(loaderPaths).toEqual([path.join('/etc/citrine', 'my-rbac.json')]);
  });
});

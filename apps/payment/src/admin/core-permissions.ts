// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';

/** The part of Core's `GET /permissions/user` answer the admin API decides on. */
const CallerPermissionsSchema = z.object({
  tenantId: z.coerce.number().int().min(1),
  permissions: z.array(z.string()),
  /** False when Core runs in auth mode localBypass and grants everything. */
  enforcing: z.boolean(),
});
export type CallerPermissions = z.infer<typeof CallerPermissionsSchema>;

export interface ICorePermissions {
  /**
   * The caller's tenant and permissions as Core sees them, for the `Authorization` header it
   * sent; undefined when Core does not accept the credentials.
   */
  forCaller(authorization: string | undefined): Promise<CallerPermissions | undefined>;
}

const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 1_000;

/**
 * Asks Core what a caller may do, so the admin API grants exactly what Core's roles grant, in
 * every auth mode Core runs in. Answers are kept briefly: a changed role takes effect within
 * `CACHE_TTL_MS`, as it does in Core within its own refresh interval.
 */
export class CorePermissions implements ICorePermissions {
  private readonly _answers = new Map<
    string,
    { expiresAt: number; permissions: CallerPermissions | undefined }
  >();

  constructor(
    private readonly _coreUrl: string,
    private readonly _fetch: typeof fetch = fetch,
    private readonly _now: () => number = () => Date.now(),
  ) {}

  async forCaller(authorization: string | undefined): Promise<CallerPermissions | undefined> {
    const key = authorization ?? '';
    const cached = this._answers.get(key);
    if (cached && cached.expiresAt > this._now()) {
      return cached.permissions;
    }

    const response = await this._fetch(new URL('/permissions/user', this._coreUrl), {
      headers: authorization ? { Authorization: authorization } : {},
    });
    let permissions: CallerPermissions | undefined;
    if (response.status === 401 || response.status === 403) {
      permissions = undefined;
    } else if (!response.ok) {
      throw new Error(`Core answered ${response.status} when asked for the caller's permissions`);
    } else {
      const parsed = CallerPermissionsSchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error(
          `Core's permissions answer names no tenant or permissions: ${parsed.error}`,
        );
      }
      permissions = parsed.data;
    }
    this._remember(key, permissions);
    return permissions;
  }

  private _remember(key: string, permissions: CallerPermissions | undefined): void {
    const now = this._now();
    if (this._answers.size >= CACHE_MAX_ENTRIES) {
      for (const [cachedKey, cached] of this._answers) {
        if (cached.expiresAt <= now) {
          this._answers.delete(cachedKey);
        }
      }
    }
    if (this._answers.size >= CACHE_MAX_ENTRIES) {
      // Oldest first: a Map iterates in insertion order.
      const oldest = this._answers.keys().next().value;
      if (oldest !== undefined) {
        this._answers.delete(oldest);
      }
    }
    this._answers.set(key, { expiresAt: now + CACHE_TTL_MS, permissions });
  }
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { locations, NewLocation } from '@entities/location.entity';

/**
 * CRUD for the per-tenant Locations table. Used by the REST admin
 * surface and by ChargingStation onboarding flows that resolve a
 * location by name/postal code.
 */
@Injectable()
export class LocationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: NewLocation) {
    const [row] = await this.db.insert(locations).values(data).returning();
    return row;
  }

  async findById(tenantId: number, id: number) {
    const rows = await this.db
      .select()
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)))
      .limit(1);
    return rows[0];
  }

  async findAll(tenantId: number) {
    return this.db.select().from(locations).where(eq(locations.tenantId, tenantId));
  }
}

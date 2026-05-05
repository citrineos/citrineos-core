// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { variableAttributes, NewVariableAttribute } from '@entities/variable-attribute.entity';

/**
 * VariableAttributes is keyed on `(stationId, componentId, variableId, type)`
 * — the legacy table has a unique constraint on those four. We don't have
 * the constraint in Drizzle yet, so the upsert here does a manual
 * find-then-update fallback.
 */
@Injectable()
export class VariableAttributeRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsert(data: NewVariableAttribute): Promise<void> {
    const existing = await this.db
      .select({ id: variableAttributes.id })
      .from(variableAttributes)
      .where(
        and(
          eq(variableAttributes.tenantId, data.tenantId),
          eq(variableAttributes.stationId, data.stationId),
          data.componentId !== null && data.componentId !== undefined
            ? eq(variableAttributes.componentId, data.componentId)
            : eq(variableAttributes.componentId, 0),
          data.variableId !== null && data.variableId !== undefined
            ? eq(variableAttributes.variableId, data.variableId)
            : eq(variableAttributes.variableId, 0),
          eq(variableAttributes.type, data.type ?? 'Actual'),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await this.db
        .update(variableAttributes)
        .set({
          value: data.value ?? null,
          dataType: data.dataType ?? 'string',
          mutability: data.mutability ?? 'ReadWrite',
          persistent: data.persistent ?? false,
          constant: data.constant ?? false,
          generatedAt: data.generatedAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(variableAttributes.id, existing[0].id));
      return;
    }
    await this.db.insert(variableAttributes).values(data);
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(variableAttributes)
      .where(
        and(eq(variableAttributes.tenantId, tenantId), eq(variableAttributes.stationId, stationId)),
      );
  }

  /**
   * Locate the canonical `Actual` attribute row for a (station, component,
   * variable) tuple. Returns `null` when no row is present yet — caller
   * handles that (typically by inserting downstream rows with a null FK).
   */
  async findActualAttributeId(
    tenantId: number,
    stationId: string,
    componentId: number,
    variableId: number,
  ): Promise<number | null> {
    const rows = await this.db
      .select({ id: variableAttributes.id })
      .from(variableAttributes)
      .where(
        and(
          eq(variableAttributes.tenantId, tenantId),
          eq(variableAttributes.stationId, stationId),
          eq(variableAttributes.componentId, componentId),
          eq(variableAttributes.variableId, variableId),
          eq(variableAttributes.type, 'Actual'),
        ),
      )
      .limit(1);
    return rows[0]?.id ?? null;
  }
}

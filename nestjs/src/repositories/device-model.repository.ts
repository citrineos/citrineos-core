// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { components, NewComponent } from '@entities/component.entity';
import { evses } from '@entities/evse.entity';
import { variables, NewVariable } from '@entities/variable.entity';

/**
 * Read-side helpers for the device-model name → FK lookup the monitoring
 * module needs.
 *
 * The wire payload of `NotifyEvent` carries Component/Variable *names*; we
 * store EventData rows with FK references. This repo translates between
 * the two best-effort: returns `null` when no row matches, in which case
 * EventData is persisted with a null FK (matches legacy behavior — the
 * row is still useful even without a join target).
 *
 * `instance` is part of the natural key — `(name, instance)` uniquely
 * identifies a Component or Variable on a given tenant. SQL `IS NULL`
 * is used when `instance` is undefined since OCPP allows omitting it.
 */
@Injectable()
export class DeviceModelRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findComponentId(
    tenantId: number,
    name: string,
    instance?: string,
    evseDatabaseId?: number | null,
  ): Promise<number | null> {
    const condition = and(
      eq(components.tenantId, tenantId),
      eq(components.name, name),
      instance ? eq(components.instance, instance) : isNull(components.instance),
      evseDatabaseId === null || evseDatabaseId === undefined
        ? isNull(components.evseDatabaseId)
        : eq(components.evseDatabaseId, evseDatabaseId),
    );
    const rows = await this.db
      .select({ id: components.id })
      .from(components)
      .where(condition)
      .limit(1);
    return rows[0]?.id ?? null;
  }

  async findVariableId(tenantId: number, name: string, instance?: string): Promise<number | null> {
    const condition = and(
      eq(variables.tenantId, tenantId),
      eq(variables.name, name),
      instance ? eq(variables.instance, instance) : isNull(variables.instance),
    );
    const rows = await this.db
      .select({ id: variables.id })
      .from(variables)
      .where(condition)
      .limit(1);
    return rows[0]?.id ?? null;
  }

  /**
   * Find-or-insert a Component row keyed on
   * `(tenantId, name, instance, evseDatabaseId)`. The evse FK is part of
   * the natural key so two physically distinct components on different
   * EVSEs don't collapse into a single row — mirrors legacy
   * `findOrCreateEvseAndComponent` behavior.
   */
  async findOrCreateComponent(data: NewComponent): Promise<number> {
    const existing = await this.findComponentId(
      data.tenantId,
      data.name ?? '',
      data.instance ?? undefined,
      data.evseDatabaseId ?? null,
    );
    if (existing !== null) return existing;
    const [row] = await this.db.insert(components).values(data).returning({ id: components.id });
    return row.id;
  }

  /**
   * Find-or-insert the (Evse, Component) pair the charger refers to via
   * `ComponentType.evse`. Mirrors legacy
   * `_deviceModelRepository.findOrCreateEvseAndComponent`. Returns the
   * Component database id and the EVSE database id (when applicable) so
   * callers can wire FKs back to their own rows.
   */
  async findOrCreateEvseAndComponent(
    tenantId: number,
    stationId: string,
    component: { name?: string; instance?: string; evse?: { id: number } | null },
  ): Promise<{ componentId: number; evseDatabaseId: number | null }> {
    const evseDatabaseId = component.evse
      ? await this.findOrCreateEvse(tenantId, stationId, component.evse.id)
      : null;
    const componentId = await this.findOrCreateComponent({
      tenantId,
      name: component.name ?? null,
      instance: component.instance ?? null,
      evseDatabaseId,
    });
    return { componentId, evseDatabaseId };
  }

  /** Find-or-insert a Variable row keyed on `(tenantId, name, instance)`. */
  async findOrCreateVariable(data: NewVariable): Promise<number> {
    const existing = await this.findVariableId(
      data.tenantId,
      data.name ?? '',
      data.instance ?? undefined,
    );
    if (existing !== null) return existing;
    const [row] = await this.db.insert(variables).values(data).returning({ id: variables.id });
    return row.id;
  }

  /**
   * Find-or-insert an EVSE row keyed on `(tenantId, stationId, evseId)`.
   * The wire `EVSEType` carries `id` (== evseId) and `connectorId`; we
   * only persist the EVSE here — connectors live in their own table.
   * For the combined Evse+Component flow use
   * `findOrCreateEvseAndComponent`.
   */
  async findOrCreateEvse(tenantId: number, stationId: string, evseId: number): Promise<number> {
    // Legacy stores `evseId` as varchar(255); coerce the wire-level
    // integer at the boundary.
    const evseIdStr = String(evseId);
    const existing = await this.db.query.evses.findFirst({
      where: and(
        eq(evses.tenantId, tenantId),
        eq(evses.stationId, stationId),
        eq(evses.evseId, evseIdStr),
      ),
      columns: { id: true },
    });
    if (existing) return existing.id;
    const [row] = await this.db
      .insert(evses)
      .values({ tenantId, stationId, evseId: evseIdStr })
      .returning({ id: evses.id });
    return row.id;
  }
}

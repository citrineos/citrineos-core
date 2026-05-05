// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { ConnectorStatusEnumType } from '@enums/connector-status.enum';
import { ComponentType } from '@dto/shared/component.dto';
import { ReportDataType } from '@dto/shared/report-data.dto';
import { DeviceModelRepository } from '@repositories/device-model.repository';
import { VariableAttributeRepository } from '@repositories/variable-attribute.repository';
import { ConnectorRepository } from '@repositories/connector.repository';
import { NewConnector } from '@entities/connector.entity';

/**
 * Wire-shape of an entry in `reportData[i].variableAttribute[j]`. Mirrors
 * the OCPP 2.0.1 / 2.1 `VariableAttributeType`. We accept it as `unknown`
 * upstream (the wire DTO doesn't validate the shape) and narrow here.
 */
interface VariableAttributeWire {
  type?: 'Actual' | 'Target' | 'MinSet' | 'MaxSet' | string;
  value?: string;
  mutability?: 'ReadOnly' | 'WriteOnly' | 'ReadWrite' | string;
  persistent?: boolean;
  constant?: boolean;
}

/** Wire-shape of `reportData[i].variableCharacteristics`. */
interface VariableCharacteristicsWire {
  dataType?: string;
}

/**
 * Persists everything reported in a NotifyReport into the device-model
 * tables (Components, Variables, VariableAttributes) AND keeps the
 * `Connectors` row in sync when the report carries connector-typed
 * variables. Mirrors the `_handleNotifyReport` write block in
 * `core/src/modules/Reporting/src/module/module.ts`.
 *
 * Idempotent — repeated reports for the same component/variable simply
 * upsert. Subsequent NotifyEvent FK resolution then succeeds because the
 * Components / Variables rows are present.
 */
@Injectable()
export class NotifyReportService {
  private readonly logger = new Logger(NotifyReportService.name);

  constructor(
    private readonly deviceModel: DeviceModelRepository,
    private readonly variableAttributes: VariableAttributeRepository,
    private readonly connectors: ConnectorRepository,
  ) {}

  async ingest(
    tenantId: number,
    stationId: string,
    generatedAt: string,
    reportData: ReportDataType[],
  ): Promise<void> {
    const generated = new Date(generatedAt);
    for (const entry of reportData) {
      try {
        await this.ingestEntry(tenantId, stationId, generated, entry);
      } catch (err) {
        this.logger.warn(`NotifyReport entry skipped for ${stationId}: ${(err as Error).message}`);
      }
    }
  }

  private async ingestEntry(
    tenantId: number,
    stationId: string,
    generatedAt: Date,
    entry: ReportDataType,
  ): Promise<void> {
    if (!entry.component || !entry.variable) return;

    const { componentId } = await this.deviceModel.findOrCreateEvseAndComponent(
      tenantId,
      stationId,
      entry.component,
    );
    const variableId = await this.deviceModel.findOrCreateVariable({
      tenantId,
      name: entry.variable.name,
      instance: entry.variable.instance ?? null,
    });

    const characteristics = entry.variableCharacteristics as
      | VariableCharacteristicsWire
      | undefined;
    const dataType = characteristics?.dataType ?? 'string';

    const attrs = (entry.variableAttribute as VariableAttributeWire[] | undefined) ?? [];
    for (const attr of attrs) {
      await this.variableAttributes.upsert({
        tenantId,
        stationId,
        componentId,
        variableId,
        type: attr.type ?? 'Actual',
        dataType,
        value: attr.value ?? null,
        mutability: attr.mutability ?? 'ReadWrite',
        persistent: attr.persistent ?? false,
        constant: attr.constant ?? false,
        generatedAt,
      });
    }

    // Side-channel: when the entry describes a Connector-typed component
    // with a known variable, sync the value to the `Connectors` row so
    // REST consumers don't need to dig through VariableAttributes for
    // basic per-connector metadata. Mirrors the legacy
    // `_syncConnectorFromNotifyReport` block.
    const actualValue = attrs.find((a) => (a.type ?? 'Actual') === 'Actual')?.value;
    if (actualValue !== undefined && actualValue !== null) {
      await this.maybeSyncConnector(
        tenantId,
        stationId,
        entry.component,
        entry.variable.name,
        actualValue,
      );
    }
  }

  /**
   * If the component is a Connector with EVSE+connector ids, write the
   * relevant column on the matching `Connectors` row.
   */
  private async maybeSyncConnector(
    tenantId: number,
    stationId: string,
    component: ComponentType,
    variableName: string,
    value: string,
  ): Promise<void> {
    if (component.name !== 'Connector') return;
    const evseId = component.evse?.id;
    const connectorId = component.evse?.connectorId;
    if (evseId === undefined || connectorId === undefined) return;

    const update: NewConnector = {
      stationId,
      tenantId,
      evseId,
      connectorId,
    };
    let mutated = false;
    switch (variableName) {
      case 'Available': {
        update.status =
          value.toLowerCase() === 'true'
            ? ConnectorStatusEnumType.Available
            : ConnectorStatusEnumType.Unavailable;
        mutated = true;
        break;
      }
      case 'ConnectorType':
      case 'Type':
        update.type = value;
        mutated = true;
        break;
      case 'Format':
        update.format = value;
        mutated = true;
        break;
      case 'PowerType':
        update.powerType = value;
        mutated = true;
        break;
      case 'MaxAmperage': {
        const n = Number(value);
        if (Number.isFinite(n)) {
          update.maximumAmperage = Math.round(n);
          mutated = true;
        }
        break;
      }
      case 'MaxVoltage': {
        const n = Number(value);
        if (Number.isFinite(n)) {
          update.maximumVoltage = Math.round(n);
          mutated = true;
        }
        break;
      }
      case 'MaxPower':
      case 'MaxPowerWatts': {
        const n = Number(value);
        if (Number.isFinite(n)) {
          update.maximumPowerWatts = Math.round(n);
          mutated = true;
        }
        break;
      }
      default:
        return;
    }
    if (mutated) {
      await this.connectors.upsertMetadata(update);
    }
  }
}

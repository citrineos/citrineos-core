// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConnectorStatusEnumType } from '@enums/connector-status.enum';
import { StatusNotification16Request } from '@dto/transactions/status-notification-16.request';
import { StatusNotificationRequest } from '@dto/transactions/status-notification.request';
import { NewConnector } from '@entities/connector.entity';
import { NewLatestStatusNotification } from '@entities/latest-status-notification.entity';
import { NewStatusNotificationRow } from '@entities/status-notification.entity';

/**
 * OCPP 1.6 ChargePointStatus values that don't appear in 2.0.1.
 *
 * 1.6's nine-value enum is wider than 2.0.1's five-value `ConnectorStatusEnumType`.
 * Keep these as constants so the downgrade switch below is type-safe.
 */
const STATUS_16_PREPARING = 'Preparing';
const STATUS_16_CHARGING = 'Charging';
const STATUS_16_SUSPENDED_EVSE = 'SuspendedEVSE';
const STATUS_16_SUSPENDED_EV = 'SuspendedEV';
const STATUS_16_FINISHING = 'Finishing';

/**
 * Maps StatusNotification wire payloads (1.6 + 2.0.1) into rows for the
 * three internal tables: `StatusNotifications` (history), `Connectors`
 * (current state), and `LatestStatusNotifications` (one-shot lookup).
 *
 * Mirrors `core/src/dal/repository/Location/StatusNotification` access
 * patterns and the per-version branching that lived inside the legacy
 * Transactions module.
 */
export class StatusMapper {
  /**
   * Collapse the wider 1.6 ChargePointStatus enum to 2.0.1's
   * `ConnectorStatusEnumType`, so a single column can serve both versions.
   */
  static downgradeStatus16(status: string): ConnectorStatusEnumType {
    switch (status) {
      case ConnectorStatusEnumType.Available:
        return ConnectorStatusEnumType.Available;
      case STATUS_16_PREPARING:
      case STATUS_16_CHARGING:
      case STATUS_16_SUSPENDED_EVSE:
      case STATUS_16_SUSPENDED_EV:
      case STATUS_16_FINISHING:
      case ConnectorStatusEnumType.Occupied:
        return ConnectorStatusEnumType.Occupied;
      case ConnectorStatusEnumType.Reserved:
        return ConnectorStatusEnumType.Reserved;
      case ConnectorStatusEnumType.Unavailable:
        return ConnectorStatusEnumType.Unavailable;
      case ConnectorStatusEnumType.Faulted:
        return ConnectorStatusEnumType.Faulted;
      default:
        return ConnectorStatusEnumType.Unavailable;
    }
  }

  /** OCPP 2.0.1 / 2.1 → history row. */
  static historyRowFrom201(
    stationId: string,
    tenantId: number,
    payload: StatusNotificationRequest,
  ): NewStatusNotificationRow {
    return {
      stationId,
      tenantId,
      evseId: payload.evseId,
      connectorId: payload.connectorId,
      connectorStatus: payload.connectorStatus,
      timestamp: new Date(payload.timestamp),
    };
  }

  /** OCPP 1.6 → history row (evseId is always 0 since 1.6 has no EVSE concept). */
  static historyRowFrom16(
    stationId: string,
    tenantId: number,
    payload: StatusNotification16Request,
  ): NewStatusNotificationRow {
    const status = StatusMapper.downgradeStatus16(payload.status);
    return {
      stationId,
      tenantId,
      evseId: 0,
      connectorId: payload.connectorId,
      connectorStatus: status,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    };
  }

  /**
   * History row → current connector row.
   *
   * Optional `extras` carries the per-version metadata that 1.6 packs into
   * StatusNotification but 2.0.1 doesn't (`errorCode`, `info`, `vendorId`,
   * `vendorErrorCode`). Persisted on the row so REST consumers don't need
   * to join back to `StatusNotifications` for the full picture.
   */
  static connectorRowFrom(
    history: NewStatusNotificationRow,
    extras: {
      errorCode?: string;
      info?: string;
      vendorId?: string;
      vendorErrorCode?: string;
    } = {},
  ): NewConnector {
    return {
      stationId: history.stationId,
      tenantId: history.tenantId,
      // `Connectors.evseId` is a FK to `Evses.id` (integer surrogate),
      // NOT the wire-level OCPP evseId. Leave it null until the Evse row
      // is materialised; the wire value lives on `StatusNotifications`.
      evseId: null,
      connectorId: history.connectorId,
      status: history.connectorStatus,
      timestamp: history.timestamp,
      errorCode: extras.errorCode ?? null,
      info: extras.info ?? null,
      vendorId: extras.vendorId ?? null,
      vendorErrorCode: extras.vendorErrorCode ?? null,
      updatedAt: new Date(),
    };
  }

  /** Extract the 1.6-specific extras a StatusNotification carries. */
  static extras16(payload: StatusNotification16Request): {
    errorCode?: string;
    info?: string;
    vendorId?: string;
    vendorErrorCode?: string;
  } {
    return {
      errorCode: payload.errorCode,
      info: payload.info,
      vendorId: payload.vendorId,
      vendorErrorCode: payload.vendorErrorCode,
    };
  }

  /**
   * Latest-row payload — legacy stores just the FK to the StatusNotifications
   * row, not a flat copy of the columns.
   */
  static latestRowFrom(
    history: NewStatusNotificationRow,
    statusNotificationId: number,
  ): NewLatestStatusNotification {
    return {
      stationId: history.stationId,
      tenantId: history.tenantId,
      statusNotificationId,
      updatedAt: new Date(),
    };
  }
}

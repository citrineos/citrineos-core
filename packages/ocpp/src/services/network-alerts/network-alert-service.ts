// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  INetworkAlertRepository,
  INetworkAlertSession,
  NetworkAlertSubject,
} from '@citrineos/dal';
import type {
  ConnectorErrorCodeEnumType,
  ConnectorStatusEnumType,
  MessageOrigin,
  NetworkAlertCreate,
  NetworkAlertDto,
  NetworkAlertOccurrenceCreate,
  NetworkAlertResolvedBy,
  NetworkAlertSeverity,
  NetworkAlertType,
  OcppCallFailureReason,
} from '@citrineos/types';
import type { NetworkAlertConfigResolver } from './network-alert-config-resolver.js';
import { isMoreSevere, maxSeverity } from './severity.js';

export interface DisconnectInput {
  tenantId: number;
  stationId: number;
  occurredAt: string;
  websocketEventId?: number;
}

export interface ReconnectInput {
  tenantId: number;
  stationId: number;
  occurredAt: string;
}

export interface SilentStationInput {
  tenantId: number;
  stationId: number;
  /** The station's latest OCPP message: the last moment it is known to have been reachable. */
  lastHeardAt: string;
  severity: NetworkAlertSeverity;
}

export interface ConnectorStatusInput {
  tenantId: number;
  stationId: number;
  evseId?: number | null;
  connectorId: number;
  status: ConnectorStatusEnumType;
  errorCode?: ConnectorErrorCodeEnumType | null;
  vendorErrorCode?: string | null;
  occurredAt: string;
  statusNotificationId?: number;
}

export interface CallFailureInput {
  tenantId: number;
  stationId: number;
  reason: Exclude<OcppCallFailureReason, 'Slow'>;
  origin: MessageOrigin;
  action: string;
  correlationId: string;
  errorCode?: string | null;
  occurredAt: string;
  ocppMessageId?: number;
}

/** A station's latest responses from one side, averaged; recorded against the newest of them. */
export interface SlowResponsesInput {
  tenantId: number;
  stationId: number;
  /** Sender of the responses: the side that was slow. */
  origin: MessageOrigin;
  averageMs: number;
  sampleSize: number;
  earliestAt: string;
  latestAt: string;
  action: string;
  correlationId: string;
  ocppMessageId: number;
}

export function isAlertOfType<T extends NetworkAlertType>(
  alert: NetworkAlertDto,
  type: T,
): alert is Extract<NetworkAlertDto, { type: T }> {
  return alert.type === type;
}

async function findOpenOfType<T extends NetworkAlertType>(
  session: INetworkAlertSession,
  type: T,
): Promise<Extract<NetworkAlertDto, { type: T }> | undefined> {
  const open = await session.findOpen();
  return open && isAlertOfType(open, type) ? open : undefined;
}

function earlier(a: string, b: string): string {
  return Date.parse(b) < Date.parse(a) ? b : a;
}

function later(a: string, b: string): string {
  return Date.parse(b) > Date.parse(a) ? b : a;
}

function union<T extends string>(values: T[] | undefined, value: T): T[] {
  return values?.includes(value) ? values : [...(values ?? []), value];
}

/**
 * Records occurrences of network alerts and maintains their episodes.
 *
 * An alert is an episode: one unresolved row per station (or per connector, for connector status)
 * and type, which each occurrence extends. Every change to a subject's alerts happens under that
 * subject's lock, because events for one station arrive concurrently and out of order, from any
 * instance.
 */
export class NetworkAlertService {
  private readonly _repository: INetworkAlertRepository;
  private readonly _configResolver: NetworkAlertConfigResolver;

  constructor({
    networkAlertRepository,
    networkAlertConfigResolver,
  }: {
    networkAlertRepository: INetworkAlertRepository;
    networkAlertConfigResolver: NetworkAlertConfigResolver;
  }) {
    this._repository = networkAlertRepository;
    this._configResolver = networkAlertConfigResolver;
  }

  async recordDisconnect(input: DisconnectInput): Promise<void> {
    const { StationConnectivity: config } = await this._configResolver.resolve(input.tenantId);
    if (!config.enabled) {
      return;
    }
    const { disconnectSeverity, frequentDisconnects } = config.rules;
    const subject = this._stationSubject(input, 'StationConnectivity');

    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await findOpenOfType(session, 'StationConnectivity');
      const windowStart = new Date(
        Date.parse(input.occurredAt) - frequentDisconnects.windowSeconds * 1000,
      ).toISOString();
      const earlierInWindow = open ? await session.countOccurrencesSince(open.id!, windowStart) : 0;
      const severity =
        earlierInWindow + 1 >= frequentDisconnects.count
          ? maxSeverity(disconnectSeverity, frequentDisconnects.severity)
          : disconnectSeverity;
      const offlineSince = open?.details.offlineSince
        ? earlier(open.details.offlineSince, input.occurredAt)
        : input.occurredAt;

      const alertId = await this._openOrExtend(
        session,
        open,
        {
          type: 'StationConnectivity',
          severity,
          status: 'Active',
          stationId: input.stationId,
          firstSeenAt: input.occurredAt,
          lastSeenAt: input.occurredAt,
          occurrenceCount: 1,
          details: { offlineSince },
        },
        { severity, occurredAt: input.occurredAt, details: { offlineSince } },
      );
      await session.addOccurrence({
        type: 'StationConnectivity',
        alertId,
        occurredAt: input.occurredAt,
        severity,
        websocketEventId: input.websocketEventId ?? null,
        details: { durationSeconds: null },
      });
    });
  }

  /** Marks the station back online and records how long its latest disconnect lasted. */
  async recordReconnect(input: ReconnectInput): Promise<void> {
    const subject = this._stationSubject(input, 'StationConnectivity');

    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await findOpenOfType(session, 'StationConnectivity');
      const offlineSince = open?.details.offlineSince;
      if (!open || !offlineSince || Date.parse(input.occurredAt) < Date.parse(offlineSince)) {
        return;
      }
      await session.updateAlert(open.id!, { details: { offlineSince: null } });

      const latest = await session.findLatestOccurrence(open.id!);
      if (
        latest?.type === 'StationConnectivity' &&
        latest.details.durationSeconds == null &&
        Date.parse(input.occurredAt) >= Date.parse(latest.occurredAt)
      ) {
        await session.updateOccurrenceDetails(latest.id!, {
          durationSeconds: Math.round(
            (Date.parse(input.occurredAt) - Date.parse(latest.occurredAt)) / 1000,
          ),
        });
      }
    });
  }

  /**
   * A station still marked online that has gone silent: its socket died without a close the
   * transport could see, e.g. when the instance holding it crashed.
   */
  async recordSilentStation(input: SilentStationInput): Promise<void> {
    const subject = this._stationSubject(input, 'StationConnectivity');

    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await findOpenOfType(session, 'StationConnectivity');
      if (open?.details.offlineSince) {
        return;
      }
      const now = new Date().toISOString();
      const offlineSince = input.lastHeardAt;
      const alertId = await this._openOrExtend(
        session,
        open,
        {
          type: 'StationConnectivity',
          severity: input.severity,
          status: 'Active',
          stationId: input.stationId,
          firstSeenAt: now,
          lastSeenAt: now,
          occurrenceCount: 1,
          details: { offlineSince },
        },
        { severity: input.severity, occurredAt: now, details: { offlineSince } },
      );
      await session.addOccurrence({
        type: 'StationConnectivity',
        alertId,
        occurredAt: now,
        severity: input.severity,
        websocketEventId: null,
        details: { durationSeconds: null },
      });
    });
  }

  async recordConnectorStatus(input: ConnectorStatusInput): Promise<void> {
    const { ConnectorStatus: config } = await this._configResolver.resolve(input.tenantId);
    const subject: NetworkAlertSubject = {
      tenantId: input.tenantId,
      type: 'ConnectorStatus',
      stationId: input.stationId,
      connectorId: input.connectorId,
    };
    const severity = config.rules.severityByStatus[input.status];
    if (!severity) {
      await this.resolve(subject, 'Automatic', input.occurredAt);
      return;
    }
    if (!config.enabled) {
      return;
    }

    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await findOpenOfType(session, 'ConnectorStatus');
      const reported = { status: input.status, errorCode: input.errorCode ?? null };
      const details =
        open && Date.parse(input.occurredAt) < Date.parse(open.lastSeenAt)
          ? open.details
          : reported;

      const alertId = await this._openOrExtend(
        session,
        open,
        {
          type: 'ConnectorStatus',
          severity,
          status: 'Active',
          stationId: input.stationId,
          evseId: input.evseId ?? null,
          connectorId: input.connectorId,
          firstSeenAt: input.occurredAt,
          lastSeenAt: input.occurredAt,
          occurrenceCount: 1,
          details: reported,
        },
        { severity, occurredAt: input.occurredAt, details },
      );
      await session.addOccurrence({
        type: 'ConnectorStatus',
        alertId,
        occurredAt: input.occurredAt,
        severity,
        statusNotificationId: input.statusNotificationId ?? null,
        details: { ...reported, vendorErrorCode: input.vendorErrorCode ?? null },
      });
    });
  }

  async recordCallFailure(input: CallFailureInput): Promise<void> {
    const { OcppCallFailures: config } = await this._configResolver.resolve(input.tenantId);
    if (!config.enabled) {
      return;
    }
    const { severityByReason, criticalActions } = config.rules;
    const severity = criticalActions.includes(input.action)
      ? 'Critical'
      : severityByReason[input.reason];

    await this._repository.withSubjectLock(
      this._stationSubject(input, 'OcppCallFailures'),
      async (session) => {
        const open = await findOpenOfType(session, 'OcppCallFailures');
        await this._addCallFailure(session, open, input.stationId, {
          type: 'OcppCallFailures',
          occurredAt: input.occurredAt,
          severity,
          ocppMessageId: input.ocppMessageId ?? null,
          details: {
            reason: input.reason,
            origin: input.origin,
            action: input.action,
            correlationId: input.correlationId,
            errorCode: input.errorCode ?? null,
          },
        });
      },
    );
  }

  /**
   * Records a sample of slow responses. Samples are taken from each station's latest responses on
   * every sweep, so one overlapping the last recorded sample is skipped: a station that stays slow
   * adds one occurrence per sample's worth of new responses, not one per response.
   */
  async recordSlowResponses(input: SlowResponsesInput): Promise<void> {
    const { OcppCallFailures: config } = await this._configResolver.resolve(input.tenantId);
    if (!config.enabled || input.averageMs <= config.rules.slowThresholdMs) {
      return;
    }
    // Slow is degraded, not failed: criticalActions do not apply.
    const severity = config.rules.severityByReason.Slow;

    await this._repository.withSubjectLock(
      this._stationSubject(input, 'OcppCallFailures'),
      async (session) => {
        const open = await findOpenOfType(session, 'OcppCallFailures');
        const previous = open
          ? await session.findLatestCallFailure(open.id!, 'Slow', input.origin)
          : undefined;
        if (previous && Date.parse(input.earliestAt) <= Date.parse(previous.occurredAt)) {
          return;
        }
        await this._addCallFailure(session, open, input.stationId, {
          type: 'OcppCallFailures',
          occurredAt: input.latestAt,
          severity,
          ocppMessageId: input.ocppMessageId,
          details: {
            reason: 'Slow',
            origin: input.origin,
            action: input.action,
            correlationId: input.correlationId,
            durationMs: input.averageMs,
            sampleSize: input.sampleSize,
          },
        });
      },
    );
  }

  /** Raises the subject's open alert to `severity`, if that is more severe than it already is. */
  async escalate(subject: NetworkAlertSubject, severity: NetworkAlertSeverity): Promise<void> {
    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await session.findOpen();
      if (open && isMoreSevere(severity, open.severity)) {
        await session.updateAlert(open.id!, { severity, status: 'Active' });
      }
    });
  }

  /** Resolves the subject's open alert, unless something happened to it after `at`. */
  async resolve(
    subject: NetworkAlertSubject,
    resolvedBy: NetworkAlertResolvedBy,
    at: string,
  ): Promise<void> {
    await this._repository.withSubjectLock(subject, async (session) => {
      const open = await session.findOpen();
      if (open && Date.parse(at) >= Date.parse(open.lastSeenAt)) {
        await session.updateAlert(open.id!, { status: 'Resolved', resolvedAt: at, resolvedBy });
      }
    });
  }

  /** Opens or extends the station's OcppCallFailures episode with `occurrence`. */
  private async _addCallFailure(
    session: INetworkAlertSession,
    open: Extract<NetworkAlertDto, { type: 'OcppCallFailures' }> | undefined,
    stationId: number,
    occurrence: Omit<
      Extract<NetworkAlertOccurrenceCreate, { type: 'OcppCallFailures' }>,
      'alertId'
    >,
  ): Promise<void> {
    const { reason, action } = occurrence.details;
    const details = {
      reasons: union(open?.details.reasons, reason),
      actions: union(open?.details.actions, action),
    };
    const alertId = await this._openOrExtend(
      session,
      open,
      {
        type: 'OcppCallFailures',
        severity: occurrence.severity,
        status: 'Active',
        stationId,
        firstSeenAt: occurrence.occurredAt,
        lastSeenAt: occurrence.occurredAt,
        occurrenceCount: 1,
        details,
      },
      { severity: occurrence.severity, occurredAt: occurrence.occurredAt, details },
    );
    await session.addOccurrence({ ...occurrence, alertId });
  }

  /**
   * Creates the subject's alert, or extends the open one. An acknowledged alert goes back to
   * active only when the occurrence makes it more severe: acknowledging is how an operator
   * silences repeats of what they have already seen.
   */
  private async _openOrExtend(
    session: INetworkAlertSession,
    open: NetworkAlertDto | undefined,
    create: NetworkAlertCreate,
    extend: {
      severity: NetworkAlertSeverity;
      occurredAt: string;
      details: NetworkAlertDto['details'];
    },
  ): Promise<number> {
    if (!open) {
      const created = await session.createAlert(create);
      return created.id!;
    }
    const severity = maxSeverity(open.severity, extend.severity);
    await session.updateAlert(open.id!, {
      severity,
      status: isMoreSevere(severity, open.severity) ? 'Active' : open.status,
      firstSeenAt: earlier(open.firstSeenAt, extend.occurredAt),
      lastSeenAt: later(open.lastSeenAt, extend.occurredAt),
      occurrenceCount: open.occurrenceCount + 1,
      details: extend.details,
    });
    return open.id!;
  }

  private _stationSubject(
    input: { tenantId: number; stationId: number },
    type: NetworkAlertType,
  ): NetworkAlertSubject {
    return { tenantId: input.tenantId, type, stationId: input.stationId };
  }
}

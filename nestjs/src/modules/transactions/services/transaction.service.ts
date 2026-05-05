import { Injectable, Logger } from '@nestjs/common';
import { TransactionRepository } from '@repositories/transaction.repository';
import { MeterValueRepository } from '@repositories/meter-value.repository';
import { Ocpp16HistoryRepository } from '@repositories/ocpp16-history.repository';
import {
  TransactionMapper,
  mintOcpp16TransactionId,
  ocpp16TransactionUuid,
} from '@mappers/transactions/transaction.mapper';
import { MeterValueMapper } from '@mappers/transactions/meter-value.mapper';
import { computeTotalKwh } from '@mappers/transactions/total-kwh';
import { CostService } from '@modules/transactions/services/cost.service';
import { SignedMeterValueValidator } from '@modules/transactions/services/signed-meter-value-validator.service';
import {
  AuthorizationService,
  IdTagInfo16,
} from '@modules/evdriver/services/authorization.service';
import { ReservationRepository } from '@repositories/reservation.repository';
import { IdTokenType } from '@dto/shared/id-token.dto';
import { MeterValueType } from '@dto/shared/meter-value.dto';
import { MeterValue16Type } from '@dto/shared/meter-value-16.dto';
import { TransactionEventRequest } from '@dto/transactions/transaction-event.request';
import { IdTagInfoStatusEnum16 } from '@enums/id-tag-status-16.enum';
import { TransactionEventEnumType } from '@enums/transaction-event.enum';
import { IdTokenInfoDto } from '@mappers/evdriver/authorization.mapper';

export type IdTokenInfo = IdTokenInfoDto;

/**
 * Owns the OCPP 1.6 / 2.0.1 transaction lifecycle: creating the
 * `Transactions` row on Started, recording each TransactionEvent +
 * MeterValue sample, recomputing `totalKwh` / `totalCost` after
 * persistence, scheduling `CostUpdated` notifications, and arming the
 * idle-watchdog. The Authorize round-trip used for 1.6
 * `StartTransaction` / `StopTransaction` also runs here so the
 * 1.6 handler stays a thin protocol shim.
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly txRepo: TransactionRepository,
    private readonly meterValueRepo: MeterValueRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly costService: CostService,
    private readonly signedMeterValueValidator: SignedMeterValueValidator,
    private readonly ocpp16History: Ocpp16HistoryRepository,
    private readonly reservationRepo: ReservationRepository,
  ) {}

  /**
   * OCPP 1.6 StartTransaction: authorize the idTag, mint a transactionId,
   * and persist the Transaction row in the background. Returns the
   * idTagInfo that the handler should send back to the charger.
   */
  async startTransaction16(
    tenantId: number,
    stationId: string,
    idTag: string,
    timestamp: string,
    meterStart?: number,
    reservationId?: number | null,
    connectorId?: number,
  ): Promise<{ transactionId: number; idTagInfo: IdTagInfo16; transactionUuid: string }> {
    const idTagInfo = await this.authorizationService.authorize16(tenantId, idTag, {
      stationId,
      ...(connectorId !== undefined ? { connectorId } : {}),
    });

    const transactionId = mintOcpp16TransactionId();
    const transactionUuid = ocpp16TransactionUuid(stationId, transactionId);

    if (idTagInfo.status === IdTagInfoStatusEnum16.Accepted) {
      // Persistence + stale-deactivation run in the background — handler
      // already has its response. 1.6 has no EVSE concept; pass `null` so
      // the deactivation step matches existing rows that also have null.
      void Promise.resolve()
        .then(async () => {
          const tx = await this.txRepo.upsert(
            TransactionMapper.fromStartTransaction16(stationId, tenantId, transactionId, timestamp),
          );
          await this.txRepo.deactivateStaleOnEvse(
            tenantId,
            stationId,
            null,
            transactionUuid,
            'MasterPass',
          );
          if (typeof meterStart === 'number') {
            await this.ocpp16History.insertStart({
              tenantId,
              stationId,
              meterStart,
              timestamp: new Date(timestamp),
              reservationId: reservationId ?? null,
              transactionDatabaseId: tx?.id ?? null,
            });
          }
          if (reservationId) {
            await this.reservationRepo.deactivateById(
              tenantId,
              stationId,
              reservationId,
              String(transactionId),
            );
          }
        })
        .catch((err) =>
          this.logger.error(
            `Failed to persist StartTransaction for ${stationId}: ${(err as Error).message}`,
          ),
        );
    }

    return { transactionId, idTagInfo, transactionUuid };
  }

  /** OCPP 1.6 StopTransaction: end the transaction by composite uuid. */
  async stopTransaction16(
    tenantId: number,
    stationId: string,
    transactionId: number,
    reason: string | null,
  ): Promise<void> {
    const transactionUuid = ocpp16TransactionUuid(stationId, transactionId);
    await this.txRepo.end(tenantId, stationId, transactionUuid, reason ?? 'Local');
  }

  /**
   * Apply totalKwh + totalCost to a 1.6 transaction by direct
   * meterStop−meterStart math (the single-data-point case where no
   * `transactionData` was sent). Mirrors legacy
   * `transaction.totalKwh = (meterStop - startTransaction.meterStart) / 1000`.
   */
  async applyStopTransactionTotals16(
    tenantId: number,
    stationId: string,
    transactionId: number,
    meterStop: number,
    meterStart: number,
  ): Promise<void> {
    const wh = meterStop - meterStart;
    if (!Number.isFinite(wh) || wh <= 0) return;
    const transactionUuid = ocpp16TransactionUuid(stationId, transactionId);
    const totalKwh = (wh / 1000).toString();
    await this.txRepo.setTotalKwh(tenantId, stationId, transactionUuid, totalKwh);
    const cost = this.costService.computeFromKwh(totalKwh);
    if (cost) {
      await this.txRepo.setTotalCost(tenantId, stationId, transactionUuid, cost.totalCost);
    }
  }

  async findActiveTransaction16(tenantId: number, stationId: string, transactionId: number) {
    const transactionUuid = ocpp16TransactionUuid(stationId, transactionId);
    return this.txRepo.findActive(tenantId, stationId, transactionUuid);
  }

  /**
   * Route through `AuthorizationService.authorize` so the authorizer
   * chain (Database → EvseRestriction → RealTime) runs. Kept here as a
   * pass-through for call sites that historically went through
   * TransactionService.
   */
  async authorizeIdToken(
    tenantId: number,
    idToken: IdTokenType,
    location?: { stationId?: string; evseId?: number; connectorId?: number },
  ): Promise<IdTokenInfo> {
    return this.authorizationService.authorize(tenantId, idToken, location);
  }

  /**
   * Persist a Started transaction and deactivate any stale active rows
   * on the same `(stationId, evseId)` — matches the legacy invariant
   * "one active transaction per EVSE". Stale rows are stamped with
   * `stoppedReason = 'MasterPass'` per legacy convention (a CSMS-side
   * forced stop, distinct from the charger reporting a real stop reason).
   */
  async startTransaction(
    tenantId: number,
    stationId: string,
    transactionId: string,
    timestamp: string,
    evseId?: number | null,
  ) {
    const row = await this.txRepo.upsert(
      TransactionMapper.fromTransactionStarted(
        stationId,
        tenantId,
        transactionId,
        timestamp,
        evseId,
      ),
    );
    await this.txRepo.deactivateStaleOnEvse(
      tenantId,
      stationId,
      evseId ?? null,
      transactionId,
      'MasterPass',
    );
    return row;
  }

  async endTransaction(
    tenantId: number,
    stationId: string,
    transactionId: string,
    stoppedReason: string,
  ) {
    return this.txRepo.end(tenantId, stationId, transactionId, stoppedReason);
  }

  async addEvent(
    tenantId: number,
    stationId: string,
    transactionId: string,
    eventType: TransactionEventEnumType,
    seqNo: number,
    timestamp: string,
    payload: TransactionEventRequest,
  ) {
    // Legacy joins TransactionEvents → Transactions via FK; resolve
    // the database id at the boundary so the persisted row matches.
    const tx = await this.txRepo.findActive(tenantId, stationId, transactionId);
    return this.txRepo.addEvent(
      TransactionMapper.toTransactionEventRow(
        stationId,
        tenantId,
        tx?.id ?? null,
        eventType,
        seqNo,
        timestamp,
        payload,
      ),
    );
  }

  /**
   * Persist a TransactionEvent's `meterValue[]` payload and recompute
   * `Transactions.totalKwh` from the cumulative
   * `Energy.Active.Import.Register` samples (max − min, normalized to kWh).
   *
   * Mirrors the per-event `_calculateTotalKwh` write in legacy
   * `core/src/modules/Transactions/src/module/module.ts`.
   */
  async recordMeterValues(
    tenantId: number,
    stationId: string,
    transactionId: string,
    meterValues: MeterValueType[],
  ): Promise<void> {
    if (meterValues.length === 0) return;

    // Signed meter value gate. When `signedMeterValuesConfiguration` is
    // unset, this is a no-op pass. When set, an invalid envelope logs and
    // skips persistence — matching the legacy "reject signed meter values
    // that fail config-driven validation" semantics. We do not throw; the
    // charger has already received its early `{}` ack and the legacy
    // server logs/skips rather than escalating.
    const validation = await this.signedMeterValueValidator.validate(meterValues, {
      tenantId,
      stationId,
    });
    if (!validation.valid) {
      this.logger.warn(
        `Skipping meter values for ${stationId}/${transactionId}: ${validation.reason}`,
      );
      return;
    }

    const rows = MeterValueMapper.fromMeterValuesRequest(
      stationId,
      tenantId,
      transactionId,
      meterValues,
    );
    await Promise.all(rows.map((row) => this.meterValueRepo.insert(row)));

    const stored = await this.meterValueRepo.findByTransaction(tenantId, transactionId);
    const totalKwh = computeTotalKwh(stored);
    if (totalKwh === null) return;
    await this.txRepo.setTotalKwh(tenantId, stationId, transactionId, totalKwh);

    const cost = this.costService.computeFromKwh(totalKwh);
    if (cost) {
      await this.txRepo.setTotalCost(tenantId, stationId, transactionId, cost.totalCost);
    }
  }

  /**
   * OCPP 1.6 variant of `recordMeterValues`. The wire shape carries
   * `value` as a string and `transactionId` as a number; we normalize
   * both via `MeterValueMapper.fromMeterValues16Request` and the
   * shared `ocpp16TransactionUuid` helper, then re-use the same
   * persistence + totalKwh recompute path as 2.0.1. Skips the signed
   * meter value gate — 1.6 does not carry signed envelopes.
   */
  async recordMeterValues16(
    tenantId: number,
    stationId: string,
    transactionId: number | null,
    meterValues: MeterValue16Type[],
  ): Promise<void> {
    if (meterValues.length === 0) return;

    const txUuid = transactionId !== null ? ocpp16TransactionUuid(stationId, transactionId) : null;

    const rows = MeterValueMapper.fromMeterValues16Request(
      stationId,
      tenantId,
      txUuid,
      meterValues,
    );
    await Promise.all(rows.map((row) => this.meterValueRepo.insert(row)));

    if (txUuid === null) return;

    const stored = await this.meterValueRepo.findByTransaction(tenantId, txUuid);
    const totalKwh = computeTotalKwh(stored);
    if (totalKwh === null) return;
    await this.txRepo.setTotalKwh(tenantId, stationId, txUuid, totalKwh);

    const cost = this.costService.computeFromKwh(totalKwh);
    if (cost) {
      await this.txRepo.setTotalCost(tenantId, stationId, txUuid, cost.totalCost);
    }
  }
}

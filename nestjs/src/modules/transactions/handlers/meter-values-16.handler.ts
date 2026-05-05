// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { MeterValues16Request } from '@dto/transactions/meter-values-16.request';
import { TransactionService } from '@modules/transactions/services/transaction.service';

/**
 * OCPP 1.6 MeterValues handler. Different wire shape than 2.0.1
 * (`connectorId`/`transactionId` top-level + string-valued samples), so
 * it lives in its own handler. Routes to `TransactionService.recordMeterValues16`
 * which normalizes the shape and re-uses the shared persistence path.
 *
 * Mirrors legacy `_handleOcpp16MeterValues`: only persists when all three
 * `(connectorId !== 0, transactionId, meterValue.length > 0)` hold and at
 * least one `sampledValue` is present. Station-wide / non-transactional
 * meter values are dropped — legacy never writes a row for those.
 */
@OcppHandler(OCPP_CallAction.MeterValues, [OCPPVersion.OCPP1_6], MeterValues16Request)
export class MeterValues16Handler extends OcppRequestHandler<MeterValues16Request> {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async handle(msg: OcppMessage<MeterValues16Request>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { connectorId, transactionId, meterValue } = msg.payload;

    this.logger.debug(
      `MeterValues (1.6) from ${stationId}: connector=${connectorId}, transactionId=${transactionId ?? 'none'}, ${meterValue.length} readings`,
    );

    if (connectorId === 0 || !transactionId || meterValue.length === 0) {
      return {};
    }

    const samples = meterValue.filter((mv) => mv.sampledValue && mv.sampledValue.length > 0);
    if (samples.length === 0) return {};

    void this.transactionService
      .recordMeterValues16(tenantId, stationId, transactionId, samples)
      .catch((err) =>
        this.logger.error(
          `Failed to record 1.6 MeterValues for ${stationId}: ${(err as Error).message}`,
        ),
      );

    return {};
  }
}

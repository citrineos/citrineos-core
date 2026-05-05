// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { NotifyCustomerInformationRequest } from '@dto/reporting/notify-customer-information.request';
import { CustomerInformationService } from '@modules/reporting/services/customer-information.service';

/**
 * NotifyCustomerInformation (OCPP 2.0.1 / 2.1).
 *
 * Charger streams a customer-information report split across N messages
 * (one per `seqNo`, `tbc=false` on the last). The handler appends each
 * chunk to a per-(station, requestId) accumulator and, on completion,
 * fires a `customer-information.completed` semantic webhook with the
 * stitched report.
 */
@OcppHandler(
  OCPP_CallAction.NotifyCustomerInformation,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyCustomerInformationRequest,
)
export class NotifyCustomerInformationHandler extends OcppRequestHandler<NotifyCustomerInformationRequest> {
  constructor(private readonly customerInfo: CustomerInformationService) {
    super();
  }

  async handle(
    msg: OcppMessage<NotifyCustomerInformationRequest>,
  ): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { seqNo, tbc, data, generatedAt, requestId } = msg.payload;

    this.logger.debug(
      `NotifyCustomerInformation from ${stationId}: seqNo=${seqNo}, tbc=${tbc}, len=${data.length}`,
    );

    this.customerInfo.appendChunk({
      stationId,
      tenantId,
      requestId,
      seqNo,
      tbc,
      data,
      generatedAt,
    });

    return {};
  }
}

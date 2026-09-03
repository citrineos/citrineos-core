// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  type ChargingRateUnitEnumType,
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  OCPP2_common_types,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@citrineos/dal';
import type { CompositeScheduleInput } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetCompositeSchedule)
export class GetCompositeScheduleResponseOcpp16Handler extends AbstractHandler {
  protected _chargingProfileRepository: IChargingProfileRepository;

  constructor({
    logger,
    chargingProfileRepository,
  }: AbstractHandlerDependencies & { chargingProfileRepository: IChargingProfileRepository }) {
    super(logger);
    this._chargingProfileRepository = chargingProfileRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('GetCompositeScheduleResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;
    const response = message.payload;
    if (
      response.status === OCPP1_6.GetCompositeScheduleResponseStatus.Accepted &&
      response.chargingSchedule
    ) {
      const compositeSchedule = {
        evseId: response.connectorId ?? 0,
        duration: response.chargingSchedule.duration ?? 0,
        scheduleStart:
          response.scheduleStart ??
          response.chargingSchedule.startSchedule ??
          new Date().toISOString(),
        chargingRateUnit: response.chargingSchedule
          .chargingRateUnit as unknown as ChargingRateUnitEnumType,
        chargingSchedulePeriod: response.chargingSchedule.chargingSchedulePeriod.map((p) => ({
          startPeriod: p.startPeriod,
          limit: p.limit,
          numberPhases: p.numberPhases ?? undefined,
        })) as [
          OCPP2_common_types.ChargingSchedulePeriodType,
          ...OCPP2_common_types.ChargingSchedulePeriodType[],
        ],
      } as OCPP2_common_types.CompositeScheduleType;
      const saved = await this._chargingProfileRepository.createCompositeSchedule(
        tenantId,
        compositeSchedule as CompositeScheduleInput,
        ocppConnectionName,
      );
      this._logger.info(`OCPP 1.6 Composite schedule created: ${JSON.stringify(saved)}`);
    } else {
      this._logger.error(`OCPP 1.6 GetCompositeSchedule failed: ${JSON.stringify(response)}`);
    }
  }
}

// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  type MeterValueDto,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';
import type { ITransactionEventRepository } from '@/dal/index.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.MeterValues)
export class MeterValuesRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _transactionEventRepository: ITransactionEventRepository;

  constructor({
    logger,
    ocppSender,
    transactionEventRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    transactionEventRepository: ITransactionEventRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`MeterValuesRequest ${message.protocol}`),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const connectorId = message.payload.connectorId;
    const transactionId = message.payload.transactionId;
    const meterValues = message.payload.meterValue;

    if (connectorId !== 0 && transactionId && meterValues.length > 0) {
      try {
        const meterValueEntities: MeterValueDto[] = [];
        for (const meterValue of meterValues) {
          if (meterValue.sampledValue && meterValue.sampledValue.length > 0) {
            const meterValueEntity = OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(meterValue);
            meterValueEntity.tenantId = tenantId;
            meterValueEntity.connectorId = connectorId;
            meterValueEntities.push(meterValueEntity);
          }
        }
        if (meterValueEntities.length > 0) {
          await this._transactionEventRepository.updateTransactionByMeterValues(
            tenantId,
            meterValueEntities,
            ocppConnectionName,
            transactionId,
          );
        }
      } catch (e) {
        this._logger.error(`Failed to process MeterValues.`, e);
      }
    }

    await this._ocppSender.sendCallResultWithMessage(message, {} as OCPP1_6.MeterValuesResponse);
  }
}

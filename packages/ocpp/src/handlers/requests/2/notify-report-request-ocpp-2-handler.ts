// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type ICache,
  type IMessage,
  type IOcppSender,
  createIdentifier,
  OcppError,
} from '@citrineos/base';
import {
  ErrorCode,
  type HandlerProperties,
  MutabilityEnum,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetVariableStatusEnum,
  type SystemConfig,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import { Component, type IDeviceModelRepository, Variable } from '@citrineos/dal';
import { isForeignKeyConstraintError } from '@util/errors.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyReport)
export class NotifyReportRequestOcpp2Handler extends AbstractHandler {
  static readonly GET_BASE_REPORT_ONGOING_CACHE_VALUE = 'ongoing';
  static readonly GET_BASE_REPORT_COMPLETE_CACHE_VALUE = 'complete';

  protected _ocppSender: IOcppSender;
  protected _cache: ICache;
  protected _config: SystemConfig;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor({
    logger,
    ocppSender,
    cache,
    config,
    deviceModelRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    cache: ICache;
    config: SystemConfig;
    deviceModelRepository: IDeviceModelRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._cache = cache;
    this._config = config;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(this.createHandlerReceivedMessageLog('NotifyReportRequest'), message, props);
    const timestamp = message.payload.generatedAt;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    try {
      for (const reportDataType of message.payload.reportData ? message.payload.reportData : []) {
        // To keep consistency with VariableAttributeType defined in OCPP 2.0.1:
        // mutability: Default is ReadWrite when omitted.
        // if it is not present, we set it to ReadWrite
        for (let variableAttr of reportDataType.variableAttribute) {
          if (!variableAttr.mutability) {
            variableAttr = {
              ...variableAttr,
              mutability: MutabilityEnum.ReadWrite,
            } as OCPP2_common_types.VariableAttributeType;
          }
        }
        const variableAttributes =
          await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
            tenantId,
            reportDataType,
            ocppConnectionName,
            timestamp,
          );
        for (const variableAttribute of variableAttributes) {
          // Reload is necessary because in createOrUpdateDeviceModelByStationId does not do eager loading
          await variableAttribute.reload({
            include: [Component, Variable],
          });
          await this._deviceModelRepository.updateResultByStationId(
            tenantId,
            {
              attributeType: variableAttribute.type,
              attributeStatus: SetVariableStatusEnum.Accepted,
              attributeStatusInfo: { reasonCode: message.action },
              component: variableAttribute.component,
              variable: variableAttribute.variable,
            } as OCPP2_common_types.SetVariableResultType,
            ocppConnectionName,
            timestamp,
          );
        }
      }
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        await this._ocppSender.sendCallErrorWithMessage(
          message,
          new OcppError(
            message.context.correlationId,
            ErrorCode.PropertyConstraintViolation,
            'Referenced entity does not exist.',
          ),
        );
        return;
      }
      throw error;
    }

    if (!message.payload.tbc) {
      // Default if omitted is false
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        NotifyReportRequestOcpp2Handler.GET_BASE_REPORT_COMPLETE_CACHE_VALUE,
        createIdentifier(tenantId, ocppConnectionName),
      );
      this._logger.info('GetBaseReport Completed', success, message.payload.requestId);
    } else {
      // tbc (to be continued) is true
      // Continue to set get base report ongoing. Will extend the timeout.
      const success = await this._cache.set(
        message.payload.requestId.toString(),
        NotifyReportRequestOcpp2Handler.GET_BASE_REPORT_ONGOING_CACHE_VALUE,
        createIdentifier(tenantId, ocppConnectionName),
        this._config.timeouts.maxCachingSeconds,
      );
      this._logger.info('GetBaseReport Ongoing', success, message.payload.requestId);
    }

    // Create response
    const response: OCPP2_response_types.NotifyReportResponse = {};

    await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(this.createHandlerSentMessageLog('NotifyReportResponse'), message, props);
  }
}

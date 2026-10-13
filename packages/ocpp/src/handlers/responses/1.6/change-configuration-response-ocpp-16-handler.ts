// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChangeConfigurationRepository } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ChangeConfiguration)
export class ChangeConfigurationResponseOcpp16Handler extends AbstractHandler {
  protected _changeConfigurationRepository: IChangeConfigurationRepository;

  constructor({
    logger,
    changeConfigurationRepository,
  }: AbstractHandlerDependencies & {
    changeConfigurationRepository: IChangeConfigurationRepository;
  }) {
    super(logger);
    this._changeConfigurationRepository = changeConfigurationRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.ChangeConfigurationResponse, OCPP1_6.ChangeConfigurationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('ChangeConfigurationResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const correlationId = message.context.correlationId;

    const request = message.request;

    if (!request) {
      this._logger.error(
        `No valid ChangeConfigurationRequest found for correlationId ${correlationId}`,
      );
      return;
    }

    const status = message.payload.status;
    const key = request.key;
    const value = request.value;

    if (
      status == OCPP1_6.ChangeConfigurationResponseStatus.Rejected ||
      status == OCPP1_6.ChangeConfigurationResponseStatus.NotSupported
    ) {
      this._logger.warn(
        `Attempted ChangeConfiguration ${correlationId} for ${key}:${value} unsuccessful with status ${status}`,
      );
      return;
    }

    const config = await this._changeConfigurationRepository.createOrUpdateChangeConfiguration(
      tenantId,
      {
        tenantId,
        ocppConnectionName,
        key,
        value,
      },
    );
    if (!config) {
      this._logger.error(
        `Failed to create or update configuration ${key}:${value} on ${ocppConnectionName}`,
      );
    } else {
      this._logger.debug(`Updated changeConfiguration ${key}:${value}`);
    }
  }
}

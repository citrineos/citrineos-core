// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingStationDto,
  type IMessageConfirmation,
  type TenantPartnerDto,
  OCPPVersion,
} from '@citrineos/base';
import type { OcpiConfig, StartSession, StopSession, UnlockConnector } from '../../index.js';
import { CommandResultType, CommandType, ModuleId, OcpiConfigToken } from '../../index.js';
import type { IRequestOptions } from 'typed-rest-client';
import { RestClient } from 'typed-rest-client';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, Token } from 'typedi';
import { OcpiGraphqlClient } from '../../graphql/index.js';
import { CommandsClientApi } from '../../trigger/CommandsClientApi.js';
import qs from 'qs';
import { Ajv } from 'ajv';

export const OCPP_COMMAND_HANDLER = new Token<OCPPCommandHandler>('OCPP_COMMAND_HANDLER');

export abstract class OCPPCommandHandler {
  abstract readonly supportedVersion: OCPPVersion;

  @Inject()
  private ajv!: Ajv;

  @Inject()
  protected logger!: Logger<ILogObj>;

  @Inject()
  protected ocpiGraphqlClient!: OcpiGraphqlClient;

  @Inject()
  protected commandsClientApi!: CommandsClientApi;

  @Inject(OcpiConfigToken)
  protected config!: OcpiConfig;

  private restClient!: RestClient;

  constructor() {
    this.restClient = new RestClient(`CitrineOS OCPI ${ModuleId.Commands}`);
  }

  abstract sendStartSessionCommand(
    startSession: StartSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void>;

  abstract sendStopSessionCommand(
    stopSession: StopSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void>;

  abstract sendUnlockConnectorCommand(
    unlockConnector: UnlockConnector,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void>;

  abstract handleAsyncCommandResponse(
    tenantPartner: TenantPartnerDto,
    command: CommandType,
    responseUrl: string,
    response: any,
    commandId: string,
  ): Promise<void>;

  protected async sendOCPPMessage(
    url: string,
    payload: any,
    options: IRequestOptions,
    tenantPartner: TenantPartnerDto,
    responseUrl: string,
    commandId: string,
  ): Promise<void> {
    this.logger.debug('Sending OCPP request', {
      url,
      payload,
      options,
      responseUrl,
    });
    let response;
    try {
      // Necessary because typed-rest-client version >=2.1.0 does not support query params for POST/PUT/PATCH
      const queryParams = options.queryParameters!;
      const parsedQueryParams: string = qs.stringify(queryParams.params);

      response = await this.restClient.create<IMessageConfirmation[]>(
        `${url}?${parsedQueryParams}`,
        payload,
        options,
      );
    } catch (error: any) {
      response = error;
    }
    if (response.statusCode !== 200 || !response.result?.[0]?.success) {
      this.logger.warn('Failed to send OCPP request', {
        url,
        statusCode: response?.statusCode,
        response: response?.result,
      });
      await this.commandsClientApi.postCommandResult(
        tenantPartner.countryCode!,
        tenantPartner.partyId!,
        tenantPartner.tenant!.countryCode!,
        tenantPartner.tenant!.partyId!,
        tenantPartner.partnerProfileOCPI!,
        responseUrl,
        {
          result: CommandResultType.FAILED,
          message: {
            language: 'en',
            text: 'Charging station communication failed',
          },
        },
        commandId,
      );
    }
  }

  protected validate<T>(protocol: string, schema: any, data: unknown): T {
    let validate = this.ajv.getSchema(schema['$id']);
    if (!validate) {
      schema['$id'] = `${protocol}-${schema['$id']}`;
      this.logger.debug(`Updated call result schema id: ${schema['$id']}`);
      validate = this.ajv.compile(schema);
    }

    if (!validate(data)) {
      const errors = validate.errors
        ?.map((err: any) => `${err.instancePath} ${err.message}`)
        .join(', ');
      throw new Error(`Validation failed: ${errors}`);
    }

    return data as T;
  }
}

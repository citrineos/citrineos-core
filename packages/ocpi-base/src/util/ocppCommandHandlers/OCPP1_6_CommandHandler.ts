// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto, TenantPartnerDto } from '@citrineos/base';
import { OCPP1_6, OCPPVersion } from '@citrineos/base';
import type { IRequestOptions } from 'typed-rest-client';
import { Service } from 'typedi';
import { OCPP_COMMAND_HANDLER, OCPPCommandHandler } from './base.js';
import type { StartSession } from '../../model/StartSession.js';
import type { IRequestQueryParams } from 'typed-rest-client/Interfaces.js';
import { CommandType } from '../../model/CommandType.js';
import type { StopSession } from '../../model/StopSession.js';
import type { UnlockConnector } from '../../index.js';
import { CommandResultType } from '../../index.js';

@Service({ id: OCPP_COMMAND_HANDLER, multiple: true })
export class OCPP1_6_CommandHandler extends OCPPCommandHandler {
  public readonly supportedVersion = OCPPVersion.OCPP1_6;

  public async sendStartSessionCommand(
    startSession: StartSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void> {
    const options: IRequestOptions = {
      additionalHeaders: this.config.commands.coreHeaders,
    };
    const queryParameters: IRequestQueryParams = {
      params: {},
    };
    queryParameters.params['identifier'] = chargingStation.ocppConnectionName;
    queryParameters.params['tenantId'] = tenantPartner.tenant!.id!;
    queryParameters.params['callbackUrl'] =
      this.config.commands.ocpiBaseUrl +
      `/2.2.1/commands/callback/${tenantPartner.id}/${this.supportedVersion}/${CommandType.START_SESSION}/${commandId}`;
    options.queryParameters = queryParameters;
    const remoteStartTransactionRequest: OCPP1_6.RemoteStartTransactionRequest = {
      connectorId: Number(startSession.connector_id),
      idTag: startSession.token.uid,
    };
    await this.sendOCPPMessage(
      this.config.commands.ocpp1_6.remoteStartTransactionRequestUrl,
      remoteStartTransactionRequest,
      options,
      tenantPartner,
      startSession.response_url,
      commandId,
    );
  }

  public async sendStopSessionCommand(
    stopSession: StopSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void> {
    const options: IRequestOptions = {
      additionalHeaders: this.config.commands.coreHeaders,
    };
    const queryParameters: IRequestQueryParams = {
      params: {},
    };
    queryParameters.params['identifier'] = chargingStation.ocppConnectionName;
    queryParameters.params['tenantId'] = tenantPartner.tenant!.id!;
    queryParameters.params['callbackUrl'] =
      this.config.commands.ocpiBaseUrl +
      `/2.2.1/commands/callback/${tenantPartner.id}/${this.supportedVersion}/${CommandType.STOP_SESSION}/${commandId}`;
    options.queryParameters = queryParameters;

    const requestStopTransactionRequest: OCPP1_6.RemoteStopTransactionRequest = {
      transactionId: Number(stopSession.session_id),
    };
    await this.sendOCPPMessage(
      this.config.commands.ocpp1_6.remoteStopTransactionRequestUrl,
      requestStopTransactionRequest,
      options,
      tenantPartner,
      stopSession.response_url,
      commandId,
    );
  }

  public async sendUnlockConnectorCommand(
    unlockConnector: UnlockConnector,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
    commandId: string,
  ): Promise<void> {
    const options: IRequestOptions = {
      additionalHeaders: this.config.commands.coreHeaders,
    };
    const queryParameters: IRequestQueryParams = {
      params: {},
    };
    queryParameters.params['identifier'] = chargingStation.ocppConnectionName;
    queryParameters.params['tenantId'] = tenantPartner.tenant!.id!;
    queryParameters.params['callbackUrl'] =
      this.config.commands.ocpiBaseUrl +
      `/2.2.1/commands/callback/${tenantPartner.id}/${this.supportedVersion}/${CommandType.UNLOCK_CONNECTOR}/${commandId}`;
    options.queryParameters = queryParameters;

    const ocpp1_6ConnectorId = Array.from(chargingStation.connectors || []).find(
      (connector) => connector.id === Number(unlockConnector.connector_id),
    )?.connectorId;
    if (ocpp1_6ConnectorId === undefined) {
      this.logger.error('UnlockConnector failed, Connector not found', {
        unlockConnector,
      });
      this.commandsClientApi
        .postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          unlockConnector.response_url,
          {
            result: CommandResultType.FAILED,
            message: {
              language: 'en',
              text: 'Charging station communication failed',
            },
          },
          commandId,
        )
        .catch((error) => {
          this.logger.error('Failed to post command result', { error });
        });
      return;
    }
    const unlockConnectorRequest: OCPP1_6.UnlockConnectorRequest = {
      connectorId: ocpp1_6ConnectorId,
    };
    await this.sendOCPPMessage(
      this.config.commands.ocpp1_6.unlockConnectorRequestUrl,
      unlockConnectorRequest,
      options,
      tenantPartner,
      unlockConnector.response_url,
      commandId,
    );
  }

  public async handleAsyncCommandResponse(
    tenantPartner: TenantPartnerDto,
    command: CommandType,
    responseUrl: string,
    response: any,
    commandId: string,
  ): Promise<void> {
    switch (command) {
      case CommandType.START_SESSION:
        return this.handleRemoteStartTransactionResponse(
          tenantPartner,
          responseUrl,
          response,
          commandId,
        );
      case CommandType.STOP_SESSION:
        return this.handleRemoteStopTransactionResponse(
          tenantPartner,
          responseUrl,
          response,
          commandId,
        );
      case CommandType.UNLOCK_CONNECTOR:
        return this.handleUnlockConnectorResponse(tenantPartner, responseUrl, response, commandId);
      default:
        throw new Error(`Unknown command type: ${command}`);
    }
  }

  private async handleRemoteStartTransactionResponse(
    tenantPartner: TenantPartnerDto,
    responseUrl: string,
    response: any,
    commandId: string,
  ): Promise<void> {
    const validatedResponse = this.validate<OCPP1_6.RemoteStartTransactionResponse>(
      this.supportedVersion,
      OCPP1_6.RemoteStartTransactionResponseSchema,
      response,
    );

    switch (validatedResponse.status) {
      case OCPP1_6.RemoteStartTransactionResponseStatus.Accepted:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.ACCEPTED,
            message: {
              language: 'en',
              text: 'Charging station start session successful',
            },
          },
          commandId,
        );
        return;
      case OCPP1_6.RemoteStartTransactionResponseStatus.Rejected:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.EVSE_OCCUPIED,
            message: {
              language: 'en',
              text: 'Charging station already in use',
            },
          },
          commandId,
        );
    }
  }

  private async handleRemoteStopTransactionResponse(
    tenantPartner: TenantPartnerDto,
    responseUrl: string,
    response: any,
    commandId: string,
  ): Promise<void> {
    const validatedResponse = this.validate<OCPP1_6.RemoteStopTransactionResponse>(
      this.supportedVersion,
      OCPP1_6.RemoteStopTransactionResponseSchema,
      response,
    );

    switch (validatedResponse.status) {
      case OCPP1_6.RemoteStopTransactionResponseStatus.Accepted:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.ACCEPTED,
            message: {
              language: 'en',
              text: 'Charging station stop session successful',
            },
          },
          commandId,
        );
        return;
      case OCPP1_6.RemoteStopTransactionResponseStatus.Rejected:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.REJECTED,
            message: {
              language: 'en',
              text: 'Charging station rejected stop session',
            },
          },
          commandId,
        );
    }
  }

  private async handleUnlockConnectorResponse(
    tenantPartner: TenantPartnerDto,
    responseUrl: string,
    response: any,
    commandId: string,
  ): Promise<void> {
    const validatedResponse = this.validate<OCPP1_6.UnlockConnectorResponse>(
      this.supportedVersion,
      OCPP1_6.UnlockConnectorResponseSchema,
      response,
    );

    switch (validatedResponse.status) {
      case OCPP1_6.UnlockConnectorResponseStatus.Unlocked:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.ACCEPTED,
            message: {
              language: 'en',
              text: 'Charging station unlock connector successful',
            },
          },
          commandId,
        );
        return;
      case OCPP1_6.UnlockConnectorResponseStatus.NotSupported:
        await this.commandsClientApi.postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.NOT_SUPPORTED,
            message: {
              language: 'en',
              text: 'Charging station does not support unlocking connectors',
            },
          },
          commandId,
        );
        return;
      case OCPP1_6.UnlockConnectorResponseStatus.UnlockFailed:
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
              text: 'Charging station failed to unlock connector',
            },
          },
          commandId,
        );
        return;
    }
  }
}

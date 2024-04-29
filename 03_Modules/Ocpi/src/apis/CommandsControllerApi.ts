import {
  BaseOcpiHeaders,
  setAuthHeader,
  validateAndgetOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { CommandResponse } from '../model/CommandResponse';
import { OcpiResponse } from '../model/OcpiResponse';
import { VersionNumber } from '../model/VersionNumber';
import { CommandsCancelReservationRequest } from '../model/CommandsCancelReservationRequest';
import { ReserveNow } from '../model/ReserveNow';
import { CommandsStartSessionRequest } from '../model/CommandsStartSessionRequest';
import { CommandsStopSessionRequest } from '../model/CommandsStopSessionRequest';
import { CommandsUnlockConnectorRequest } from '../model/CommandsUnlockConnectorRequest';

export interface PostCancelReservationRequest extends BaseOcpiHeaders {
  cancelReservation: CommandsCancelReservationRequest;
}

export interface PostReserveNowRequest extends BaseOcpiHeaders {
  reserveNow: ReserveNow;
}

export interface PostStartSessionRequest extends BaseOcpiHeaders {
  startSession: CommandsStartSessionRequest;
}

export interface PostStopSessionRequest extends BaseOcpiHeaders {
  stopSession: CommandsStopSessionRequest;
}

export interface PostUnlockConnectorRequest extends BaseOcpiHeaders {
  unlockConnector: CommandsUnlockConnectorRequest;
}

export class CommandsControllerApi extends BaseAPI {
  async postCancelReservation(
    requestParameters: PostCancelReservationRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    BaseAPI.validateRequiredParam(requestParameters, 'cancelReservation');

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/commands/CANCEL_RESERVATION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.cancelReservation,
    });
  }

  async postReserveNow(
    requestParameters: PostReserveNowRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    BaseAPI.validateRequiredParam(requestParameters, 'reserveNow');

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/commands/RESERVE_NOW`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.reserveNow,
    });
  }

  async postStartSession(
    requestParameters: PostStartSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    BaseAPI.validateRequiredParam(requestParameters, 'startSession');

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/commands/START_SESSION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.startSession,
    });
  }

  async postStopSession(
    requestParameters: PostStopSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    BaseAPI.validateRequiredParam(requestParameters, 'stopSession');

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/commands/STOP_SESSION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.stopSession,
    });
  }

  async postUnlockConnector(
    requestParameters: PostUnlockConnectorRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    BaseAPI.validateRequiredParam(requestParameters, 'unlockConnector');

    const headerParameters: HTTPHeaders =
      validateAndgetOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `/ocpi/receiver/${versionId}/commands/UNLOCK_CONNECTOR`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.unlockConnector,
    });
  }
}

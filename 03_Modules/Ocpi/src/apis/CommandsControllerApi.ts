import {
  OcpiParams,
  setAuthHeader,
  getOcpiHeaders,
} from './util';
import { BaseAPI, HTTPHeaders } from './BaseApi';
import { CommandResponse } from '../model/CommandResponse';
import { OcpiResponse } from '../util/ocpi.response';
import { VersionNumber } from '../model/VersionNumber';
import { CommandsCancelReservationRequest } from '../model/CommandsCancelReservationRequest';
import { ReserveNow } from '../model/ReserveNow';
import { CommandsStartSessionRequest } from '../model/CommandsStartSessionRequest';
import { CommandsStopSessionRequest } from '../model/CommandsStopSessionRequest';
import { CommandsUnlockConnectorRequest } from '../model/CommandsUnlockConnectorRequest';

export interface PostCancelReservationRequest extends OcpiParams {
  cancelReservation: CommandsCancelReservationRequest;
}

export interface PostReserveNowRequest extends OcpiParams {
  reserveNow: ReserveNow;
}

export interface PostStartSessionRequest extends OcpiParams {
  startSession: CommandsStartSessionRequest;
}

export interface PostStopSessionRequest extends OcpiParams {
  stopSession: CommandsStopSessionRequest;
}

export interface PostUnlockConnectorRequest extends OcpiParams {
  unlockConnector: CommandsUnlockConnectorRequest;
}

export class CommandsControllerApi extends BaseAPI {
  async postCancelReservation(
    requestParameters: PostCancelReservationRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    this.validateRequiredParam(requestParameters, 'cancelReservation');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/commands/CANCEL_RESERVATION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.cancelReservation,
    });
  }

  async postReserveNow(
    requestParameters: PostReserveNowRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    this.validateRequiredParam(requestParameters, 'reserveNow');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/commands/RESERVE_NOW`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.reserveNow,
    });
  }

  async postStartSession(
    requestParameters: PostStartSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    this.validateRequiredParam(requestParameters, 'startSession');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/commands/START_SESSION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.startSession,
    });
  }

  async postStopSession(
    requestParameters: PostStopSessionRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    this.validateRequiredParam(requestParameters, 'stopSession');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/commands/STOP_SESSION`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.stopSession,
    });
  }

  async postUnlockConnector(
    requestParameters: PostUnlockConnectorRequest,
    versionId: string = VersionNumber.TWO_DOT_TWO_DOT_ONE,
  ): Promise<OcpiResponse<CommandResponse>> {
    this.validateRequiredParam(requestParameters, 'unlockConnector');

    const headerParameters: HTTPHeaders =
      getOcpiHeaders(requestParameters);

    setAuthHeader(headerParameters);
    return await this.request({
      path: `${this.getBasePath(versionId)}/commands/UNLOCK_CONNECTOR`,
      method: 'POST',
      headers: headerParameters,
      body: requestParameters.unlockConnector,
    });
  }
}

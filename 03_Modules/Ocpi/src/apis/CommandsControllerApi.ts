import type {
    CancelReservationDTO,
    ReserveNowDTO,
    StartSessionDTO,
    StopSessionDTO,
    UnlockConnectorDTO,
} from "./models/index";
import {BaseOcpiHeaders, setAuthHeader, validateAndgetOcpiHeaders} from "./util";
import {BaseAPI, HTTPHeaders} from "./BaseApi";
import {CommandResponse} from "../model/CommandResponse";
import {OcpiResponse} from "../model/OcpiResponse";

export interface PostCancelReservationRequest extends BaseOcpiHeaders {
    cancelReservation: CancelReservationDTO;
}

export interface PostReserveNowRequest extends BaseOcpiHeaders {
    reserveNow: ReserveNowDTO;
}

export interface PostStartSessionRequest extends BaseOcpiHeaders {
    startSession: StartSessionDTO;
}

export interface PostStopSessionRequest extends BaseOcpiHeaders {
    stopSession: StopSessionDTO;
}

export interface PostUnlockConnectorRequest extends BaseOcpiHeaders {
    unlockConnector: UnlockConnectorDTO;
}


export class CommandsControllerApi extends BaseAPI {

    async postCancelReservation(requestParameters: PostCancelReservationRequest): Promise<OcpiResponse<CommandResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "cancelReservation");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/commands/CANCEL_RESERVATION`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters.cancelReservation,
        });

    }

    async postReserveNow(requestParameters: PostReserveNowRequest): Promise<OcpiResponse<CommandResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "reserveNow");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/commands/RESERVE_NOW`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters.reserveNow,
        });

    }

    async postStartSession(requestParameters: PostStartSessionRequest): Promise<OcpiResponse<CommandResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "startSession");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/commands/START_SESSION`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters.startSession,
        });

    }

    async postStopSession(requestParameters: PostStopSessionRequest): Promise<OcpiResponse<CommandResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "stopSession");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/commands/STOP_SESSION`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters.stopSession,
        });

    }

    async postUnlockConnector(requestParameters: PostUnlockConnectorRequest): Promise<OcpiResponse<CommandResponse>> {

        BaseAPI.validateRequiredParam(requestParameters, "unlockConnector");

        const headerParameters: HTTPHeaders = validateAndgetOcpiHeaders(requestParameters);

        setAuthHeader(headerParameters);
        return await this.request({
            path: `/ocpi/receiver/2.2/commands/UNLOCK_CONNECTOR`,
            method: "POST",
            headers: headerParameters,
            body: requestParameters.unlockConnector,
        });

    }

}

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {ILogObj, Logger} from 'tslog';
import {OcpiCredentialsModule} from './module';
import {AbstractModuleApi, HttpMethod,} from '@citrineos/base';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {AsOcpiEndpoint} from "../../util/as.ocpi.endpoint";
import {Cdr} from "../../model/cDR";
import {OcpiResponse} from "../../model/OcpiResponse";
import {IsDate, IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";
import {Connector} from "../../model/Connector";
import {Evse} from "../../model/Evse";
import {Session} from "inspector";
import {Tariff} from "../../model/Tariff";
import {Token} from "../../model/Token";
import {CommandResponse} from "../../model/CommandResponse";
import {ActiveChargingProfileResult} from "../../model/ActiveChargingProfileResult";
import {ActiveChargingProfile} from "../../model/ActiveChargingProfile";
import {LocationReferences} from "../../model/LocationReferences";
import {AuthorizationInfo} from "../../model/AuthorizationInfo";
import {FromToOffsetLimitQuerySchema} from "./schema/from.to.offset.limit.query.schema";

export class PostRealTimeTokenAuthorizationParamSchema {
    @IsString()
    @IsNotEmpty()
    tokenUID!: string;
}

export class PostRealTimeTokenAuthorizationQuerySchema {
    @IsString()
    @IsNotEmpty()
    type: string = "RFID";
}

export class UidParamSchema {
    @IsString()
    @IsNotEmpty()
    uid!: string;
}

export class SessionIdParamSchema {
    @IsString()
    @IsNotEmpty()
    sessionId!: string;
}

export class CommandUidPathParamSchema extends UidParamSchema {
    @IsString()
    @IsNotEmpty()
    command!: string;
}

export class LocationIdParamSchema {
    @IsString()
    @IsNotEmpty()
    locationID!: string
}

export class LocationIdEveseUidParamSchema extends LocationIdParamSchema {
    @IsString()
    @IsNotEmpty()
    evseUID!: string
}

export class GetConnectorObjectFromDataOwnerParamSchema extends LocationIdEveseUidParamSchema {
    @IsString()
    @IsNotEmpty()
    connectorID!: string
}


/**
 * Server API for the transaction module.
 */
export class TemporaryNameModuleApi
    extends AbstractModuleApi<OcpiCredentialsModule> {
    /**
     * Constructor for the class.
     *
     * @param {TransactionModule} transactionModule - The transaction module.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger.
     */
    constructor(
        transactionModule: OcpiCredentialsModule,
        server: FastifyInstance,
        logger?: Logger<ILogObj>,
    ) {
        super(transactionModule, server, logger);
    }

    // ======================== CDRs ========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/cdrs/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Cdr[]>, // todo proper pageable object
    )
    async getCdrPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<Cdr[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/cdrs',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Cdr[]>, // todo proper pageable object?
    )
    async getCdrsFromDataOwner(
        request: FastifyRequest<{
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Cdr[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Locations ========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/locations/{locationID}/{evseUID}/{connectorID}',
        HttpMethod.Get,
        undefined,
        undefined,
        GetConnectorObjectFromDataOwnerParamSchema,
        undefined,
        OcpiResponse<Connector>,
    )
    async getConnectorObjectFromDataOwner(
        request: FastifyRequest<{
            Params: GetConnectorObjectFromDataOwnerParamSchema;
        }>,
    ): Promise<OcpiResponse<Connector>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/locations/{locationID}/{evseUID}',
        HttpMethod.Get,
        undefined,
        undefined,
        LocationIdEveseUidParamSchema,
        undefined,
        OcpiResponse<Evse>,
    )
    async getEvseObjectFromDataOwner(
        request: FastifyRequest<{
            Params: LocationIdEveseUidParamSchema;
        }>,
    ): Promise<OcpiResponse<Evse>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/locations',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Location[]>, // todo pageable
    )
    async getLocationListFromDataOwner(
        request: FastifyRequest<{
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Location[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/locations/{locationID}',
        HttpMethod.Get,
        undefined,
        undefined,
        LocationIdParamSchema,
        undefined,
        OcpiResponse<Location>,
    )
    async getLocationObjectFromDataOwner(
        request: FastifyRequest<{
            Params: LocationIdParamSchema
        }>,
    ): Promise<OcpiResponse<Location>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/locations/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Location[]>, // todo pageable
    )
    async getLocationPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<Location[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Sessions ========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/sessions',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Session[]>, // todo pageable?
    )
    async getSessionsFromDataOwner(
        request: FastifyRequest<{
            Querystring: FromToOffsetLimitQuerySchema
        }>,
    ): Promise<OcpiResponse<Session[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/sessions/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Session[]>, // todo pageable?
    )
    async getSessionsPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<Session[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/sessions/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Session[]>, // todo pageable?
    )
    async getSessionsPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<Session[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Tariffs ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/tariffs',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Tariff[]>, // todo pageable?
    )
    async getTariffsFromDataOwner(
        request: FastifyRequest<{
            Querystring: FromToOffsetLimitQuerySchema
        }>,
    ): Promise<OcpiResponse<Tariff[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/tariffs/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Tariff[]>, // todo pageable?
    )
    async getTariffsPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<Tariff[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Tokens ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/tokens',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Token[]>, // todo pageable?
    )
    async getTokensFromDataOwner(
        request: FastifyRequest<{
            Querystring: FromToOffsetLimitQuerySchema
        }>,
    ): Promise<OcpiResponse<Token[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/tokens/page/{uid}',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Token[]>, // todo pageable?
    )
    async getTokensPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<Token[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/tokens/{tokenUID}/authorize',
        HttpMethod.Post,
        PostRealTimeTokenAuthorizationQuerySchema,
        LocationReferences,
        PostRealTimeTokenAuthorizationParamSchema,
        undefined,
        OcpiResponse<AuthorizationInfo>, // todo pageable?
    )
    async postRealTimeTokenAuthorization(
        request: FastifyRequest<{
            Body: LocationReferences,
            Params: PostRealTimeTokenAuthorizationParamSchema,
            Querystring: PostRealTimeTokenAuthorizationQuerySchema
        }>,
    ): Promise<OcpiResponse<AuthorizationInfo>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Commands ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/2.2/commands/{command}/{uid}',
        HttpMethod.Post,
        undefined,
        CommandResponse,
        CommandUidPathParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async postAsyncResponse(
        request: FastifyRequest<{
            Body: CommandResponse
            Params: CommandUidPathParamSchema
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Charging Profiles ===========================
    @AsOcpiEndpoint(
        '/ocpi/2.2/sender/chargingprofiles/result/{uid}',
        HttpMethod.Post,
        undefined,
        ActiveChargingProfileResult,
        UidParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async postGenericChargingProfileResult(
        request: FastifyRequest<{
            Body: ActiveChargingProfileResult
            Params: UidParamSchema
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/2.2/sender/chargingprofiles/{sessionId}',
        HttpMethod.Put,
        undefined,
        ActiveChargingProfile,
        SessionIdParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async putSenderChargingProfile(
        request: FastifyRequest<{
            Body: ActiveChargingProfile
            Params: SessionIdParamSchema
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }
}

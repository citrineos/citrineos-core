// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {ILogObj, Logger} from 'tslog';
import {OcpiCredentialsModule} from './module';
import {AbstractModuleApi, HttpMethod, } from '@citrineos/base';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {AsOcpiEndpoint} from '../../util/as.ocpi.endpoint';
import {OcpiResponse} from '../../model/OcpiResponse';
import {IsEnum, IsNotEmpty, IsString} from 'class-validator';
import {Connector} from '../../model/Connector';
import {Evse} from '../../model/Evse';
import {Session} from 'inspector';
import {Tariff} from '../../model/Tariff';
import {Token} from '../../model/Token';
import {CommandResponse} from '../../model/CommandResponse';
import {ActiveChargingProfileResult} from '../../model/ActiveChargingProfileResult';
import {ActiveChargingProfile} from '../../model/ActiveChargingProfile';
import {LocationReferences} from '../../model/LocationReferences';
import {AuthorizationInfo} from '../../model/AuthorizationInfo';
import {FromToOffsetLimitQuerySchema} from './schema/from.to.offset.limit.query.schema';
import {VersionNumber} from '../../model/VersionNumber';
import {Cdr} from '../../model/Cdr';

export class VersionidParamSchema {
    @IsEnum(VersionNumber)
    @IsNotEmpty()
    versionid!: VersionNumber;
}

export class PostRealTimeTokenAuthorizationParamSchema extends VersionidParamSchema {
    @IsString()
    @IsNotEmpty()
    tokenUID!: string;
}

export class PostRealTimeTokenAuthorizationQuerySchema {
    @IsString()
    @IsNotEmpty()
    type = 'RFID';
}

export class UidParamSchema extends VersionidParamSchema {
    @IsString()
    @IsNotEmpty()
    uid!: string;
}

export class SessionIdParamSchema extends VersionidParamSchema {
    @IsString()
    @IsNotEmpty()
    sessionId!: string;
}

export class CommandUidPathParamSchema extends UidParamSchema {
    @IsString()
    @IsNotEmpty()
    command!: string;
}

export class LocationIdParamSchema extends VersionidParamSchema {
    @IsString()
    @IsNotEmpty()
    locationID!: string;
}

export class LocationIdEveseUidParamSchema extends LocationIdParamSchema {
    @IsString()
    @IsNotEmpty()
    evseUID!: string;
}

export class GetConnectorObjectFromDataOwnerParamSchema extends LocationIdEveseUidParamSchema {
    @IsString()
    @IsNotEmpty()
    connectorID!: string;
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
        '/ocpi/sender/:versionId/cdrs/page/:uid',
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
        '/ocpi/sender/:versionId/cdrs',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        VersionidParamSchema,
        undefined,
        OcpiResponse<Cdr[]>, // todo proper pageable object?
    )
    async getCdrsFromDataOwner(
        request: FastifyRequest<{
            Params: VersionidParamSchema;
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Cdr[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Locations ========================
    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/locations/:locationID/:evseUID/:connectorID',
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
        '/ocpi/sender/:versionId/locations/:locationID/:evseUID',
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
        '/ocpi/sender/:versionId/locations',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        VersionidParamSchema,
        undefined,
        OcpiResponse<Location[]>, // todo pageable
    )
    async getLocationListFromDataOwner(
        request: FastifyRequest<{
            Params: VersionidParamSchema;
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Location[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/locations/:locationID',
        HttpMethod.Get,
        undefined,
        undefined,
        LocationIdParamSchema,
        undefined,
        OcpiResponse<Location>,
    )
    async getLocationObjectFromDataOwner(
        request: FastifyRequest<{
            Params: LocationIdParamSchema;
        }>,
    ): Promise<OcpiResponse<Location>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/locations/page/:uid',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Location[]>, // todo pageable
    )
    async getLocationPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<Location[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Sessions ========================
    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/sessions',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        VersionidParamSchema,
        undefined,
        OcpiResponse<Session[]>, // todo pageable?
    )
    async getSessionsFromDataOwner(
        request: FastifyRequest<{
            Params: VersionidParamSchema;
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Session[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/sessions/page/:uid',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Session[]>, // todo pageable?
    )
    async getSessionsPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<Session[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Tariffs ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/tariffs',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        VersionidParamSchema,
        undefined,
        OcpiResponse<Tariff[]>, // todo pageable?
    )
    async getTariffsFromDataOwner(
        request: FastifyRequest<{
            Params: VersionidParamSchema;
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Tariff[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/tariffs/page/:uid',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Tariff[]>, // todo pageable?
    )
    async getTariffsPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<Tariff[]>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Tokens ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/tokens',
        HttpMethod.Get,
        FromToOffsetLimitQuerySchema,
        undefined,
        VersionidParamSchema,
        undefined,
        OcpiResponse<Token[]>, // todo pageable?
    )
    async getTokensFromDataOwner(
        request: FastifyRequest<{
            Params: VersionidParamSchema;
            Querystring: FromToOffsetLimitQuerySchema;
        }>,
    ): Promise<OcpiResponse<Token[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/tokens/page/:uid',
        HttpMethod.Get,
        undefined,
        undefined,
        UidParamSchema,
        undefined,
        OcpiResponse<Token[]>, // todo pageable?
    )
    async getTokensPageFromDataOwner(
        request: FastifyRequest<{
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<Token[]>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/tokens/:tokenUID/authorize',
        HttpMethod.Post,
        PostRealTimeTokenAuthorizationQuerySchema,
        LocationReferences,
        PostRealTimeTokenAuthorizationParamSchema,
        undefined,
        OcpiResponse<AuthorizationInfo>, // todo pageable?
    )
    async postRealTimeTokenAuthorization(
        request: FastifyRequest<{
            Body: LocationReferences;
            Params: PostRealTimeTokenAuthorizationParamSchema;
            Querystring: PostRealTimeTokenAuthorizationQuerySchema;
        }>,
    ): Promise<OcpiResponse<AuthorizationInfo>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Commands ===========================
    @AsOcpiEndpoint(
        '/ocpi/sender/:versionId/commands/:command/:uid',
        HttpMethod.Post,
        undefined,
        CommandResponse,
        CommandUidPathParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async postAsyncResponse(
        request: FastifyRequest<{
            Body: CommandResponse;
            Params: CommandUidPathParamSchema;
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }

    // ======================== Charging Profiles ===========================
    @AsOcpiEndpoint(
        '/ocpi/:versionId/sender/chargingprofiles/result/:uid',
        HttpMethod.Post,
        undefined,
        ActiveChargingProfileResult,
        UidParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async postGenericChargingProfileResult(
        request: FastifyRequest<{
            Body: ActiveChargingProfileResult;
            Params: UidParamSchema;
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsOcpiEndpoint(
        '/ocpi/:versionId/sender/chargingprofiles/:sessionId',
        HttpMethod.Put,
        undefined,
        ActiveChargingProfile,
        SessionIdParamSchema,
        undefined,
        OcpiResponse<void>, // todo pageable?
    )
    async putSenderChargingProfile(
        request: FastifyRequest<{
            Body: ActiveChargingProfile;
            Params: SessionIdParamSchema;
        }>,
    ): Promise<OcpiResponse<void>> {
        return new Promise(() => {
        }); // TODO
    }
}

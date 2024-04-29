import {AbstractModuleApi, AsDataEndpoint, HttpMethod} from '@citrineos/base';
import {OcpiCredentialsModule} from './module';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {ILogObj, Logger} from 'tslog';
import {OcpiResponse} from '../../model/OcpiResponse';
import {VersionDetailsDTO, VersionDTO} from '../../model/Version';
import {AuthorizationHeaderSchema} from './schema/authorizationHeaderSchema';
import {IsEnum, IsNotEmpty} from 'class-validator';
import {VersionNumber} from '../../model/VersionNumber';
import {VersionService} from './service/version.service';

export class VersionIdParamSchema {
    @IsEnum(VersionNumber)
    @IsNotEmpty()
    versionId!: VersionNumber;
}

export class VersionsModuleApi
    extends AbstractModuleApi<OcpiCredentialsModule> {

    constructor(
        transactionModule: OcpiCredentialsModule,
        server: FastifyInstance,
        logger?: Logger<ILogObj>,
        private versionService?: VersionService
    ) {
        super(transactionModule, server, logger);
    }

    @AsDataEndpoint(
        '/ocpi/versions',
        HttpMethod.Get,
        undefined,
        undefined,
        undefined,
        AuthorizationHeaderSchema,
        OcpiResponse<VersionDTO[]>, // todo proper pageable object?
    )
    async getVersions(
        request: FastifyRequest<{
            Headers: AuthorizationHeaderSchema;
        }>,
    ): Promise<OcpiResponse<VersionDTO[]>> {
        return this.versionService?.getVersions(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/:versionId',
        HttpMethod.Get,
        undefined,
        undefined,
        VersionIdParamSchema,
        AuthorizationHeaderSchema,
        OcpiResponse<VersionDetailsDTO>
    )
    async getVersion(
        request: FastifyRequest<{
            Headers: AuthorizationHeaderSchema;
            Params: VersionIdParamSchema;
        }>,
    ): Promise<OcpiResponse<VersionDetailsDTO>> {
        return this.versionService?.getVersion(request)!;
    }

}

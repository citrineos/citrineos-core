import {AbstractModuleApi, AsDataEndpoint, HttpMethod} from '@citrineos/base';
import {OcpiCredentialsModule} from './module';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {ILogObj, Logger} from 'tslog';
import {OcpiResponse} from '../../model/OcpiResponse';
import {AuthorizationHeaderSchema} from './schema/authorizationHeaderSchema';
import {Credentials} from '../../model/Credentials';
import {CredentialsService} from './service/credentials.service';
import {VersionIdParamSchema} from './versions.api';

export class CredentialsModuleApi
    extends AbstractModuleApi<OcpiCredentialsModule> {

    constructor(
        module: OcpiCredentialsModule,
        server: FastifyInstance,
        logger?: Logger<ILogObj>,
        private credentialsService?: CredentialsService,
    ) {
        super(module, server, logger);
    }

    @AsDataEndpoint(
        '/ocpi/:versionId/credentials',
        HttpMethod.Get,
        undefined,
        undefined,
        VersionIdParamSchema,
        AuthorizationHeaderSchema,
        OcpiResponse<Credentials>
    )
    async getCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema;
            Headers: AuthorizationHeaderSchema;
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.getCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/:versionId/credentials',
        HttpMethod.Post,
        undefined,
        Credentials,
        VersionIdParamSchema,
        AuthorizationHeaderSchema,
        OcpiResponse<Credentials>
    )
    async postCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema;
            Headers: AuthorizationHeaderSchema;
            Body: Credentials;
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.postCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/:versionId/credentials',
        HttpMethod.Put,
        undefined,
        Credentials,
        VersionIdParamSchema,
        AuthorizationHeaderSchema,
        OcpiResponse<Credentials>
    )
    async putCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema;
            Headers: AuthorizationHeaderSchema;
            Body: Credentials;
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.putCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/:versionId/credentials',
        HttpMethod.Delete,
        undefined,
        undefined,
        VersionIdParamSchema,
        AuthorizationHeaderSchema,
        OcpiResponse<void>
    )
    async deleteCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema;
            Headers: AuthorizationHeaderSchema;
        }>,
    ): Promise<OcpiResponse<void>> {
        return this.credentialsService?.deleteCredentials(request)!;
    }
}

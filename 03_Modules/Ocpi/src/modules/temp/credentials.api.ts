import {AbstractModuleApi, AsDataEndpoint, HttpMethod} from "@citrineos/base";
import {OcpiCredentialsModule} from "./module";
import {FastifyInstance, FastifyRequest} from "fastify";
import {ILogObj, Logger} from "tslog";
import {OcpiResponse} from "../../model/OcpiResponse";
import {AuthorizationQuerySchema} from "./schema/authorization.query.schema";
import {Credentials} from "../../model/Credentials";
import {CredentialsService} from "./service/credentials.service";

export class CredentialsModuleApi
    extends AbstractModuleApi<OcpiCredentialsModule> {

    /**
     * Constructor for the class.
     *
     * @param {TransactionModule} module - The transaction module.
     * @param {FastifyInstance} server - The server instance.
     * @param {Logger<ILogObj>} [logger] - Optional logger.
     * @param {CredentialsService} credentialsService - Credentials service.
     */
    constructor(
        module: OcpiCredentialsModule,
        server: FastifyInstance,
        logger?: Logger<ILogObj>,
        private credentialsService?: CredentialsService,
    ) {
        super(module, server, logger);
    }

    @AsDataEndpoint(
        '/ocpi/2.2/credentials',
        HttpMethod.Get,
        AuthorizationQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Credentials>
    )
    async getCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.getCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/2.2/credentials',
        HttpMethod.Post,
        AuthorizationQuerySchema,
        Credentials,
        undefined,
        undefined,
        OcpiResponse<Credentials>
    )
    async postCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.postCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/2.2/credentials',
        HttpMethod.Put,
        AuthorizationQuerySchema,
        Credentials,
        undefined,
        undefined,
        OcpiResponse<Credentials>
    )
    async putCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return this.credentialsService?.putCredentials(request)!;
    }

    @AsDataEndpoint(
        '/ocpi/2.2/credentials',
        HttpMethod.Delete,
        AuthorizationQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<void>
    )
    async deleteCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema
        }>,
    ): Promise<OcpiResponse<void>> {
        return this.credentialsService?.deleteCredentials(request)!;
    }
}

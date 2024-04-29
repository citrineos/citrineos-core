import {AbstractModuleApi, AsDataEndpoint, HttpMethod} from "@citrineos/base";
import {OcpiCredentialsModule} from "./module";
import {FastifyInstance, FastifyRequest} from "fastify";
import {ILogObj, Logger} from "tslog";
import {OcpiResponse} from "../../model/OcpiResponse";
import {Version} from "../../model/Version";
import {VersionDetails} from "../../model/VersionDetails";
import {AuthorizationQuerySchema} from "./schema/authorization.query.schema";


export class VersionsModuleApi
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

    @AsDataEndpoint(
        '/ocpi/2.2',
        HttpMethod.Get,
        AuthorizationQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<VersionDetails>
    )
    async getVersion(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema;
        }>,
    ): Promise<OcpiResponse<VersionDetails>> {
        return new Promise(() => {
        }); // TODO
    }

    @AsDataEndpoint(
        '/ocpi/versions',
        HttpMethod.Get,
        AuthorizationQuerySchema,
        undefined,
        undefined,
        undefined,
        OcpiResponse<Version[]>, // todo proper pageable object?
    )
    async getVersions(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema;
        }>,
    ): Promise<OcpiResponse<Version[]>> {
        return new Promise(() => {
        }); // TODO
    }

}

import {CredentialsRepository} from "../repository/credentials.repository";
import {FastifyRequest} from "fastify";
import {AuthorizationQuerySchema} from "../schema/authorization.query.schema";
import {OcpiResponse} from "../../../model/OcpiResponse";
import {Credentials} from "../../../model/Credentials";
import {Namespace} from "../util/namespace";
import {HttpStatus} from "../../../util/http.status";

export class CredentialsService {

    constructor(private credentialsRepository: CredentialsRepository) {
    }

    async getCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema
        }>,
    ): Promise<OcpiResponse<Credentials>> { // todo global exception handler
        return OcpiResponse.build(
            HttpStatus.OK,
            await this.credentialsRepository.readByQuery({
                where: {
                    token: request.query.Authorization
                }
            }, Namespace.Credentials)
        );
    }

    async postCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return OcpiResponse.build(
            HttpStatus.OK,
            await this.credentialsRepository.create(request.body)
        );
    }

    async putCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        return OcpiResponse.build(
            HttpStatus.OK,
            await this.credentialsRepository.updateByQuery(request.body, {
                where: {
                    token: request.query.Authorization
                }
            }, Namespace.Credentials)
        );
    }

    async deleteCredentials(
        request: FastifyRequest<{
            Querystring: AuthorizationQuerySchema
        }>,
    ): Promise<OcpiResponse<void>> {
        await this.credentialsRepository.deleteAllByQuery({
            where: {
                token: request.query
            }
        }, Namespace.Credentials);
        return OcpiResponse.build(HttpStatus.OK);
    }
}

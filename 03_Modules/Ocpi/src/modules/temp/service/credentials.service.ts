import {CredentialsRepository} from "../repository/credentials.repository";
import {FastifyRequest} from "fastify";
import {AuthorizationHeaderSchema} from "../schema/authorizationHeaderSchema";
import {OcpiResponse} from "../../../model/OcpiResponse";
import {Credentials} from "../../../model/Credentials";
import {Namespace} from "../util/namespace";
import {HttpStatus} from "../../../util/http.status";
import {VersionsControllerApi} from "../../../apis/VersionsControllerApi";
import {VersionIdParamSchema} from "../versions.api";
import {VersionRepository} from "../repository/version.repository";
import {Version} from "../../../model/Version";
import {v4 as uuidv4} from 'uuid';

export class CredentialsService {

    constructor(
        private credentialsRepository: CredentialsRepository,
        private versionRepository: VersionRepository,
        private versionsControllerApi: VersionsControllerApi
    ) {
    }

    async getCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema,
            Headers: AuthorizationHeaderSchema
        }>,
    ): Promise<OcpiResponse<Credentials>> { // todo global exception handler
        return OcpiResponse.build(
            HttpStatus.OK,
            await this.credentialsRepository.readByQuery({
                where: {
                    token: request.headers.Authorization
                }
            }, Namespace.Credentials)
        );
    }

    async postCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema,
            Headers: AuthorizationHeaderSchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        await this.credentialsRepository.validateAuthentication(request.headers.Authorization);
        await this.getAndUpdateVersions(request.body.token, request.params.versionId);
        return this.updateExistingCredentialsTokenWithNewGeneratedToken(request.headers.Authorization);
    }

    private async updateExistingCredentialsTokenWithNewGeneratedToken(
        oldToken: string
    ) {
        try {
            const existingCredentials = await this.credentialsRepository.readByKey(oldToken, Namespace.Credentials);
            const generateNewToken = uuidv4();
            if (existingCredentials) {
                const updatedCredentials = await this.credentialsRepository.updateByQuery({
                    token: generateNewToken
                } as Credentials, {
                    where: {
                        token: oldToken
                    }
                }, Namespace.Credentials);
                if (!updatedCredentials) {
                    throw new Error('todo'); // todo error handling
                }
                return OcpiResponse.build(
                    HttpStatus.OK,
                    updatedCredentials
                );
            } else {
                throw new Error('todo'); // todo error handling
            }
        } catch (e) {
            throw new Error('todo'); // todo error handling
        }
    }

    private async getAndUpdateVersions(
        token: string,
        versionId: string,
    ) {
        try {
            const versions = await this.versionsControllerApi.getVersions({
                authorization: token
            });
            if (!versions || !versions.data) {
                throw new Error('todo'); // todo error handling
            }
            const version = versions.data?.find(v => v.version === versionId);
            if (!version) {
                throw new Error('todo'); // todo error handling
            }
            const versionDetails = await this.versionsControllerApi.getVersion({
                authorization: token,
                versionId: versionId
            })
            if (!versionDetails) {
                throw new Error('todo'); // todo error handling
            }
            const existingVersion: Version = await this.versionRepository.readByKey(versionId, Namespace.Version);
            if (!existingVersion) {
                throw new Error('todo'); // todo error handling
            }
            await this.versionRepository.updateByKey({
                ...existingVersion,
                url: version.url,
                endpoints: versionDetails.data?.endpoints
            } as Version, versionId, Namespace.Version)
        } catch (e) {
            throw new Error('todo'); // todo error handling
        }
    }

    async putCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema,
            Headers: AuthorizationHeaderSchema,
            Body: Credentials
        }>,
    ): Promise<OcpiResponse<Credentials>> {
        await this.credentialsRepository.validateAuthentication(request.headers.Authorization);
        await this.getAndUpdateVersions(request.body.token, request.params.versionId);
        return this.updateExistingCredentialsTokenWithNewGeneratedToken(request.headers.Authorization);
    }

    async deleteCredentials(
        request: FastifyRequest<{
            Params: VersionIdParamSchema,
            Headers: AuthorizationHeaderSchema
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

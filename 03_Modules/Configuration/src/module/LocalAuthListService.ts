import {
    Authorization,
    GetLocalAuthListResponse,
    LocalAuthListIdTokenRepository,
    LocalAuthListVersionRepository, SequelizeAuthorizationRepository
} from "@citrineos/data";
import {AbstractModule, CallAction, IdTokenType, SendLocalListRequest, UpdateEnumType} from "@citrineos/base";
import {ILogObj, Logger} from "tslog";

export class LocalAuthListService {

    constructor(readonly _localAuthListVersionRepository: LocalAuthListVersionRepository,
                readonly _localAuthListIdTokenRepository: LocalAuthListIdTokenRepository,
                readonly _authorizationRepository: SequelizeAuthorizationRepository,
                readonly _module: AbstractModule,
                readonly _logger?: Logger<ILogObj>
    ) {}

    public async get(stationId: string): Promise<GetLocalAuthListResponse> {
        const version = await this._localAuthListVersionRepository.getVersion(stationId);

        if (!version) {
            return {
                version: 0,
                idTokens: []
            }
        }

        const idTokenDatabaseIds = await this._localAuthListIdTokenRepository.getAll(version.id).then((ids) => ids.map((id) => id.idTokenId));

        const authorizations = await this._authorizationRepository.getAllByDatabaseIds(idTokenDatabaseIds);

        return {
            version: version.version,
            idTokens: authorizations.map((authorization) => {
                return {
                    idToken: authorization.idToken.idToken,
                    type: authorization.idToken.type,
                    idTokenInfo: authorization.idTokenInfo,
                    customData: authorization.customData
                }
            })
        }
    }

    public async update(
        stationId: string,
        idTokens: IdTokenType[],
        overwrite = false,
    ): Promise<void> {
        try {
            if (overwrite) {
                await this._localAuthListIdTokenRepository.deleteAll(stationId);
            }

            const authorizations = await this._authorizationRepository.getAllByIdTokens(idTokens);

            await Promise.all(authorizations.map(async (authorization) => {
                await this._localAuthListIdTokenRepository.createOrUpdate(stationId, authorization.idTokenId as number);
            }));

            const versionNumber = await this._localAuthListVersionRepository.incrementVersion(stationId);

            this.sendRequest(stationId, versionNumber, authorizations, overwrite);
        } catch (error) {
            this._logger?.error('Failed to push update', error);
            throw error;
        }
    }

    private sendRequest(stationId: string, versionNumber: number, authorizations: Authorization[], overwrite: boolean) {
        this._module.sendCall(
            stationId,
            "tenantId",
            CallAction.SendLocalList,
            {
                localAuthorizationList: authorizations.map((authorization) => {
                        return {
                            idToken: authorization.idToken,
                            idTokenInfo: authorization.idTokenInfo,
                            customData: authorization.customData
                        }
                    }
                ),
                versionNumber: versionNumber,
                updateType: overwrite ? UpdateEnumType.Full : UpdateEnumType.Differential
            } as SendLocalListRequest
        );
    }
}

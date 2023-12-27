/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { AuthorizationData, IdTokenType } from "@citrineos/base";
import { BuildOptions, Includeable } from "sequelize";
import { AuthorizationQuerystring } from "../../../interfaces/queries/Authorization";
import { IAuthorizationRepository } from "../../../interfaces/repositories";
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from "../model/Authorization";
import { SequelizeRepository } from "./Base";
import { AuthorizationRestrictions } from "../../../interfaces";

export class AuthorizationRepository extends SequelizeRepository<Authorization> implements IAuthorizationRepository {

    async createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
        if (value.idToken.idToken !== query.idToken || value.idToken.type !== query.type) {
            throw new Error("Authorization idToken does not match query");
        }
        
        const savedAuthorizationModel = await this.readByQuery(query);
        const authorizationModel = savedAuthorizationModel ? savedAuthorizationModel : Authorization.build({}, this._createInclude(value));

        authorizationModel.idTokenId = (await this._updateIdToken(value.idToken, authorizationModel.idTokenId)).id;

        if (value.idTokenInfo) {
            const valueIdTokenInfo = IdTokenInfo.build({
                id: undefined,
                ...value.idTokenInfo
            });
            if (authorizationModel.idTokenInfoId) {
                let savedIdTokenInfo = await this.s.models[IdTokenInfo.MODEL_NAME].findOne({
                    where: { id: authorizationModel.idTokenInfoId },
                    include: [{ model: IdToken, include: [AdditionalInfo] }]
                }) as IdTokenInfo;
                for (const k in valueIdTokenInfo.dataValues) {
                    const updatedValue = valueIdTokenInfo.getDataValue(k);
                    if (updatedValue != undefined) { // Null can still be used to remove data
                        savedIdTokenInfo.setDataValue(k, valueIdTokenInfo.getDataValue(k));
                    }
                }
                if (value.idTokenInfo.groupIdToken) {
                    const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken, savedIdTokenInfo.groupIdTokenId);
                    if (!savedIdTokenInfo.groupIdTokenId) {
                        savedIdTokenInfo.groupIdTokenId = savedGroupIdToken.id;
                    }
                } else if (savedIdTokenInfo.groupIdTokenId) {
                    savedIdTokenInfo.groupIdTokenId = undefined;
                    savedIdTokenInfo.groupIdToken = undefined;
                }
                savedIdTokenInfo = await savedIdTokenInfo.save();
            } else {
                if (value.idTokenInfo.groupIdToken) {
                    const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken);
                    valueIdTokenInfo.groupIdTokenId = savedGroupIdToken.id;
                }
                authorizationModel.idTokenInfoId = (await valueIdTokenInfo.save()).id;
                await authorizationModel.save();
            }
        } else if (authorizationModel.idTokenInfoId) {
            // Remove idTokenInfo
            authorizationModel.idTokenInfoId = undefined;
            authorizationModel.idTokenInfo = undefined;
            await authorizationModel.save();
        }
        return authorizationModel.reload();

    }

    updateRestrictionsByQuery(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
        return this.readByQuery(query).then(dbValue => {
            if (dbValue) {
                return super.updateByModel(Authorization.build({
                    ...value
                }), dbValue);
            } else {
                // Do nothing
            }
        });
    }

    readByQuery(query: AuthorizationQuerystring): Promise<Authorization> {
        return super.readByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
    }

    existsByQuery(query: AuthorizationQuerystring): Promise<boolean> {
        return super.existsByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
    }

    deleteAllByQuery(query: AuthorizationQuerystring): Promise<number> {
        return super.deleteAllByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
    }

    /**
     * Private Methods
     */

    private _constructQuery(queryParams: AuthorizationQuerystring): object {
        return {
            where: {},
            include: [
                {
                    model: IdToken,
                    where: { idToken: queryParams.idToken, type: queryParams.type },
                    required: true  // This ensures the inner join, so only Authorizations with the matching IdToken are returned
                },
                { model: IdTokenInfo, include: [{ model: IdToken, include: [AdditionalInfo] }] }
            ]
        }
    }

    private _createInclude(value: AuthorizationData): BuildOptions {
        const include: Includeable[] = [];
        if (value.idTokenInfo) {
            const idTokenInfoInclude: Includeable[] = [];
            if (value.idTokenInfo.groupIdToken) {
                const idTokenInfoGroupIdTokenInclude: Includeable[] = [];
                if (value.idTokenInfo?.groupIdToken.additionalInfo) {
                    idTokenInfoGroupIdTokenInclude.push(AdditionalInfo);
                }
                idTokenInfoInclude.push({ model: IdToken, include: idTokenInfoGroupIdTokenInclude });
            }
            include.push({ model: IdTokenInfo, include: idTokenInfoInclude });
        }
        const idTokenInclude: Includeable[] = [];
        if (value.idToken.additionalInfo) {
            idTokenInclude.push(AdditionalInfo);
        }
        include.push({ model: IdToken, include: idTokenInclude });
        return { include: include };
    }

    private async _updateIdToken(value: IdTokenType, savedIdTokenId?: number) {
        const idTokenModel = IdToken.build({
            id: undefined,
            ...value
        }, {
            include: [AdditionalInfo]
        });
        let savedIdTokenModel: IdToken | undefined = undefined;
        if (savedIdTokenId) {
            savedIdTokenModel = await this.s.models[IdToken.MODEL_NAME].findOne({
                where: { id: savedIdTokenId },
                include: [AdditionalInfo]
            }) as IdToken;
        }
        if (!savedIdTokenModel || savedIdTokenModel.idToken != value.idToken || savedIdTokenModel.type != value.type) {
            savedIdTokenModel = await this.s.models[IdToken.MODEL_NAME].findOne({
                where: { idToken: value.idToken, type: value.type },
                include: [AdditionalInfo]
            }) as IdToken;
        }
        if (savedIdTokenModel) {
            // idToken.idToken and idToken.type should be treated as immutable.
            // Therefore, only update additionalInfo
            savedIdTokenModel.additionalInfo?.forEach(savedAdditionalInfo => {
                // Remove additionalInfo not in value.additionalInfo
                if (!value?.additionalInfo?.some(valueAdditionalInfo =>
                    valueAdditionalInfo.additionalIdToken == savedAdditionalInfo.additionalIdToken
                    && valueAdditionalInfo.type == savedAdditionalInfo.type)) {
                    (savedAdditionalInfo as AdditionalInfo).destroy();
                }
            });
            value.additionalInfo?.forEach(valueAdditionalInfo => {
                // Create additionalInfo not in savedIdTokenModel.additionalInfo
                if (!savedIdTokenModel?.additionalInfo?.some(savedAdditionalInfo =>
                    savedAdditionalInfo.additionalIdToken == valueAdditionalInfo.additionalIdToken
                    && savedAdditionalInfo.type == valueAdditionalInfo.type)) {
                    AdditionalInfo.build({
                        idTokenId: (savedIdTokenModel as IdToken).id,
                        ...valueAdditionalInfo
                    }).save();
                }
            });
            return savedIdTokenModel.save();
        } else {
            return idTokenModel.save();
        }
    }
}



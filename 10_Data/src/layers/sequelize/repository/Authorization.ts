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

import { AuthorizationData } from "@citrineos/base";
import { BuildOptions, Includeable } from "sequelize";
import { AuthorizationQuerystring } from "../../../interfaces/queries/Authorization";
import { IAuthorizationRepository } from "../../../interfaces/repositories";
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from "../model/Authorization";
import { SequelizeRepository } from "./Base";
import { AuthorizationRestrictions } from "../../../interfaces";

export class AuthorizationRepository extends SequelizeRepository<Authorization> implements IAuthorizationRepository {

    createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
        return this.readByQuery(query).then(dbValue => {
            if (dbValue) {
                return super.updateByModel(Authorization.build({
                    ...value
                }, this.createInclude([dbValue, value])), dbValue);
            } else {
                return super.create(Authorization.build({
                    ...value
                }, this.createInclude([value])));
            }
        });
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
        return super.readByQuery(this.constructQuery(query), Authorization.MODEL_NAME);
    }

    existsByQuery(query: AuthorizationQuerystring): Promise<boolean> {
        return super.existsByQuery(this.constructQuery(query), Authorization.MODEL_NAME);
    }

    deleteAllByQuery(query: AuthorizationQuerystring): Promise<number> {
        return super.deleteAllByQuery(this.constructQuery(query), Authorization.MODEL_NAME);
    }

    /**
     * Private Methods
     */

    private constructQuery(queryParams: AuthorizationQuerystring): object {
        return {
            where: {},
            include: [
                {
                    model: IdToken,
                    where: { idToken: queryParams.idToken, type: queryParams.type },
                    required: true  // This ensures the inner join, so only Authorizations with the matching IdToken are returned
                }
            ]
        }
    }

    private createInclude(values: AuthorizationData[]): BuildOptions {
        const include: Includeable[] = [];
        if (!values.every(value => !value.idTokenInfo)) {
            const idTokenInfoInclude: Includeable[] = [];
            if (!values.every(value => !value.idTokenInfo?.groupIdToken)) {
                const idTokenInfoGroupIdTokenInclude: Includeable[] = [];
                if (!values.every(value => !value.idTokenInfo?.groupIdToken?.additionalInfo)) {
                    idTokenInfoGroupIdTokenInclude.push(AdditionalInfo);
                }
                idTokenInfoInclude.push({ model: IdToken, include: idTokenInfoGroupIdTokenInclude });
            }
            include.push({ model: IdTokenInfo, include: idTokenInfoInclude });
        }
        const idTokenInclude: Includeable[] = [];
        if (!values.every(value => !value.idToken.additionalInfo)) {
            idTokenInclude.push(AdditionalInfo);
        }
        include.push({ model: IdToken, include: idTokenInclude });
        return { include: include };
    }
}



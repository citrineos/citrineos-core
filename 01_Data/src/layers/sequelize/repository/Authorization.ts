// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type AuthorizationData, type IdTokenType } from '@citrineos/base';
import { type BuildOptions, type Includeable } from 'sequelize';
import { type AuthorizationQuerystring, type IAuthorizationRepository, type AuthorizationRestrictions } from '../../../interfaces';
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from '../model/Authorization';
import { SequelizeRepository } from './Base';

export class AuthorizationRepository extends SequelizeRepository<Authorization> implements IAuthorizationRepository {
  async createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    if (value.idToken.idToken !== query.idToken || value.idToken.type !== query.type) {
      throw new Error('Authorization idToken does not match query');
    }

    const savedAuthorizationModel: Authorization | null = await this.readByQuery(query);
    const authorizationModel = savedAuthorizationModel ?? Authorization.build({}, this._createInclude(value));

    authorizationModel.idTokenId = (await this._updateIdToken(value.idToken, authorizationModel.idTokenId)).id;

    if (value.idTokenInfo) {
      const valueIdTokenInfo = IdTokenInfo.build({
        id: undefined,
        ...value.idTokenInfo,
      });
      if (authorizationModel.idTokenInfoId) {
        let savedIdTokenInfo = (await this.s.models[IdTokenInfo.MODEL_NAME].findOne({
          where: { id: authorizationModel.idTokenInfoId },
          include: [{ model: IdToken, include: [AdditionalInfo] }],
        })) as IdTokenInfo;
        Object.keys(valueIdTokenInfo.dataValues).forEach((k) => {
          const updatedValue = valueIdTokenInfo.getDataValue(k);
          if (updatedValue !== undefined) {
            // Null can still be used to remove data
            savedIdTokenInfo.setDataValue(k, valueIdTokenInfo.getDataValue(k));
          }
        });
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
      }
    } else if (authorizationModel.idTokenInfoId) {
      // Remove idTokenInfo
      authorizationModel.idTokenInfoId = undefined;
      authorizationModel.idTokenInfo = undefined;
    }
    return await authorizationModel.save();
  }

  async updateRestrictionsByQuery(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    return await this.readByQuery(query).then(async (dbValue) => {
      if (dbValue) {
        return await super.updateByModel(
          Authorization.build({
            ...value,
          }),
          dbValue,
        );
      } else {
        // Do nothing
      }
    });
  }

  async readByQuery(query: AuthorizationQuerystring): Promise<Authorization> {
    return await super.readByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
  }

  async existsByQuery(query: AuthorizationQuerystring): Promise<boolean> {
    return await super.existsByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
  }

  async deleteAllByQuery(query: AuthorizationQuerystring): Promise<number> {
    return await super.deleteAllByQuery(this._constructQuery(query), Authorization.MODEL_NAME);
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
          required: true, // This ensures the inner join, so only Authorizations with the matching IdToken are returned
        },
        { model: IdTokenInfo, include: [{ model: IdToken, include: [AdditionalInfo] }] },
      ],
    };
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
    return { include };
  }

  private async _updateIdToken(value: IdTokenType, savedIdTokenId?: number) {
    const idTokenModel = IdToken.build(
      {
        id: undefined,
        ...value,
      },
      {
        include: [AdditionalInfo],
      },
    );
    let savedIdTokenModel: IdToken | undefined;
    if (savedIdTokenId) {
      savedIdTokenModel = (await this.s.models[IdToken.MODEL_NAME].findOne({
        where: { id: savedIdTokenId },
        include: [AdditionalInfo],
      })) as IdToken;
    }
    if (!savedIdTokenModel || savedIdTokenModel.idToken !== value.idToken || savedIdTokenModel.type !== value.type) {
      savedIdTokenModel = (await this.s.models[IdToken.MODEL_NAME].findOne({
        where: { idToken: value.idToken, type: value.type },
        include: [AdditionalInfo],
      })) as IdToken;
    }
    if (savedIdTokenModel) {
      // idToken.idToken and idToken.type should be treated as immutable.
      // Therefore, only update additionalInfo
      savedIdTokenModel.additionalInfo?.forEach((savedAdditionalInfo) => {
        // Remove additionalInfo not in value.additionalInfo
        if (!value?.additionalInfo?.some((valueAdditionalInfo) => valueAdditionalInfo.additionalIdToken === savedAdditionalInfo.additionalIdToken && valueAdditionalInfo.type === savedAdditionalInfo.type)) {
          (savedAdditionalInfo as AdditionalInfo).destroy();
        }
      });
      value.additionalInfo?.forEach((valueAdditionalInfo) => {
        // Create additionalInfo not in savedIdTokenModel.additionalInfo
        if (!savedIdTokenModel?.additionalInfo?.some((savedAdditionalInfo) => savedAdditionalInfo.additionalIdToken === valueAdditionalInfo.additionalIdToken && savedAdditionalInfo.type === valueAdditionalInfo.type)) {
          AdditionalInfo.build({
            idTokenId: savedIdTokenModel.id,
            ...valueAdditionalInfo,
          }).save();
        }
      });
      return await savedIdTokenModel.save();
    } else {
      return await idTokenModel.save();
    }
  }
}

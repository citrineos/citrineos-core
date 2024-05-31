// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SystemConfig, type AuthorizationData, type IdTokenType } from '@citrineos/base';
import { type BuildOptions, type Includeable } from 'sequelize';
import { type AuthorizationQuerystring, type IAuthorizationRepository, type AuthorizationRestrictions } from '../../../interfaces';
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

export class SequelizeAuthorizationRepository extends SequelizeRepository<Authorization> implements IAuthorizationRepository {
  idToken: CrudRepository<IdToken>;
  idTokenInfo: CrudRepository<IdTokenInfo>;
  additionalInfo: CrudRepository<AdditionalInfo>;

  constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, idToken?: CrudRepository<IdToken>, idTokenInfo?: CrudRepository<IdTokenInfo>, additionalInfo?: CrudRepository<AdditionalInfo>) {
    super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken ? idToken : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.idTokenInfo = idTokenInfo ? idTokenInfo : new SequelizeRepository<IdTokenInfo>(config, IdTokenInfo.MODEL_NAME, logger, sequelizeInstance);
    this.additionalInfo = additionalInfo ? additionalInfo : new SequelizeRepository<AdditionalInfo>(config, AdditionalInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateByQuery(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    if (value.idToken.idToken !== query.idToken || value.idToken.type !== query.type) {
      throw new Error('Authorization idToken does not match query');
    }

    const savedAuthorizationModel: Authorization | undefined = await this.readOnlyOneByQuery(query);
    const authorizationModel = savedAuthorizationModel ?? Authorization.build({}, this._createInclude(value));

    authorizationModel.idTokenId = (await this._updateIdToken(value.idToken, authorizationModel.idTokenId)).id;

    if (value.idTokenInfo) {
      const valueIdTokenInfo = IdTokenInfo.build({
        id: undefined,
        ...value.idTokenInfo,
      });
      if (authorizationModel.idTokenInfoId) {
        let savedIdTokenInfo = await this.idTokenInfo.readOnlyOneByQuery({
          where: { id: authorizationModel.idTokenInfoId },
          include: [{ model: IdToken, include: [AdditionalInfo] }],
        });
        if (!savedIdTokenInfo) {
          throw new Error(`IdTokenInfo for foreign key ${authorizationModel.idTokenInfoId} not found`);
        }
        Object.keys(valueIdTokenInfo.dataValues).forEach((k) => {
          const updatedValue = valueIdTokenInfo.getDataValue(k);
          if (updatedValue !== undefined) {
            // Null can still be used to remove data
            savedIdTokenInfo!.setDataValue(k, valueIdTokenInfo.getDataValue(k));
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
        savedIdTokenInfo = await this.idTokenInfo.create(savedIdTokenInfo);
      } else {
        if (value.idTokenInfo.groupIdToken) {
          const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken);
          valueIdTokenInfo.groupIdTokenId = savedGroupIdToken.id;
        }
        authorizationModel.idTokenInfoId = (await this.idTokenInfo.create(valueIdTokenInfo)).id;
      }
    } else if (authorizationModel.idTokenInfoId) {
      // Remove idTokenInfo
      authorizationModel.idTokenInfoId = undefined;
      authorizationModel.idTokenInfo = undefined;
    }
    return await this.create(authorizationModel);
  }

  async updateRestrictionsByQuery(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization[]> {
    return await this.updateAllByQuery(value, query);
  }

  async readAllByQuery(query: AuthorizationQuerystring): Promise<Authorization[]> {
    return await super.readAllByQuery(this._constructQuery(query));
  }

  async readOnlyOneByQuery(query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    return await super.readOnlyOneByQuery(this._constructQuery(query));
  }

  async existByQuery(query: AuthorizationQuerystring): Promise<number> {
    return await super.existByQuery(this._constructQuery(query));
  }

  async deleteAllByQuery(query: AuthorizationQuerystring): Promise<Authorization[]> {
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
      savedIdTokenModel = await this.idToken.readOnlyOneByQuery({
        where: { id: savedIdTokenId },
        include: [AdditionalInfo],
      });
    }
    if (!savedIdTokenModel || savedIdTokenModel.idToken !== value.idToken || savedIdTokenModel.type !== value.type) {
      savedIdTokenModel = await this.idToken.readOnlyOneByQuery({
        where: { idToken: value.idToken, type: value.type },
        include: [AdditionalInfo],
      });
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
          this.additionalInfo.create(
            AdditionalInfo.build({
              idTokenId: savedIdTokenModel.id,
              ...valueAdditionalInfo,
            }),
          );
        }
      });
      return await this.idToken.create(savedIdTokenModel);
    } else {
      return await this.idToken.create(idTokenModel);
    }
  }
}

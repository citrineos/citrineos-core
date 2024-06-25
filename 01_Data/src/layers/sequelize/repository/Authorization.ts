// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, SystemConfig, type AuthorizationData, type IdTokenType } from '@citrineos/base';
import { Op, type BuildOptions, type Includeable } from 'sequelize';
import { type AuthorizationQuerystring, type IAuthorizationRepository, type AuthorizationRestrictions } from '../../../interfaces';
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { IdTokenAdditionalInfo } from '../model/Authorization/IdTokenAdditionalInfo';

export class SequelizeAuthorizationRepository extends SequelizeRepository<Authorization> implements IAuthorizationRepository {
  idToken: CrudRepository<IdToken>;
  idTokenInfo: CrudRepository<IdTokenInfo>;
  additionalInfo: CrudRepository<AdditionalInfo>;
  idTokenAdditionalInfo: CrudRepository<IdTokenAdditionalInfo>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    idToken?: CrudRepository<IdToken>,
    idTokenInfo?: CrudRepository<IdTokenInfo>,
    additionalInfo?: CrudRepository<AdditionalInfo>,
    idTokenAdditionalInfo?: CrudRepository<IdTokenAdditionalInfo>,
  ) {
    super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken ? idToken : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.idTokenInfo = idTokenInfo ? idTokenInfo : new SequelizeRepository<IdTokenInfo>(config, IdTokenInfo.MODEL_NAME, logger, sequelizeInstance);
    this.additionalInfo = additionalInfo ? additionalInfo : new SequelizeRepository<AdditionalInfo>(config, AdditionalInfo.MODEL_NAME, logger, sequelizeInstance);
    this.idTokenAdditionalInfo = idTokenAdditionalInfo ? idTokenAdditionalInfo : new SequelizeRepository<IdTokenAdditionalInfo>(config, IdTokenAdditionalInfo.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateByQuerystring(value: AuthorizationData, query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    if (value.idToken.idToken !== query.idToken || value.idToken.type !== query.type) {
      throw new Error('Authorization idToken does not match query');
    }

    const savedAuthorizationModel: Authorization | undefined = await this.readOnlyOneByQuerystring(query);
    const authorizationModel = savedAuthorizationModel ?? Authorization.build({}, this._createInclude(value));

    authorizationModel.idTokenId = (await this._updateIdToken(value.idToken)).id;

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
            /* eslint-disable-next-line  @typescript-eslint/no-non-null-assertion */
            savedIdTokenInfo!.setDataValue(k, valueIdTokenInfo.getDataValue(k));
          }
        });
        if (value.idTokenInfo.groupIdToken) {
          const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken);
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

  async updateRestrictionsByQuerystring(value: AuthorizationRestrictions, query: AuthorizationQuerystring): Promise<Authorization[]> {
    return await this.updateAllByQuery(value, query);
  }

  async readAllByQuerystring(query: AuthorizationQuerystring): Promise<Authorization[]> {
    return await super.readAllByQuery(this._constructQuery(query));
  }

  async readOnlyOneByQuerystring(query: AuthorizationQuerystring): Promise<Authorization | undefined> {
    return await super.readOnlyOneByQuery(this._constructQuery(query));
  }

  async existByQuerystring(query: AuthorizationQuerystring): Promise<number> {
    return await super.existByQuery(this._constructQuery(query));
  }

  async deleteAllByQuerystring(query: AuthorizationQuerystring): Promise<Authorization[]> {
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

  private async _updateIdToken(value: IdTokenType): Promise<IdToken> {
    const savedIdTokenModel = (
      await this.idToken.readOrCreateByQuery({
        where: { idToken: value.idToken, type: value.type },
      })
    )[0];

    const additionalInfoIds: number[] = [];

    // Create any additionalInfos that don't exist,
    // and any relations between them and the IdToken that don't exist
    if (value.additionalInfo) {
      for (const valueAdditionalInfo of value.additionalInfo) {
        const savedAdditionalInfo = (
          await this.additionalInfo.readOrCreateByQuery({
            where: {
              additionalIdToken: valueAdditionalInfo.additionalIdToken,
              type: valueAdditionalInfo.type,
            },
          })
        )[0];
        await this.idTokenAdditionalInfo.readOrCreateByQuery({ where: { idTokenId: savedIdTokenModel.id, additionalInfoId: savedAdditionalInfo.id } });
        additionalInfoIds.push(savedAdditionalInfo.id);
      }
    }
    // Remove all associations between idToken and additionalInfo that no longer exist
    await this.idTokenAdditionalInfo.deleteAllByQuery({ where: { idTokenId: savedIdTokenModel.id, additionalInfoId: { [Op.notIn]: additionalInfoIds } } });

    return savedIdTokenModel.reload({ include: [AdditionalInfo] });
  }
}

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, OCPP2_0_1, SystemConfig } from '@citrineos/base';
import { type BuildOptions, type Includeable, Op, Transaction } from 'sequelize';
import { type AuthorizationQuerystring, type AuthorizationRestrictions, type IAuthorizationRepository } from '../../../interfaces';
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
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

  async createOrUpdateByQuerystring(value: OCPP2_0_1.AuthorizationData, query: AuthorizationQuerystring, transaction?: Transaction): Promise<Authorization | undefined> {
    if (value.idToken.idToken !== query.idToken || value.idToken.type !== query.type) {
      throw new Error('Authorization idToken does not match query');
    }

    const savedAuthorizationModel = await Authorization.findOne({
      include: [
        {
          model: IdToken,
          where: {
            idToken: query.idToken,
            type: query.type,
          },
        },
      ],
      transaction,
    });

    const authorizationModel = savedAuthorizationModel ?? Authorization.build({}, this._createInclude(value));

    const updatedIdToken = await this._updateIdToken(value.idToken, transaction);
    authorizationModel.idTokenId = updatedIdToken.id;

    if (value.idTokenInfo) {
      const valueIdTokenInfo = IdTokenInfo.build({
        ...value.idTokenInfo,
      });
      // Explicitly overwrite id with undefined to avoid mapping null onto the existing id in the for loop
      valueIdTokenInfo.id = valueIdTokenInfo.id ?? undefined;

      if (authorizationModel.idTokenInfoId) {
        const savedIdTokenInfo = await IdTokenInfo.findOne({
          where: { id: authorizationModel.idTokenInfoId },
          include: [{ model: IdToken, include: [AdditionalInfo] }],
          transaction,
        });

        if (!savedIdTokenInfo) {
          throw new Error(`IdTokenInfo for foreign key ${authorizationModel.idTokenInfoId} not found`);
        }

        Object.keys(valueIdTokenInfo.dataValues).forEach((k) => {
          const updatedValue = valueIdTokenInfo.getDataValue(k);
          if (updatedValue !== undefined) {
            // Null can still be used to remove data

            savedIdTokenInfo!.setDataValue(k, updatedValue);
          }
        });

        if (value.idTokenInfo.groupIdToken) {
          const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken, transaction);
          if (!savedIdTokenInfo.groupIdTokenId) {
            savedIdTokenInfo.groupIdTokenId = savedGroupIdToken.id;
          }
        } else if (savedIdTokenInfo.groupIdTokenId) {
          savedIdTokenInfo.groupIdTokenId = undefined;
          savedIdTokenInfo.groupIdToken = undefined;
        }
        await savedIdTokenInfo.save({ transaction });
      } else {
        if (value.idTokenInfo.groupIdToken) {
          const savedGroupIdToken = await this._updateIdToken(value.idTokenInfo.groupIdToken, transaction);
          valueIdTokenInfo.groupIdTokenId = savedGroupIdToken.id;
        }
        const createdIdTokenInfo = await valueIdTokenInfo.save({ transaction });
        authorizationModel.idTokenInfoId = createdIdTokenInfo.id;
      }
    } else if (authorizationModel.idTokenInfoId) {
      // Remove idTokenInfo
      authorizationModel.idTokenInfoId = undefined;
      authorizationModel.idTokenInfo = undefined;
    }

    return await authorizationModel.save({ transaction });
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

  private async _updateIdToken(value: OCPP2_0_1.IdTokenType, transaction?: Transaction): Promise<IdToken> {
    const [savedIdTokenModel] = await IdToken.findOrCreate({
      where: { idToken: value.idToken, type: value.type },
      transaction,
    });

    const additionalInfoIds: number[] = [];

    // Create any additionalInfos that don't exist,
    // and any relations between them and the IdToken that don't exist
    if (value.additionalInfo) {
      for (const valueAdditionalInfo of value.additionalInfo) {
        const [savedAdditionalInfo] = await AdditionalInfo.findOrCreate({
          where: {
            additionalIdToken: valueAdditionalInfo.additionalIdToken,
            type: valueAdditionalInfo.type,
          },
          transaction,
        });

        await IdTokenAdditionalInfo.findOrCreate({
          where: {
            idTokenId: savedIdTokenModel.id,
            additionalInfoId: savedAdditionalInfo.id,
          },
          transaction,
        });

        additionalInfoIds.push(savedAdditionalInfo.id);
      }
    }
    // Remove all associations between idToken and additionalInfo that no longer exist
    await IdTokenAdditionalInfo.destroy({
      where: {
        idTokenId: savedIdTokenModel.id,
        additionalInfoId: { [Op.notIn]: additionalInfoIds },
      },
      transaction,
    });

    return savedIdTokenModel.reload({ include: [AdditionalInfo], transaction });
  }

  private _constructQuery(queryParams: AuthorizationQuerystring): object {
    //1.6 doesn't have the concept of token type. But we need to support token type for 2.0.1 messages.
    // We ignore token type if it's explicitly set to null, as it's coming from a 1.6 message
    const idTokenWhere: any = {};
    if (queryParams.idToken) {
      // exact match
      idTokenWhere.idToken = queryParams.idToken;
      // or partial match:
      // idTokenWhere.idToken = { [Op.like]: `%${queryParams.idToken}%` };
    }

    // only include type if it's provided
    if (queryParams.type) {
      idTokenWhere.type = queryParams.type;
    }

    return {
      where: {},
      include: [
        {
          model: IdToken,
          where: idTokenWhere,
          required: true, // This ensures the inner join, so only Authorizations with the matching IdToken are returned
        },
        { model: IdTokenInfo, include: [{ model: IdToken, include: [AdditionalInfo] }] },
      ],
    };
  }

  private _createInclude(value: OCPP2_0_1.AuthorizationData): BuildOptions {
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
}

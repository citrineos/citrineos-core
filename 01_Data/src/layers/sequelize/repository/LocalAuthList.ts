// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CrudRepository, deepDirectionalEqual, OCPP2_0_1, BootstrapConfig } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { IAuthorizationRepository, ILocalAuthListRepository } from '../../../interfaces';
import {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
} from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { LocalListVersionAuthorization } from '../model/Authorization/LocalListVersionAuthorization';
import { SendLocalListAuthorization } from '../model/Authorization/SendLocalListAuthorization';
import { SequelizeAuthorizationRepository } from './Authorization';
import { AuthorizationMapper } from '../mapper/2.0.1';

export class SequelizeLocalAuthListRepository
  extends SequelizeRepository<LocalListVersion>
  implements ILocalAuthListRepository
{
  authorization: IAuthorizationRepository;
  localListAuthorization: CrudRepository<LocalListAuthorization>;
  sendLocalList: CrudRepository<SendLocalList>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    authorization?: IAuthorizationRepository,
    localListAuthorization?: CrudRepository<LocalListAuthorization>,
    sendLocalList?: CrudRepository<SendLocalList>,
  ) {
    super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
    this.authorization = authorization
      ? authorization
      : new SequelizeAuthorizationRepository(config, logger);
    this.localListAuthorization = localListAuthorization
      ? localListAuthorization
      : new SequelizeRepository<LocalListAuthorization>(
          config,
          LocalListAuthorization.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.sendLocalList = sendLocalList
      ? sendLocalList
      : new SequelizeRepository<SendLocalList>(
          config,
          SendLocalList.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
  }

  async createSendLocalListFromRequestData(
    tenantId: number,
    stationId: string,
    correlationId: string,
    updateType: OCPP2_0_1.UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_0_1.AuthorizationData[],
  ): Promise<SendLocalList> {
    const sendLocalList = await this.sendLocalList.create(
      tenantId,
      SendLocalList.build({
        tenantId,
        stationId,
        correlationId,
        versionNumber,
        updateType,
      }),
    );
    for (const authData of localAuthorizationList ?? []) {
      const auth = await Authorization.findOne({
        where: {
          idToken: authData.idToken.idToken,
          idTokenType: authData.idToken.type,
        },
      });
      if (!auth) {
        throw new Error(
          `Authorization not found for ${JSON.stringify(authData)}, invalid SendLocalListRequest (create necessary Authorizations first)`,
        );
      }
      if (
        authData.idToken.idToken !== auth.idToken ||
        (auth.idTokenType &&
          authData.idToken.type !== AuthorizationMapper.toIdTokenEnumType(auth.idTokenType))
      ) {
        throw new Error(
          `Authorization idToken in SendLocalListRequest ${JSON.stringify(authData.idToken)} does not match idToken in database { idToken: ${auth.idToken}, idTokenType: ${auth.idTokenType} } (update the idToken first)`,
        );
      }
      // If groupAuthorizationId is present, compare its id to groupAuthorizationId
      if (authData.idTokenInfo?.groupIdToken) {
        let groupAuthorizationAuthId: number | undefined;
        // Only perform groupAuthorizationId check if groupIdToken is an object with idToken and type
        if (
          authData.idTokenInfo?.groupIdToken &&
          typeof authData.idTokenInfo.groupIdToken === 'object' &&
          'idToken' in authData.idTokenInfo.groupIdToken &&
          'type' in authData.idTokenInfo.groupIdToken
        ) {
          const groupAuth = await Authorization.findOne({
            where: {
              idToken: authData.idTokenInfo.groupIdToken.idToken,
              idTokenType: authData.idTokenInfo.groupIdToken.type,
            },
          });
          const groupAuthorizationAuthId = groupAuth?.id;
          if (
            !auth.groupAuthorizationId ||
            groupAuthorizationAuthId !== auth.groupAuthorizationId
          ) {
            throw new Error(
              `Authorization groupIdToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match groupAuthorizationId in database ${JSON.stringify(auth.groupAuthorizationId)} (update the groupAuthorization first)`,
            );
          }
        } else if (typeof authData.idTokenInfo.groupIdToken === 'number') {
          groupAuthorizationAuthId = authData.idTokenInfo.groupIdToken;
        }
        if (!auth.groupAuthorizationId || groupAuthorizationAuthId !== auth.groupAuthorizationId) {
          throw new Error(
            `Authorization groupIdToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match groupAuthorizationId in database ${JSON.stringify(auth.groupAuthorizationId)} (update the groupAuthorization first)`,
          );
        }
      }
      // No longer create IdTokenInfo, just use Authorization fields
      const { id, ...authorizationFields } = auth;
      const localListAuthorization = await this.localListAuthorization.create(
        tenantId,
        LocalListAuthorization.build({
          ...authorizationFields,
          authorizationId: id,
        }),
      );
      await SendLocalListAuthorization.create({
        tenantId,
        sendLocalListId: sendLocalList.id,
        authorizationId: localListAuthorization.id,
      });
    }

    await sendLocalList.reload({ include: [LocalListAuthorization] });

    this.sendLocalList.emit('created', [sendLocalList]);

    return sendLocalList;
  }

  async validateOrReplaceLocalListVersionForStation(
    tenantId: number,
    versionNumber: number,
    stationId: string,
  ): Promise<void> {
    await this.s.transaction(async (transaction) => {
      const localListVersion = await LocalListVersion.findOne({
        where: { stationId },
        transaction,
      });
      if (localListVersion && localListVersion.versionNumber === versionNumber) {
        return;
      }
      if (localListVersion && localListVersion.versionNumber !== versionNumber) {
        // Remove associations
        await LocalListVersionAuthorization.destroy({
          where: { localListVersionId: localListVersion.id },
          transaction,
        });
      }
      if (!localListVersion) {
        const newLocalListVersion = await LocalListVersion.create(
          { tenantId, stationId, versionNumber },
          { transaction },
        );
        this.emit('created', [newLocalListVersion]);
      } else {
        await localListVersion.update({ versionNumber }, { transaction });
        this.emit('updated', [localListVersion]);
      }
    });
  }

  async getSendLocalListRequestByStationIdAndCorrelationId(
    tenantId: number,
    stationId: string,
    correlationId: string,
  ): Promise<SendLocalList | undefined> {
    return this.sendLocalList.readOnlyOneByQuery(tenantId, { where: { stationId, correlationId } });
  }

  async createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    stationId: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    switch (sendLocalList.updateType) {
      case OCPP2_0_1.UpdateEnumType.Full:
        return this.replaceLocalListVersionFromStationIdAndSendLocalList(
          tenantId,
          stationId,
          sendLocalList,
        );
      case OCPP2_0_1.UpdateEnumType.Differential:
        return this.updateLocalListVersionFromStationIdAndSendLocalListRequest(
          tenantId,
          stationId,
          sendLocalList,
        );
    }
  }

  private async replaceLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    stationId: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    const localListVersion = await this.s.transaction(async (transaction) => {
      const oldLocalListVersion = await LocalListVersion.findOne({
        where: { stationId },
        include: [LocalListAuthorization],
        transaction,
      });
      if (oldLocalListVersion) {
        // Remove associations
        await LocalListVersionAuthorization.destroy({
          where: { localListVersionId: oldLocalListVersion.id },
          transaction,
        });
        // Destroy old version
        await LocalListVersion.destroy({ where: { stationId }, transaction });
      }

      const localListVersion = await LocalListVersion.create(
        {
          tenantId,
          stationId,
          versionNumber: sendLocalList.versionNumber,
        },
        { transaction },
      );

      if (!sendLocalList.localAuthorizationList) {
        return localListVersion;
      }

      for (const auth of sendLocalList.localAuthorizationList) {
        await LocalListVersionAuthorization.create(
          {
            tenantId,
            localListVersionId: localListVersion.id,
            authorizationId: auth.id,
          },
          { transaction },
        );
      }

      return localListVersion.reload({ include: [LocalListAuthorization], transaction });
    });

    this.emit('created', [localListVersion]);

    return localListVersion;
  }

  private async updateLocalListVersionFromStationIdAndSendLocalListRequest(
    tenantId: number,
    stationId: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    const localListVersion = await this.s.transaction(async (transaction) => {
      if (!sendLocalList.localAuthorizationList) {
        // See D01.FR.05
        const localListVersion = await this._updateAllByQuery(
          tenantId,
          { versionNumber: sendLocalList.versionNumber },
          { where: { stationId }, transaction },
        );
        if (localListVersion.length !== 1) {
          throw new Error(
            `LocalListVersion not found for ${stationId} during differential version update: ${JSON.stringify(localListVersion)}`,
          );
        } else {
          return localListVersion[0];
        }
      }

      const localListVersion = await LocalListVersion.findOne({
        where: { stationId },
        include: [LocalListAuthorization],
        transaction,
      });

      if (!localListVersion) {
        throw new Error(`LocalListVersion not found for ${stationId} during differential update`);
      }

      for (const sendAuth of sendLocalList.localAuthorizationList) {
        // If there is already an association with the same authorizationId, remove it
        const oldAuth = localListVersion.localAuthorizationList?.find(
          (localAuth) => localAuth.authorizationId === sendAuth.authorizationId,
        );
        if (oldAuth) {
          await LocalListVersionAuthorization.destroy({
            where: {
              localListVersionId: localListVersion.id,
              authorizationId: oldAuth.authorizationId,
            },
            transaction,
          });
        }
        await LocalListVersionAuthorization.create(
          {
            tenantId,
            localListVersionId: localListVersion.id,
            authorizationId: sendAuth.id,
          },
          { transaction },
        );
      }

      await localListVersion.update(
        { versionNumber: sendLocalList.versionNumber },
        { transaction },
      );

      return localListVersion.reload({ include: [LocalListAuthorization], transaction });
    });

    this.emit('updated', [localListVersion]);

    return localListVersion;
  }
}

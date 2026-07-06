// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CrudRepository, OCPP1_6, OCPP2_0_1 } from '@citrineos/base';
import type {
  IAuthorizationRepository,
  ILocalAuthListRepository,
} from '../../../interfaces/repositories.js';
import { AuthorizationMapper } from '../mapper/2.0.1/AuthorizationMapper.js';
import { LocalAuthListMapper } from '../mapper/1.6/LocalAuthListMapper.js';
import { Authorization } from '../model/Authorization/Authorization.js';
import { LocalListAuthorization } from '../model/Authorization/LocalListAuthorization.js';
import { LocalListVersion } from '../model/Authorization/LocalListVersion.js';
import { LocalListVersionAuthorization } from '../model/Authorization/LocalListVersionAuthorization.js';
import { SendLocalList } from '../model/Authorization/SendLocalList.js';
import { SendLocalListAuthorization } from '../model/Authorization/SendLocalListAuthorization.js';
import { SequelizeAuthorizationRepository } from './Authorization.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeLocalAuthListRepository
  extends SequelizeRepository<LocalListVersion>
  implements ILocalAuthListRepository
{
  authorization: IAuthorizationRepository;
  localListAuthorization: CrudRepository<LocalListAuthorization>;
  sendLocalList: CrudRepository<SendLocalList>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    // The repo's primary model is LocalListVersion, matching the
    // ILocalAuthListRepository<LocalListVersion> contract: the inherited CRUD
    // queries operate on LocalListVersion and resolve associations such as
    // LocalListAuthorization through it.
    super({ config, namespace: LocalListVersion.MODEL_NAME, logger, sequelizeInstance });
    this.authorization = new SequelizeAuthorizationRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.localListAuthorization = new SequelizeRepository<LocalListAuthorization>({
      config,
      namespace: LocalListAuthorization.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.sendLocalList = new SequelizeRepository<SendLocalList>({
      config,
      namespace: SendLocalList.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async createSendLocalListFromRequestData(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
    updateType: OCPP2_0_1.UpdateEnumType,
    versionNumber: number,
    localAuthorizationList?: OCPP2_0_1.AuthorizationData[],
  ): Promise<SendLocalList> {
    const sendLocalList = await this.sendLocalList.create(
      tenantId,
      SendLocalList.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        correlationId,
        versionNumber,
        updateType,
      }),
    );
    for (const authData of localAuthorizationList ?? []) {
      const auth = await Authorization.findOne({
        where: {
          idToken: authData.idToken.idToken,
          idTokenType: AuthorizationMapper.fromIdTokenEnumType(authData.idToken.type),
        },
      });
      if (!auth) {
        throw new Error(
          `Authorization not found for ${JSON.stringify(authData)}, invalid SendLocalListRequest (create necessary Authorizations first)`,
        );
      }
      // If groupAuthorizationId is present, compare its id to groupAuthorizationId
      if (authData.idTokenInfo?.groupIdToken) {
        const groupAuth = await Authorization.findOne({
          where: {
            idToken: authData.idTokenInfo.groupIdToken.idToken,
            idTokenType: AuthorizationMapper.fromIdTokenEnumType(
              authData.idTokenInfo.groupIdToken.type,
            ),
          },
        });
        const groupAuthorizationAuthId = groupAuth?.id;
        if (!auth.groupAuthorizationId || groupAuthorizationAuthId !== auth.groupAuthorizationId) {
          throw new Error(
            `Authorization groupIdToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match groupAuthorizationId in database ${JSON.stringify(auth.groupAuthorizationId)} (update the groupAuthorization first)`,
          );
        }
        if (!auth.groupAuthorizationId || groupAuthorizationAuthId !== auth.groupAuthorizationId) {
          throw new Error(
            `Authorization groupIdToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match groupAuthorizationId in database ${JSON.stringify(auth.groupAuthorizationId)} (update the groupAuthorization first)`,
          );
        }
      }
      const localListAuthorization = await this.localListAuthorization.create(
        tenantId,
        LocalListAuthorization.build({
          authorizationId: auth.id,
          idToken: auth.idToken,
          idTokenType: auth.idTokenType,
          status: auth.status,
          allowedConnectorTypes: auth.allowedConnectorTypes,
          disallowedEvseIdPrefixes: auth.disallowedEvseIdPrefixes,
          additionalInfo: auth.additionalInfo,
          cacheExpiryDateTime: auth.cacheExpiryDateTime,
          chargingPriority: auth.chargingPriority,
          language1: auth.language1,
          language2: auth.language2,
          personalMessage: auth.personalMessage,
          groupAuthorizationId: auth.groupAuthorizationId,
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

  async createSendLocalListFromRequestData16(
    tenantId: number,
    stationId: string,
    correlationId: string,
    updateType: OCPP1_6.SendLocalListRequestUpdateType,
    versionNumber: number,
    localAuthorizationList?: NonNullable<OCPP1_6.SendLocalListRequest['localAuthorizationList']>,
  ): Promise<SendLocalList> {
    const sendLocalList = await this.sendLocalList.create(
      tenantId,
      SendLocalList.build({
        tenantId,
        ocppConnectionName: stationId,
        correlationId,
        versionNumber,
        // The SendLocalList.updateType column is a plain string. Both 1.6 and 2.0.1
        // use the values 'Full' and 'Differential', so coercion across enums is safe.
        updateType: updateType as unknown as OCPP2_0_1.UpdateEnumType,
      }),
    );

    for (const authData of localAuthorizationList ?? []) {
      if (!authData.idTag) {
        continue;
      }

      // For DIFFERENTIAL deletes the spec allows entries with no idTagInfo.
      // These are recorded as tombstones (status Invalid) so the response handler
      // can drop the matching authorization from LocalListVersion.
      const isDelete =
        updateType === OCPP1_6.SendLocalListRequestUpdateType.Differential && !authData.idTagInfo;

      const auth = await Authorization.findOne({
        where: { idToken: authData.idTag },
      });

      if (!auth && !isDelete) {
        throw new Error(
          `Authorization not found for idTag '${authData.idTag}' (create the Authorization before adding it to a local auth list)`,
        );
      }

      let groupAuthorizationId: number | undefined;
      if (authData.idTagInfo?.parentIdTag) {
        const parent = await Authorization.findOne({
          where: { idToken: authData.idTagInfo.parentIdTag },
        });
        if (!parent) {
          throw new Error(
            `Parent authorization not found for parentIdTag '${authData.idTagInfo.parentIdTag}'`,
          );
        }
        groupAuthorizationId = parent.id;
      }

      const baseFields = auth
        ? (() => {
            const { id: _id, ...rest } = auth;
            return rest;
          })()
        : {
            idToken: authData.idTag,
            idTokenType: null,
          };

      const localListAuthorization = await this.localListAuthorization.create(
        tenantId,
        LocalListAuthorization.build({
          ...baseFields,
          idToken: authData.idTag,
          idTokenType: null,
          status: isDelete
            ? 'Invalid'
            : LocalAuthListMapper.fromIdTagStatus(
                authData.idTagInfo?.status ?? OCPP1_6.SendLocalListRequestStatus.Accepted,
              ),
          cacheExpiryDateTime: authData.idTagInfo?.expiryDate ?? null,
          groupAuthorizationId: groupAuthorizationId ?? null,
          authorizationId: auth?.id,
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
    ocppConnectionName: string,
  ): Promise<void> {
    await this.s.transaction(async (transaction) => {
      const localListVersion = await LocalListVersion.findOne({
        where: { ocppConnectionName: ocppConnectionName },
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
          { tenantId, ocppConnectionName: ocppConnectionName, versionNumber },
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
    ocppConnectionName: string,
    correlationId: string,
  ): Promise<SendLocalList | undefined> {
    // Eager-load the LocalListAuthorization rows that the SendLocalList row was
    // created with. The Accept-path of replaceLocalListVersion / updateLocal-
    // ListVersion iterates sendLocalList.localAuthorizationList to populate the
    // LocalListVersionAuthorization junction; without the include the relation
    // is undefined and both paths early-return, so the new LocalListVersion is
    // saved with zero entries and the UI shows an empty list after Accept.
    return this.sendLocalList.readOnlyOneByQuery(tenantId, {
      where: { ocppConnectionName: ocppConnectionName, correlationId },
      include: [LocalListAuthorization],
    });
  }

  async createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    switch (sendLocalList.updateType) {
      case OCPP2_0_1.UpdateEnumType.Full:
        return this.replaceLocalListVersionFromStationIdAndSendLocalList(
          tenantId,
          ocppConnectionName,
          sendLocalList,
        );
      case OCPP2_0_1.UpdateEnumType.Differential:
        return this.updateLocalListVersionFromStationIdAndSendLocalListRequest(
          tenantId,
          ocppConnectionName,
          sendLocalList,
        );
    }
  }

  private async replaceLocalListVersionFromStationIdAndSendLocalList(
    tenantId: number,
    ocppConnectionName: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    const localListVersion = await this.s.transaction(async (transaction) => {
      const oldLocalListVersion = await LocalListVersion.findOne({
        where: { ocppConnectionName: ocppConnectionName },
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
        await LocalListVersion.destroy({
          where: { ocppConnectionName: ocppConnectionName },
          transaction,
        });
      }

      const localListVersion = await LocalListVersion.create(
        {
          tenantId,
          ocppConnectionName: ocppConnectionName,
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
    ocppConnectionName: string,
    sendLocalList: SendLocalList,
  ): Promise<LocalListVersion> {
    const localListVersion = await this.s.transaction(async (transaction) => {
      if (!sendLocalList.localAuthorizationList) {
        // See D01.FR.05
        const localListVersion = await this._updateAllByQuery(
          tenantId,
          { versionNumber: sendLocalList.versionNumber },
          { where: { ocppConnectionName: ocppConnectionName }, transaction },
        );
        if (localListVersion.length !== 1) {
          throw new Error(
            `LocalListVersion not found for ${ocppConnectionName} during differential version update: ${JSON.stringify(localListVersion)}`,
          );
        } else {
          return localListVersion[0];
        }
      }

      const localListVersion = await LocalListVersion.findOne({
        where: { ocppConnectionName: ocppConnectionName },
        include: [LocalListAuthorization],
        transaction,
      });

      if (!localListVersion) {
        throw new Error(
          `LocalListVersion not found for ${ocppConnectionName} during differential update`,
        );
      }

      for (const sendAuth of sendLocalList.localAuthorizationList) {
        // 1.6 differential delete: tombstone rows have no linked Authorization and status 'Invalid'.
        // Drop existing entries on the version that match the tombstone's idToken and skip insertion.
        const isTombstone = !sendAuth.authorizationId && sendAuth.status === 'Invalid';

        const matches =
          localListVersion.localAuthorizationList?.filter((localAuth) =>
            isTombstone
              ? localAuth.idToken === sendAuth.idToken
              : localAuth.authorizationId === sendAuth.authorizationId,
          ) ?? [];

        for (const oldAuth of matches) {
          await LocalListVersionAuthorization.destroy({
            where: {
              localListVersionId: localListVersion.id,
              authorizationId: oldAuth.id,
            },
            transaction,
          });
        }

        if (isTombstone) {
          continue;
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

export default SequelizeLocalAuthListRepository;

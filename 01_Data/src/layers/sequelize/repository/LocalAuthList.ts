// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AuthorizationData, CrudRepository, deepDirectionalEqual, SendLocalListRequest, SystemConfig, UpdateEnumType } from "@citrineos/base";
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from "tslog";
import { IAuthorizationRepository, ILocalAuthListRepository } from "../../../interfaces";
import { Authorization, IdToken, IdTokenInfo } from "../model/Authorization";
import { LocalListVersion } from "../model/Authorization/LocalListVersion";
import { SendLocalList } from "../model/Authorization/SendLocalList";
import { SequelizeRepository } from "./Base";
import { LocalListVersionAuthorization } from "../model/Authorization/LocalListVersionAuthorization";
import { LocalListAuthorization } from "../model/Authorization/LocalListAuthorization";

import { v4 as uuidv4 } from 'uuid';
import { SendLocalListAuthorization } from "../model/Authorization/SendLocalListAuthorization";
import { SequelizeAuthorizationRepository } from "./Authorization";

export class SequelizeLocalAuthListRepository extends SequelizeRepository<LocalListVersion> implements ILocalAuthListRepository {
    authorization: IAuthorizationRepository;
    localListAuthorization: CrudRepository<LocalListAuthorization>;
    sendLocalList: CrudRepository<SendLocalList>;

    constructor(
        config: SystemConfig,
        logger?: Logger<ILogObj>,
        sequelizeInstance?: Sequelize,
        authorization?: IAuthorizationRepository,
        localListAuthorization?: CrudRepository<LocalListAuthorization>,
        sendLocalList?: CrudRepository<SendLocalList>,
    ) {
        super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
        this.authorization = authorization ? authorization : new SequelizeAuthorizationRepository(config, logger)
        this.localListAuthorization = localListAuthorization ? localListAuthorization : new SequelizeRepository<LocalListAuthorization>(config, LocalListAuthorization.MODEL_NAME, logger, sequelizeInstance);
        this.sendLocalList = sendLocalList ? sendLocalList : new SequelizeRepository<SendLocalList>(config, SendLocalList.MODEL_NAME, logger, sequelizeInstance);
    }

    async createSendLocalListFromStationIdAndRequest(stationId: string, sendLocalListRequest: SendLocalListRequest): Promise<SendLocalList> {
        return this.createSendLocalList(stationId, sendLocalListRequest.updateType, sendLocalListRequest.versionNumber, sendLocalListRequest.localAuthorizationList ?? undefined);
    }

    async createSendLocalList(stationId: string, updateType: UpdateEnumType, versionNumber?: number, localAuthorizationList?: AuthorizationData[]): Promise<SendLocalList> {
        if (versionNumber) {
            if (versionNumber <= 0) {
                throw new Error(`Version number ${versionNumber} must be greater than 0, see D01.FR.18`)
            }
            const localListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization] });
            if (localListVersion && localListVersion.versionNumber >= versionNumber) {
                throw new Error(`Current LocalListVersion for ${stationId} is ${localListVersion.versionNumber}, cannot send LocalListVersion ${versionNumber} (version number must be higher)`);
            }
        } else {
            versionNumber = await this.getNextVersionNumberForStation(stationId);
        }
        if (localAuthorizationList && localAuthorizationList.length > 1) { // Check for duplicate authorizations
            const idTokens = localAuthorizationList.map(auth => auth.idToken.idToken + auth.idToken.type);
            if (new Set(idTokens).size !== idTokens.length) {
                throw new Error(`Duplicated idToken in SendLocalListRequest ${JSON.stringify(idTokens)}`);
            }
        }
        const sendLocalList = await SendLocalList.create({
            stationId,
            correlationId: uuidv4(),
            versionNumber,
            updateType,
        });
        localAuthorizationList?.map(async (authData) => {
            const auth = await Authorization.findOne({
                include: [
                    {
                        model: IdToken,
                        where: {
                            idToken: authData.idToken.idToken,
                            type: authData.idToken.type,
                        },
                    },
                    {
                        model: IdTokenInfo,
                        include: [IdToken],
                    },
                ],
            });
            if (!auth) {
                throw new Error(`Authorization not found for ${JSON.stringify(authData)}, invalid SendLocalListRequest (create necessary Authorizations first)`);
            }
            if (!deepDirectionalEqual(authData.idToken, auth.idToken)) {
                throw new Error(`Authorization idToken in SendLocalListRequest ${JSON.stringify(authData.idToken)} does not match idToken in database ${JSON.stringify(auth.idToken)} (update the idToken first)`);
            }
            if (authData.idTokenInfo?.groupIdToken && (!auth.idTokenInfo?.groupIdToken || !deepDirectionalEqual(authData.idTokenInfo.groupIdToken, auth.idTokenInfo.groupIdToken))) {
                throw new Error(`Authorization group idToken in SendLocalListRequest ${JSON.stringify(authData.idTokenInfo.groupIdToken)} does not match group idToken in database ${JSON.stringify(auth.idTokenInfo?.groupIdToken)} (update the group idToken first)`)
            }
            // While new IdTokens will NOT be created or newly associated via message api, idTokenInfo can be allowed to be unique for the local auth list
            const localListAuthIdTokenInfo = await IdTokenInfo.create({
                ...authData.idTokenInfo,
                groupIdTokenId: auth.idTokenInfo?.groupIdTokenId,
            });

            const { id, idTokenInfoId, idTokenInfo, ...authorizationFields } = auth;
            const localListAuthorization = await this.localListAuthorization.create(LocalListAuthorization.build({
                ...authorizationFields,
                idTokenInfoId: localListAuthIdTokenInfo.id,
                authorizationId: id,
            }));
            await SendLocalListAuthorization.create({
                sendLocalListId: sendLocalList.id,
                authorizationId: localListAuthorization.id
            });
        });

        await sendLocalList.reload({ include: [LocalListAuthorization] });

        this.sendLocalList.emit('created', [sendLocalList]);

        return sendLocalList;
    }

    async countUpdatedAuthListFromStationIdAndCorrelationId(stationId: string, correlationId: string): Promise<number> {
        const sendLocalList = await this.sendLocalList.readOnlyOneByQuery({ where: { stationId, correlationId } });
        switch (sendLocalList?.updateType) {
            case UpdateEnumType.Full:
                return sendLocalList?.localAuthorizationList?.length ?? 0;
            case UpdateEnumType.Differential:
                const localListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization] });
                const uniqueAuths = new Set(
                    [...(sendLocalList.localAuthorizationList ?? []), ...(localListVersion?.localAuthorizationList ?? [])]
                        .map(auth => auth.authorizationId)
                );
                return uniqueAuths.size;
            default:
                throw new Error(`Unknown update type ${sendLocalList?.updateType}`);
        }
    }

    async validateOrReplaceLocalListVersionForStation(versionNumber: number, stationId: string): Promise<void> {
        await this.s.transaction(async (transaction) => {
            const localListVersion = await LocalListVersion.findOne({ where: { stationId }, transaction });
            if (localListVersion && localListVersion.versionNumber === versionNumber) {
                return;
            }
            if (localListVersion && localListVersion.versionNumber !== versionNumber) {
                // Remove associations
                await LocalListVersionAuthorization.destroy({ where: { localListVersionId: localListVersion.id }, transaction });
                // Destroy old version
                await LocalListVersion.destroy({ where: { stationId }, transaction });
            }

            await LocalListVersion.create({ stationId, versionNumber }, { transaction });
        });
    }

    async getNextVersionNumberForStation(stationId: string): Promise<number> {
        const localListVersion = await this.readOnlyOneByQuery({ where: { stationId } });
        return localListVersion ? localListVersion.versionNumber + 1 : 1;
    }

    async getSendLocalListRequestByStationIdAndCorrelationId(stationId: string, correlationId: string): Promise<SendLocalList | undefined> {
        return this.sendLocalList.readOnlyOneByQuery({ where: { stationId, correlationId } });
    }

    async createOrUpdateLocalListVersionFromStationIdAndSendLocalList(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        switch (sendLocalList.updateType) {
            case UpdateEnumType.Full:
                return this.replaceLocalListVersionFromStationIdAndSendLocalList(stationId, sendLocalList);
            case UpdateEnumType.Differential:
                return this.updateLocalListVersionFromStationIdAndSendLocalListRequest(stationId, sendLocalList);
        }
    }

    async replaceLocalListVersionFromStationIdAndSendLocalList(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        const localListVersion = await this.s.transaction(async (transaction) => {
            const oldLocalListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization], transaction });
            if (oldLocalListVersion) {
                // Remove associations
                await LocalListVersionAuthorization.destroy({ where: { localListVersionId: oldLocalListVersion.id }, transaction });
                // Destroy old version
                await LocalListVersion.destroy({ where: { stationId }, transaction });
            }

            const localListVersion = await LocalListVersion.create({
                stationId,
                versionNumber: sendLocalList.versionNumber
            }, { transaction });

            if (!sendLocalList.localAuthorizationList) {
                return localListVersion;
            }

            for (const auth of sendLocalList.localAuthorizationList) {
                await LocalListVersionAuthorization.create({
                    localListVersionId: localListVersion.id,
                    authorizationId: auth.id
                }, { transaction });
            }

            return localListVersion.reload({ include: [LocalListAuthorization], transaction });
        });

        this.emit('created', [localListVersion]);

        return localListVersion;
    }

    async updateLocalListVersionFromStationIdAndSendLocalListRequest(stationId: string, sendLocalList: SendLocalList): Promise<LocalListVersion> {
        const localListVersion = await this.s.transaction(async (transaction) => {
            if (!sendLocalList.localAuthorizationList) {
                // See D01.FR.05
                const localListVersion = await this._updateAllByQuery({ versionNumber: sendLocalList.versionNumber }, { where: { stationId }, transaction });
                if (localListVersion.length !== 1) {
                    throw new Error(`LocalListVersion not found for ${stationId} during differential version update: ${JSON.stringify(localListVersion)}`);
                } else {
                    return localListVersion[0];
                }
            }

            const localListVersion = await LocalListVersion.findOne({ where: { stationId }, include: [LocalListAuthorization], transaction });

            if (!localListVersion) {
                throw new Error(`LocalListVersion not found for ${stationId} during differential update`);
            }

            for (const sendAuth of sendLocalList.localAuthorizationList) {
                // If there is already an association with the same authorizationId, remove it
                const oldAuth = localListVersion.localAuthorizationList?.find(localAuth => localAuth.authorizationId === sendAuth.authorizationId);
                if (oldAuth) {
                    await LocalListVersionAuthorization.destroy({ where: { localListVersionId: localListVersion.id, authorizationId: oldAuth.authorizationId }, transaction });
                }
                await LocalListVersionAuthorization.create({
                    localListVersionId: localListVersion.id,
                    authorizationId: sendAuth.id
                }, { transaction });
            }

            await localListVersion.update({ versionNumber: sendLocalList.versionNumber }, { transaction });

            return localListVersion.reload({ include: [LocalListAuthorization], transaction });
        });

        this.emit('updated', [localListVersion]);

        return localListVersion;
    }
}
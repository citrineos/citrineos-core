// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { MeterValueDto, OCPP2_request_types } from '@citrineos/base';
import {
  ChargingStationSequenceTypeEnum,
  CrudRepository,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
} from '@citrineos/base';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import type {
  IChargingStationSequenceRepository,
  ITransactionEventRepository,
} from '../../../interfaces/repositories.js';
import { MeterValueMapper } from '../mapper/2/MeterValueMapper.js';
import { Authorization } from '../model/Authorization/Authorization.js';
import { EvseType } from '../model/DeviceModel/EvseType.js';
import { ChargingStation } from '../model/Location/ChargingStation.js';
import { Connector } from '../model/Location/Connector.js';
import { Evse } from '../model/Location/Evse.js';
import { Tariff } from '../model/Tariff/Tariffs.js';
import { MeterValue } from '../model/TransactionEvent/MeterValue.js';
import { StartTransaction } from '../model/TransactionEvent/StartTransaction.js';
import { StopTransaction } from '../model/TransactionEvent/StopTransaction.js';
import { Transaction } from '../model/TransactionEvent/Transaction.js';
import { TransactionEvent } from '../model/TransactionEvent/TransactionEvent.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { SequelizeChargingStationSequenceRepository } from './ChargingStationSequence.js';

export class SequelizeTransactionEventRepository
  extends SequelizeRepository<TransactionEvent>
  implements ITransactionEventRepository
{
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  station: CrudRepository<ChargingStation>;
  meterValue: CrudRepository<MeterValue>;
  startTransaction: CrudRepository<StartTransaction>;
  stopTransaction: CrudRepository<StopTransaction>;
  connector: CrudRepository<Connector>;
  chargingStationSequence: IChargingStationSequenceRepository;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: TransactionEvent.MODEL_NAME, logger, sequelizeInstance });
    this.transaction = new SequelizeRepository<Transaction>({
      config,
      namespace: Transaction.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.evse = new SequelizeRepository<Evse>({
      config,
      namespace: Evse.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.station = new SequelizeRepository<ChargingStation>({
      config,
      namespace: ChargingStation.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.meterValue = new SequelizeRepository<MeterValue>({
      config,
      namespace: MeterValue.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.startTransaction = new SequelizeRepository<StartTransaction>({
      config,
      namespace: StartTransaction.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.stopTransaction = new SequelizeRepository<StopTransaction>({
      config,
      namespace: StopTransaction.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.connector = new SequelizeRepository<Connector>({
      config,
      namespace: Connector.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.chargingStationSequence = new SequelizeChargingStationSequenceRepository({
      config,
      logger,
      sequelizeInstance,
    });
  }

  /**
   * @param tenantId tenantId
   * @param value TransactionEventRequest received from charging station. Will be used to create TransactionEvent,
   * MeterValues, and either create or update Transaction. IdTokens (and associated AdditionalInfo) and EVSEs are
   * assumed to already exist and will not be created as part of this call.
   *
   * @param ocppConnectionName - The connection name of the charging station
   *
   * @returns Saved TransactionEvent
   */
  async createOrUpdateTransactionByTransactionEventAndStationId(
    tenantId: number,
    value: OCPP2_request_types.TransactionEventRequest,
    ocppConnectionName: string,
  ): Promise<Transaction> {
    // In OCPP 2.1, transactionEventRequest contains tariffId
    const infoTariffId = (value.transactionInfo as { tariffId?: string | null }).tariffId;
    return await this.s.transaction(async (sequelizeTransaction) => {
      let finalTransaction: Transaction;
      let created = false;
      const existingTransaction = await this.transaction.readOnlyOneByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          transactionId: value.transactionInfo.transactionId,
        },
        transaction: sequelizeTransaction,
      });

      if (existingTransaction) {
        let evseId = existingTransaction.evseId;
        if (!evseId && value.evse) {
          const [evse] = await this.evse.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              ocppConnectionName: ocppConnectionName,
              evseTypeId: value.evse.id,
            },
          });
          evseId = evse.id;
        }
        let connectorId = existingTransaction.connectorId;
        let tariffId = existingTransaction.tariffId;
        if (!connectorId && value.evse?.connectorId) {
          const [evse] = await this.evse.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              ocppConnectionName: ocppConnectionName,
              evseTypeId: value.evse.id,
            },
          });
          const [connector] = await this.connector.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              ocppConnectionName: ocppConnectionName,
              evseId: evse.id,
              evseTypeConnectorId: value.evse.connectorId,
            },
            include: [Tariff],
          });
          connectorId = connector.id;
          tariffId = connector.tariff?.id;
        }
        if (infoTariffId) {
          // Find db id using tariffId string
          const tariff = await Tariff.findOne({
            where: { tariffId: infoTariffId, tenantId },
            transaction: sequelizeTransaction,
          });
          if (tariff) {
            tariffId = tariff.id;
          }
        }
        let authorizationId = existingTransaction.authorizationId;
        if (!authorizationId && value.idToken) {
          // Find Authorization by IdToken
          const authorization = await Authorization.findOne({
            where: {
              tenantId,
              idToken: value.idToken.idToken,
              idTokenType: value.idToken.type,
            },
            transaction: sequelizeTransaction,
          });
          if (authorization) {
            authorizationId = authorization.id;
          } else {
            this.logger.warn(
              `Authorization with idToken ${value.idToken.idToken} : ${value.idToken.type} does not exist. Transaction ${existingTransaction.transactionId} will not be associated with an authorization.`,
            );
          }
        }
        finalTransaction = await existingTransaction.update(
          {
            isActive: value.eventType !== OCPP2_0_1.TransactionEventEnumType.Ended,
            endTime:
              value.eventType === OCPP2_0_1.TransactionEventEnumType.Ended
                ? value.timestamp
                : undefined,
            ...value.transactionInfo,
            authorizationId,
            evseId,
            connectorId,
            tariffId,
          },
          {
            transaction: sequelizeTransaction,
          },
        );
      } else {
        const newTransaction = Transaction.build({
          tenantId,
          ocppConnectionName: ocppConnectionName,
          isActive: value.eventType !== OCPP2_0_1.TransactionEventEnumType.Ended,
          startTime:
            value.eventType === OCPP2_0_1.TransactionEventEnumType.Started
              ? value.timestamp
              : undefined,
          ...value.transactionInfo,
        });

        if (value.evse) {
          const [evse] = await this.evse.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              ocppConnectionName: ocppConnectionName,
              evseTypeId: value.evse.id,
            },
          });
          newTransaction.set('evseId', evse.id);
          if (value.evse?.connectorId) {
            const [connector] = await this.connector.readOrCreateByQuery(tenantId, {
              where: {
                tenantId,
                ocppConnectionName: ocppConnectionName,
                evseId: evse.id,
                evseTypeConnectorId: value.evse.connectorId,
              },
              defaults: { connectorId: value.evse.connectorId },
              include: [Tariff],
            });
            newTransaction.set('connectorId', connector.id);
            if (infoTariffId) {
              const tariff = await Tariff.findOne({
                where: { tariffId: infoTariffId, tenantId },
                transaction: sequelizeTransaction,
              });
              newTransaction.set('tariffId', tariff?.id ?? connector.tariff?.id);
            } else {
              newTransaction.set('tariffId', connector.tariff?.id);
            }
          }
        }

        if (value.idToken) {
          // Find Authorization by IdToken
          const authorization = await Authorization.findOne({
            where: {
              tenantId,
              idToken: value.idToken.idToken,
              idTokenType: value.idToken.type,
            },
            transaction: sequelizeTransaction,
          });
          if (authorization) {
            newTransaction.set('authorizationId', authorization.id);
          } else {
            this.logger.warn(
              `Authorization with idToken ${value.idToken.idToken} : ${value.idToken.type} does not exist. Transaction ${newTransaction.transactionId} will not be associated with an authorization.`,
            );
          }
        }

        const [chargingStation] = await this.station.readAllByQuery(tenantId, {
          where: { ocppConnectionName: ocppConnectionName, tenantId },
        });
        if (!chargingStation) {
          this.logger.error(
            `Charging station with ocppConnectionName ${ocppConnectionName} does not exist.`,
          );
        } else {
          if (chargingStation.locationId) {
            newTransaction.set('locationId', chargingStation.locationId);
          } else {
            this.logger.warn(
              `Charging station with ocppConnectionName ${ocppConnectionName} does not have a locationId. Transaction ${newTransaction.transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
            );
          }
        }

        finalTransaction = await newTransaction.save({ transaction: sequelizeTransaction });
        created = true;
      }

      const transactionDatabaseId = finalTransaction.id;

      let event = TransactionEvent.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        transactionDatabaseId,
        ...value,
      });

      if (value.idToken && value.idToken.type !== OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
        const authorization = await Authorization.findOne({
          where: {
            tenantId,
            idToken: value.idToken.idToken,
            idTokenType: value.idToken.type,
          },
          transaction: sequelizeTransaction,
        });
        if (!authorization) {
          this.logger.warn(
            `Authorization not found for ${value.idToken.idToken}:${value.idToken.type}`,
          );
        } else {
          event.idTokenValue = authorization.idToken;
          event.idTokenType = authorization.idTokenType ? authorization.idTokenType : undefined;
        }
      }

      event = await event.save({ transaction: sequelizeTransaction });

      if (value.meterValue && value.meterValue.length > 0) {
        const meterValueTypes = value.meterValue.map((meterValue) =>
          MeterValueMapper.fromMeterValueType(meterValue),
        );
        const newMeterValues = await Promise.all(
          meterValueTypes.map(async (meterValueType) => {
            const savedMeterValue = await MeterValue.create(
              {
                tenantId,
                transactionEventId: event.id,
                transactionDatabaseId: transactionDatabaseId,
                transactionId: finalTransaction.transactionId,
                tariffId: finalTransaction.tariffId,
                ...meterValueType,
              },
              { transaction: sequelizeTransaction },
            );
            this.meterValue.emit('created', [savedMeterValue]);
            return savedMeterValue;
          }),
        );
        if (finalTransaction.meterStart === null || finalTransaction.meterStart === undefined) {
          const meterStart = MeterValueUtils.getMeterStart(meterValueTypes);
          await finalTransaction.update(
            {
              totalKwh: MeterValueUtils.getTotalKwh(
                meterValueTypes,
                finalTransaction.totalKwh ?? 0,
                meterStart ?? undefined,
              ),
              meterStart: meterStart,
            },
            { transaction: sequelizeTransaction },
          );
        } else {
          await finalTransaction.update(
            {
              totalKwh: MeterValueUtils.getTotalKwh(
                meterValueTypes,
                finalTransaction.totalKwh ?? 0,
                finalTransaction.meterStart ?? undefined,
              ),
            },
            { transaction: sequelizeTransaction },
          );
        }
        // Included for ease of access after creation
        finalTransaction.meterValues = newMeterValues;
      }
      await event.reload({ include: [MeterValue], transaction: sequelizeTransaction });
      this.emit('created', [event]);

      this.transaction.emit(created ? 'created' : 'updated', [finalTransaction]);

      return finalTransaction;
    });
  }

  async readAllByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionEvent[]> {
    return await super
      .readAllByQuery(tenantId, {
        where: { ocppConnectionName: ocppConnectionName },
        include: [{ model: Transaction, where: { transactionId } }, MeterValue, Evse],
      })
      .then((transactionEvents) => {
        transactionEvents?.forEach(
          (transactionEvent) => (transactionEvent.transaction = undefined),
        );
        return transactionEvents;
      });
  }

  async readTransactionByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<Transaction | undefined> {
    return await this.transaction.readOnlyOneByQuery(tenantId, {
      where: { ocppConnectionName: ocppConnectionName, transactionId },
    });
  }

  async readAllTransactionsByStationIdAndEvseAndChargingStates(
    tenantId: number,
    ocppConnectionName: string,
    evse?: OCPP2_0_1.EVSEType,
    chargingStates?: OCPP2_0_1.ChargingStateEnumType[] | undefined,
  ): Promise<Transaction[]> {
    const includeObj: any = evse
      ? [
          {
            model: Evse,
            where: { evseTypeId: evse.id },
          },
        ]
      : [];
    if (evse?.connectorId) {
      includeObj.push({
        model: Connector,
        where: { evseTypeConnectorId: evse.connectorId },
      });
    }
    return await this.transaction
      .readAllByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          ...(chargingStates ? { chargingState: { [Op.in]: chargingStates } } : {}),
        },
        include: includeObj,
      })
      .then((row) => row as Transaction[]);
  }

  async readAllActiveTransactionsByAuthorizationId(
    tenantId: number,
    authorizationId: number,
  ): Promise<Transaction[]> {
    return await this.transaction.readAllByQuery(tenantId, {
      where: { isActive: true, authorizationId },
    });
  }

  async readAllMeterValuesByTransactionDataBaseId(
    tenantId: number,
    transactionDataBaseId: number,
  ): Promise<MeterValue[]> {
    return this.meterValue
      .readAllByQuery(tenantId, {
        where: { transactionDatabaseId: transactionDataBaseId },
      })
      .then((row) => row as MeterValue[]);
  }

  async findByTransactionId(
    tenantId: number,
    transactionId: string,
  ): Promise<Transaction | undefined> {
    return this.transaction.readOnlyOneByQuery(tenantId, {
      where: { transactionId },
      include: [
        { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [EvseType] },
        MeterValue,
      ],
    });
  }

  async getTransactions(
    tenantId: number,
    dateFrom?: Date,
    dateTo?: Date,
    offset?: number,
    limit?: number,
  ): Promise<Transaction[]> {
    const queryOptions: any = {
      where: {},
      include: [
        { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [EvseType] },
        MeterValue,
      ],
    };

    if (dateFrom) {
      queryOptions.where.updatedAt = queryOptions.where.updatedAt || {};
      queryOptions.where.updatedAt[Op.gte] = dateFrom;
    }

    if (dateTo) {
      queryOptions.where.updatedAt = queryOptions.where.updatedAt || {};
      queryOptions.where.updatedAt[Op.lt] = dateTo;
    }

    if (offset) {
      queryOptions.offset = offset;
    }

    if (limit) {
      queryOptions.limit = limit;
    }

    return this.transaction.readAllByQuery(tenantId, queryOptions);
  }

  async getTransactionsCount(tenantId: number, dateFrom?: Date, dateTo?: Date): Promise<number> {
    const queryOptions: WhereOptions<any> = {
      where: {},
    };

    if (dateFrom) {
      queryOptions.where.updatedAt = queryOptions.where.updatedAt || {};
      queryOptions.where.updatedAt[Op.gte] = dateFrom;
    }

    if (dateTo) {
      queryOptions.where.updatedAt = queryOptions.where.updatedAt || {};
      queryOptions.where.updatedAt[Op.lt] = dateTo;
    }

    return Transaction.count(queryOptions);
  }

  async readAllTransactionsByQuery(tenantId: number, query: object): Promise<Transaction[]> {
    return await this.transaction.readAllByQuery(tenantId, query);
  }

  async getEvseIdsWithActiveTransactionByStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number[]> {
    const activeTransactions = await this.transaction.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        isActive: true,
      },
      include: [Evse],
    });

    const evseIds: number[] = [];
    activeTransactions.forEach((transaction) => {
      const evseId = transaction.evse?.evseTypeId;
      if (evseId) {
        evseIds.push(evseId);
      }
    });
    return evseIds;
  }

  async getActiveTransactionByStationIdAndEvseId(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
  ): Promise<Transaction | undefined> {
    return await this.transaction
      .readAllByQuery(tenantId, {
        where: {
          ocppConnectionName: ocppConnectionName,
          isActive: true,
        },
        include: [
          {
            model: TransactionEvent,
            as: Transaction.TRANSACTION_EVENTS_ALIAS,
            include: [EvseType],
          },
          MeterValue,
          { model: Evse, where: { evseTypeId: evseId }, required: true },
        ],
      })
      .then((transactions) => {
        if (transactions.length > 1) {
          transactions.sort((t1, t2) => t2.updatedAt.getTime() - t1.updatedAt.getTime());
        }
        return transactions[0];
      });
  }

  async createMeterValue(
    tenantId: number,
    meterValue: OCPP2_0_1.MeterValueType,
    transactionDatabaseId?: number | null,
    transactionId?: string | null,
    tariffId?: number | null,
  ): Promise<MeterValue> {
    const meterValueType = MeterValueMapper.fromMeterValueType(meterValue);
    const savedMeterValue = await MeterValue.create({
      tenantId,
      transactionDatabaseId: transactionDatabaseId,
      transactionId,
      tariffId,
      ...meterValueType,
    });
    this.meterValue.emit('created', [savedMeterValue]);
    return savedMeterValue;
  }

  async updateTransactionTotalCostById(
    tenantId: number,
    totalCost: number,
    id: number,
  ): Promise<void> {
    await this.transaction.updateByKey(tenantId, { totalCost: totalCost }, id.toString());
  }

  async updateTransactionByMeterValues(
    tenantId: number,
    meterValues: MeterValueDto[],
    ocppConnectionName: string,
    transactionId: number,
  ): Promise<void> {
    // Find existing transaction
    const transaction = await this.readTransactionByStationIdAndTransactionId(
      tenantId,
      ocppConnectionName,
      transactionId.toString(),
    );
    if (!transaction) {
      this.logger.error(
        `Transaction ${transactionId} on station ${ocppConnectionName} does not exist.`,
      );
      return;
    }

    // Store meter values
    await Promise.all(
      meterValues.map(async (meterValue) => {
        meterValue.transactionDatabaseId = transaction.id;
        meterValue.transactionId = transaction.transactionId;
        meterValue.tariffId = transaction.tariffId;
        const createdMeterValue = await MeterValue.create(meterValue);
        this.meterValue.emit('created', [createdMeterValue]);
      }),
    );

    if (transaction.meterStart === null || transaction.meterStart === undefined) {
      const meterStart = MeterValueUtils.getMeterStart(meterValues);
      await transaction.update({
        totalKwh: MeterValueUtils.getTotalKwh(
          meterValues,
          transaction.totalKwh ?? 0,
          meterStart ?? undefined,
        ),
        meterStart: meterStart,
      });
    } else {
      await transaction.update({
        totalKwh: MeterValueUtils.getTotalKwh(
          meterValues,
          transaction.totalKwh ?? 0,
          transaction.meterStart ?? undefined,
        ),
      });
    }
  }

  async createTransactionByStartTransaction(
    tenantId: number,
    request: OCPP1_6.StartTransactionRequest,
    ocppConnectionName: string,
  ): Promise<Transaction> {
    return await this.s.transaction(async (sequelizeTransaction) => {
      // Build StartTransaction event
      let event = StartTransaction.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        ...request,
      });

      // Associate Connector with StartTransaction
      const connector = await this.connector.readOnlyOneByQuery(tenantId, {
        where: {
          connectorId: request.connectorId,
          ocppConnectionName: ocppConnectionName,
        },
        include: [Tariff],
        sequelizeTransaction,
      });
      if (!connector) {
        this.logger.error(`Unable to find connector ${request.connectorId}.`);
        throw new Error(`Unable to find connector ${request.connectorId}.`);
      }
      event.connectorDatabaseId = connector.id;

      // Find Authorization by IdToken
      const authorization = await Authorization.findOne({
        where: {
          tenantId,
          idToken: request.idTag,
        },
        transaction: sequelizeTransaction,
      });
      if (!authorization) {
        this.logger.warn(`Authorization with idToken ${request.idTag} does not exist.`);
      }

      // Generate transactionId
      const transactionId = await this.chargingStationSequence.getNextSequenceValue(
        tenantId,
        ocppConnectionName,
        ChargingStationSequenceTypeEnum.transactionId,
      );
      // Store transaction in db
      let newTransaction = Transaction.build({
        tenantId,
        ocppConnectionName: ocppConnectionName,
        evseId: connector.evseId,
        connectorId: connector.id,
        tariffId: connector.tariff?.id,
        isActive: true,
        transactionId: transactionId.toString(),
        authorizationId: authorization ? authorization.id : null,
        meterStart: request.meterStart / 1000, // Convert Wh to kWh
        startTime: request.timestamp,
      });

      const [chargingStation] = await this.station.readAllByQuery(tenantId, {
        where: { ocppConnectionName: ocppConnectionName, tenantId },
      });
      if (chargingStation) {
        if (chargingStation.locationId) {
          newTransaction.set('locationId', chargingStation.locationId);
        } else {
          this.logger.warn(
            `Charging station with ocppConnectionName ${ocppConnectionName} does not have a locationId. Transaction ${newTransaction.transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
          );
        }
      }

      newTransaction = await newTransaction.save({ transaction: sequelizeTransaction });

      // Store StartTransaction in db
      event.transactionDatabaseId = newTransaction.id;
      event = await event.save({ transaction: sequelizeTransaction });
      this.startTransaction.emit('created', [event]);

      // Return the new transaction with StartTransaction and IdToken
      await newTransaction.reload({
        include: [{ model: StartTransaction }],
        transaction: sequelizeTransaction,
      });
      this.transaction.emit('created', [newTransaction]);
      return newTransaction;
    });
  }

  async createStopTransaction(
    tenantId: number,
    transactionDatabaseId: number,
    ocppConnectionName: string,
    meterStop: number,
    timestamp: Date,
    meterValues: MeterValueDto[],
    reason?: string,
  ): Promise<StopTransaction> {
    const transaction = await this.transaction.readOnlyOneByQuery(tenantId, {
      where: { id: transactionDatabaseId },
      include: [StartTransaction],
    });

    if (!transaction) {
      this.logger.error(`Transaction with id ${transactionDatabaseId} not found.`);
      throw new Error(`Transaction with id ${transactionDatabaseId} not found.`);
    }

    const stopTransaction = await StopTransaction.create({
      tenantId,
      ocppConnectionName: ocppConnectionName,
      transactionDatabaseId,
      meterStop,
      timestamp: timestamp.toISOString(),
      reason,
    });
    this.stopTransaction.emit('created', [stopTransaction]);

    await transaction.update({
      endTime: timestamp,
      isActive: false,
    });

    if (meterValues.length > 0) {
      await Promise.all(
        meterValues.map(async (meterValue) => {
          meterValue.transactionDatabaseId = transactionDatabaseId;
          const createdMeterValue = MeterValue.build(meterValue);
          createdMeterValue.stopTransactionDatabaseId = stopTransaction.id;
          await createdMeterValue.save();
          this.meterValue.emit('created', [createdMeterValue]);
        }),
      );
    }

    return stopTransaction;
  }

  async updateTransactionByStationIdAndTransactionId(
    tenantId: number,
    transaction: Partial<Transaction>,
    transactionId: string,
    ocppConnectionName: string,
  ): Promise<Transaction | undefined> {
    const transactions = await this.transaction.updateAllByQuery(tenantId, transaction, {
      where: {
        // unique constraint
        transactionId,
        ocppConnectionName: ocppConnectionName,
      },
    });
    return transactions.length > 0 ? transactions[0] : undefined;
  }

  async deactivateActiveTransactionsByStationIdAndEvseId(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
    excludeTransactionId: string,
  ): Promise<Transaction[]> {
    const activeTransactions = await this.transaction.readAllByQuery(tenantId, {
      where: {
        ocppConnectionName: ocppConnectionName,
        isActive: true,
        transactionId: { [Op.ne]: excludeTransactionId },
      },
      include: [{ model: Evse, where: { evseTypeId: evseId }, required: true }],
    });

    if (activeTransactions.length === 0) {
      return [];
    }

    const ids = activeTransactions.map((t) => t.id);
    return await this.transaction.updateAllByQuery(
      tenantId,
      { isActive: false },
      { where: { id: { [Op.in]: ids } } },
    );
  }
}

export default SequelizeTransactionEventRepository;

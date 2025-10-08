// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ChargingStationSequenceType,
  CrudRepository,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
  BootstrapConfig,
} from '@citrineos/base';
import {
  IChargingStationSequenceRepository,
  type ITransactionEventRepository,
} from '../../../interfaces';
import {
  MeterValue,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
} from '../model/TransactionEvent';
import { SequelizeRepository } from './Base';
import { EvseType } from '../model/DeviceModel';
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { MeterValueMapper } from '../mapper/2.0.1';
import { ChargingStation, Connector, Evse } from '../model/Location';
import { SequelizeChargingStationSequenceRepository } from './ChargingStationSequence';
import { Authorization } from '../model/Authorization';
import { Tariff } from '../model';

export class SequelizeTransactionEventRepository
  extends SequelizeRepository<TransactionEvent>
  implements ITransactionEventRepository
{
  transaction: CrudRepository<Transaction>;
  authorization: CrudRepository<Authorization>;
  evse: CrudRepository<Evse>;
  station: CrudRepository<ChargingStation>;
  meterValue: CrudRepository<MeterValue>;
  startTransaction: CrudRepository<StartTransaction>;
  stopTransaction: CrudRepository<StopTransaction>;
  connector: CrudRepository<Connector>;
  chargingStationSequence: IChargingStationSequenceRepository;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    namespace = TransactionEvent.MODEL_NAME,
    sequelizeInstance?: Sequelize,
    transaction?: CrudRepository<Transaction>,
    authorization?: CrudRepository<Authorization>,
    station?: CrudRepository<ChargingStation>,
    evse?: CrudRepository<Evse>,
    meterValue?: CrudRepository<MeterValue>,
    startTransaction?: CrudRepository<StartTransaction>,
    stopTransaction?: CrudRepository<StopTransaction>,
    connector?: CrudRepository<Connector>,
    chargingStationSequence?: IChargingStationSequenceRepository,
  ) {
    super(config, namespace, logger, sequelizeInstance);
    this.transaction = transaction
      ? transaction
      : new SequelizeRepository<Transaction>(
          config,
          Transaction.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.authorization = authorization
      ? authorization
      : new SequelizeRepository<Authorization>(
          config,
          Authorization.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.station = station
      ? station
      : new SequelizeRepository<ChargingStation>(
          config,
          ChargingStation.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.meterValue = meterValue
      ? meterValue
      : new SequelizeRepository<MeterValue>(
          config,
          MeterValue.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.startTransaction = startTransaction
      ? startTransaction
      : new SequelizeRepository<StartTransaction>(
          config,
          StartTransaction.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.stopTransaction = stopTransaction
      ? stopTransaction
      : new SequelizeRepository<StopTransaction>(
          config,
          StopTransaction.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.connector = connector
      ? connector
      : new SequelizeRepository<Connector>(config, Connector.MODEL_NAME, logger, sequelizeInstance);
    this.chargingStationSequence =
      chargingStationSequence || new SequelizeChargingStationSequenceRepository(config, logger);
  }

  /**
   * @param value TransactionEventRequest received from charging station. Will be used to create TransactionEvent,
   * MeterValues, and either create or update Transaction. IdTokens (and associated AdditionalInfo) and EVSEs are
   * assumed to already exist and will not be created as part of this call.
   *
   * @param stationId StationId of charging station which sent TransactionEventRequest.
   *
   * @returns Saved TransactionEvent
   */
  async createOrUpdateTransactionByTransactionEventAndStationId(
    tenantId: number,
    value: OCPP2_0_1.TransactionEventRequest,
    stationId: string,
  ): Promise<Transaction> {
    return await this.s.transaction(async (sequelizeTransaction) => {
      let finalTransaction: Transaction;
      let created = false;
      const existingTransaction = await this.transaction.readOnlyOneByQuery(tenantId, {
        where: {
          stationId,
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
              stationId,
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
              stationId,
              evseTypeId: value.evse.id,
            },
          });
          const [connector] = await this.connector.readOrCreateByQuery(tenantId, {
            where: {
              tenantId,
              stationId,
              evseId: evse.id,
              evseTypeConnectorId: value.evse.connectorId,
            },
            include: [Tariff],
          });
          connectorId = connector.id;
          tariffId = connector.tariffs?.[0]?.id;
        }
        let authorizationId = existingTransaction.authorizationId;
        if (!authorizationId && value.idToken) {
          // Find Authorization by IdToken
          const authorization = await this.authorization.readOnlyOneByQuery(tenantId, {
            where: {
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
          stationId,
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
              stationId,
              evseTypeId: value.evse.id,
            },
          });
          newTransaction.evseId = evse.id;
          if (value.evse?.connectorId) {
            const [connector] = await this.connector.readOrCreateByQuery(tenantId, {
              where: {
                tenantId,
                stationId,
                evseId: evse.id,
                evseTypeConnectorId: value.evse.connectorId,
              },
              include: [Tariff],
            });
            newTransaction.connectorId = connector.id;
            newTransaction.tariffId = connector.tariffs?.[0]?.id;
          }
        }

        if (value.idToken) {
          // Find Authorization by IdToken
          const authorization = await this.authorization.readOnlyOneByQuery(tenantId, {
            where: {
              idToken: value.idToken.idToken,
              idTokenType: value.idToken.type,
            },
            transaction: sequelizeTransaction,
          });
          if (authorization) {
            newTransaction.authorizationId = authorization.id;
          } else {
            this.logger.warn(
              `Authorization with idToken ${value.idToken.idToken} : ${value.idToken.type} does not exist. Transaction ${newTransaction.transactionId} will not be associated with an authorization.`,
            );
          }
        }

        const chargingStation = await this.station.readByKey(tenantId, stationId);
        if (!chargingStation) {
          this.logger.error(`Charging station with stationId ${stationId} does not exist.`);
        } else {
          if (chargingStation.locationId) {
            newTransaction.locationId = chargingStation.locationId;
          } else {
            this.logger.warn(
              `Charging station with stationId ${stationId} does not have a locationId. Transaction ${newTransaction.transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
            );
          }
        }

        finalTransaction = await newTransaction.save({ transaction: sequelizeTransaction });
        created = true;
      }

      const transactionDatabaseId = finalTransaction.id;

      let event = TransactionEvent.build({
        tenantId,
        stationId,
        transactionDatabaseId,
        ...value,
      });

      if (value.idToken && value.idToken.type !== OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
        const authorization = await Authorization.findOne({
          where: {
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
        await Promise.all(
          value.meterValue.map(async (meterValue) => {
            const savedMeterValue = await MeterValue.create(
              {
                tenantId,
                transactionEventId: event.id,
                transactionDatabaseId: transactionDatabaseId,
                transactionId: finalTransaction.transactionId,
                tariffId: finalTransaction.tariffId,
                ...meterValue,
              },
              { transaction: sequelizeTransaction },
            );
            this.meterValue.emit('created', [savedMeterValue]);
          }),
        );
      }
      await event.reload({ include: [MeterValue], transaction: sequelizeTransaction });
      this.emit('created', [event]);

      const allMeterValues = await this.meterValue.readAllByQuery(tenantId, {
        where: {
          transactionDatabaseId,
        },
        transaction: sequelizeTransaction,
      });
      const meterValueTypes = allMeterValues.map((meterValue) =>
        MeterValueMapper.toMeterValueType(meterValue),
      );
      await finalTransaction.update(
        { totalKwh: MeterValueUtils.getTotalKwh(meterValueTypes) },
        { transaction: sequelizeTransaction },
      );
      await finalTransaction.reload({
        include: [
          {
            model: TransactionEvent,
            as: Transaction.TRANSACTION_EVENTS_ALIAS,
            include: [EvseType],
          },
          MeterValue,
        ],
        transaction: sequelizeTransaction,
      });

      this.transaction.emit(created ? 'created' : 'updated', [finalTransaction]);

      return finalTransaction;
    });
  }

  async readAllByStationIdAndTransactionId(
    tenantId: number,
    stationId: string,
    transactionId: string,
  ): Promise<TransactionEvent[]> {
    return await super
      .readAllByQuery(tenantId, {
        where: { stationId },
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
    stationId: string,
    transactionId: string,
  ): Promise<Transaction | undefined> {
    return await this.transaction.readOnlyOneByQuery(tenantId, {
      where: { stationId, transactionId },
      include: [MeterValue],
    });
  }

  async readAllTransactionsByStationIdAndEvseAndChargingStates(
    tenantId: number,
    stationId: string,
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
          stationId,
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
    stationId: string,
  ): Promise<number[]> {
    const activeTransactions = await this.transaction.readAllByQuery(tenantId, {
      where: {
        stationId: stationId,
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
    stationId: string,
    evseId: number,
  ): Promise<Transaction | undefined> {
    return await this.transaction
      .readAllByQuery(tenantId, {
        where: {
          stationId,
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
  ): Promise<void> {
    await this.s.transaction(async (sequelizeTransaction) => {
      const savedMeterValue = await MeterValue.create(
        {
          tenantId,
          transactionDatabaseId: transactionDatabaseId,
          transactionId,
          tariffId,
          ...meterValue,
        },
        { transaction: sequelizeTransaction },
      );
      this.meterValue.emit('created', [savedMeterValue]);
    });
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
    meterValues: MeterValue[],
    stationId: string,
    transactionId: number,
  ): Promise<void> {
    // Find existing transaction
    const transaction = await this.readTransactionByStationIdAndTransactionId(
      tenantId,
      stationId,
      transactionId.toString(),
    );
    if (!transaction) {
      this.logger.error(`Transaction ${transactionId} on station ${stationId} does not exist.`);
      return;
    }

    // Store meter values
    await Promise.all(
      meterValues.map(async (meterValue) => {
        meterValue.transactionDatabaseId = transaction.id;
        meterValue.transactionId = transaction.transactionId;
        meterValue.tariffId = transaction.tariffId;
        await meterValue.save();
        this.meterValue.emit('created', [meterValue]);
      }),
    );

    // Update transaction total kWh
    const allMeterValues = await this.meterValue.readAllByQuery(tenantId, {
      where: {
        transactionDatabaseId: transaction.id,
      },
    });
    const meterValueTypes = allMeterValues.map((meterValue) =>
      MeterValueMapper.toMeterValueType(meterValue),
    );
    await transaction.update({ totalKwh: MeterValueUtils.getTotalKwh(meterValueTypes) });
  }

  async createTransactionByStartTransaction(
    tenantId: number,
    request: OCPP1_6.StartTransactionRequest,
    stationId: string,
  ): Promise<Transaction> {
    return await this.s.transaction(async (sequelizeTransaction) => {
      // Build StartTransaction event
      let event = StartTransaction.build({
        tenantId,
        stationId,
        ...request,
      });

      // Associate Connector with StartTransaction
      const connector = await this.connector.readOnlyOneByQuery(tenantId, {
        where: {
          connectorId: request.connectorId,
          stationId,
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
      const authorization = await this.authorization.readOnlyOneByQuery(tenantId, {
        where: {
          idToken: request.idTag,
          idTokenType: null, // OCPP 1.6 does not have idTokenType
        },
        transaction: sequelizeTransaction,
      });
      if (!authorization) {
        this.logger.warn(`Authorization with idToken ${request.idTag} does not exist.`);
      }

      // Generate transactionId
      const transactionId = await this.chargingStationSequence.getNextSequenceValue(
        tenantId,
        stationId,
        ChargingStationSequenceType.transactionId,
      );
      // Store transaction in db
      let newTransaction = Transaction.build({
        tenantId,
        stationId,
        evseId: connector.evseId,
        connectorId: connector.id,
        tariffId: connector.tariffs?.[0]?.id,
        isActive: true,
        transactionId: transactionId.toString(),
        authorizationId: authorization ? authorization.id : null,
        startTime: request.timestamp,
      });

      const chargingStation = await this.station.readByKey(tenantId, stationId);
      if (!chargingStation) {
        this.logger.error(`Charging station with stationId ${stationId} does not exist.`);
      } else {
        if (chargingStation.locationId) {
          newTransaction.locationId = chargingStation.locationId;
        } else {
          this.logger.warn(
            `Charging station with stationId ${stationId} does not have a locationId. Transaction ${newTransaction.transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
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
    stationId: string,
    meterStop: number,
    timestamp: Date,
    meterValues: MeterValue[],
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
      stationId,
      transactionDatabaseId,
      meterStop,
      timestamp: timestamp.toISOString(),
      reason,
      meterValues,
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
          meterValue.stopTransactionDatabaseId = stopTransaction.id;
          await meterValue.save();
          this.meterValue.emit('created', [meterValue]);
        }),
      );
    }

    return stopTransaction;
  }

  async updateTransactionByStationIdAndTransactionId(
    tenantId: number,
    transaction: Partial<Transaction>,
    transactionId: string,
    stationId: string,
  ): Promise<Transaction | undefined> {
    const transactions = await this.transaction.updateAllByQuery(tenantId, transaction, {
      where: {
        // unique constraint
        transactionId,
        stationId,
      },
    });
    return transactions.length > 0 ? transactions[0] : undefined;
  }
}

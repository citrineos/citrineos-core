// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CrudRepository,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
  SystemConfig,
  TransactionEventType,
} from '@citrineos/base';
import { type ITransactionEventRepository } from '../../../interfaces';
import { MeterValue, StartTransaction, Transaction, TransactionEvent } from '../model/TransactionEvent';
import { SequelizeRepository } from './Base';
import { IdToken } from '../model/Authorization';
import { Evse } from '../model/DeviceModel';
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { MeterValueMapper } from '../mapper/2.0.1';
import { Connector } from '../model/Location';

export class SequelizeTransactionEventRepository extends SequelizeRepository<TransactionEvent> implements ITransactionEventRepository {
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  idToken: CrudRepository<IdToken>;
  meterValue: CrudRepository<MeterValue>;
  startTransaction: CrudRepository<StartTransaction>;
  connector: CrudRepository<Connector>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    namespace = TransactionEvent.MODEL_NAME,
    sequelizeInstance?: Sequelize,
    transaction?: CrudRepository<Transaction>,
    evse?: CrudRepository<Evse>,
    idToken?: CrudRepository<IdToken>,
    meterValue?: CrudRepository<MeterValue>,
    startTransaction?: CrudRepository<StartTransaction>,
    connector?: CrudRepository<Connector>,
  ) {
    super(config, namespace, logger, sequelizeInstance);
    this.transaction = transaction ? transaction : new SequelizeRepository<Transaction>(config, Transaction.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken ? idToken : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.meterValue = meterValue ? meterValue : new SequelizeRepository<MeterValue>(config, MeterValue.MODEL_NAME, logger, sequelizeInstance);
    this.startTransaction = startTransaction ? startTransaction : new SequelizeRepository<StartTransaction>(config, StartTransaction.MODEL_NAME, logger, sequelizeInstance);
    this.connector = connector ? connector : new SequelizeRepository<Connector>(config, Connector.MODEL_NAME, logger, sequelizeInstance);
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
  async createOrUpdateTransactionByTransactionEventAndStationId(value: OCPP2_0_1.TransactionEventRequest, stationId: string): Promise<Transaction> {
    let evse: Evse | undefined;
    if (value.evse) {
      [evse] = await this.evse.readOrCreateByQuery({
        where: {
          id: value.evse.id,
          connectorId: value.evse.connectorId ? value.evse.connectorId : null,
        },
      });
    }

    return await this.s.transaction(async (sequelizeTransaction) => {
      let finalTransaction: Transaction;
      let created = false;
      const existingTransaction = await this.transaction.readOnlyOneByQuery({
        where: {
          stationId,
          transactionId: value.transactionInfo.transactionId,
        },
        transaction: sequelizeTransaction,
      });

      if (existingTransaction) {
        finalTransaction = await existingTransaction.update(
          {
            isActive: value.eventType !== OCPP2_0_1.TransactionEventEnumType.Ended,
            ...value.transactionInfo,
          },
          {
            transaction: sequelizeTransaction,
          },
        );
      } else {
        const newTransaction = Transaction.build({
          stationId,
          isActive: value.eventType !== OCPP2_0_1.TransactionEventEnumType.Ended,
          ...(evse ? { evseDatabaseId: evse.databaseId } : {}),
          ...value.transactionInfo,
        });

        finalTransaction = await newTransaction.save({ transaction: sequelizeTransaction });
        created = true;
      }

      const transactionDatabaseId = finalTransaction.id;

      let event = TransactionEvent.build({
        stationId,
        transactionDatabaseId,
        ...value,
      });

      if (value.idToken && value.idToken.type !== OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
        // TODO: ensure that Authorization is passed into this method if idToken exists
        // At this point, token MUST already be authorized and thus exist in the database
        // It can be either the primary idToken of an Authorization or a group idToken
        const idToken = await this.idToken.readOnlyOneByQuery({
          where: {
            idToken: value.idToken.idToken,
            type: value.idToken.type,
          },
          transaction: sequelizeTransaction,
        });
        if (!idToken) {
          // TODO: Log Warning...
          // TODO: Save raw transaction event in TransactionEvent model
        } else {
          event.idTokenId = idToken.id;
        }
      }

      event = await event.save({ transaction: sequelizeTransaction });

      if (value.meterValue && value.meterValue.length > 0) {
        await Promise.all(
          value.meterValue.map(async (meterValue) => {
            const savedMeterValue = await MeterValue.create(
              {
                transactionEventId: event.id,
                transactionDatabaseId: transactionDatabaseId,
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

      const allMeterValues = await this.meterValue.readAllByQuery({
        where: {
          transactionDatabaseId,
        },
        transaction: sequelizeTransaction,
      });

      const meterValueMappers = allMeterValues.map((meterValue) =>
        MeterValueMapper.fromModel(meterValue),
      );
      await finalTransaction.update({ totalKwh: MeterValueUtils.getTotalKwh(meterValueMappers) }, { transaction: sequelizeTransaction });
      await finalTransaction.reload({
        include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, Evse],
        transaction: sequelizeTransaction,
      });

      this.transaction.emit(created ? 'created' : 'updated', [finalTransaction]);

      return finalTransaction;
    });
  }

  async readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEvent[]> {
    return await super
      .readAllByQuery({
        where: { stationId },
        include: [{ model: Transaction, where: { transactionId } }, MeterValue, Evse, IdToken],
      })
      .then((transactionEvents) => {
        transactionEvents?.forEach((transactionEvent) => (transactionEvent.transaction = undefined));
        return transactionEvents;
      });
  }

  async readTransactionByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<Transaction | undefined> {
    return await this.transaction.readOnlyOneByQuery({
      where: { stationId, transactionId },
      include: [MeterValue, Evse],
    });
  }

  /**
   * @param stationId StationId of the charging station where the transaction took place.
   * @param evse Evse where the transaction took place.
   * @param chargingStates Optional list of {@link ChargingStateEnumType}s the transactions must be in.
   * If not present, will grab transactions regardless of charging state. If not present, will grab transactions
   * without charging states, such as transactions started when a parking bay occupancy detector detects
   * an EV (trigger reason "EVDetected")
   *
   * @returns List of transactions which meet the requirements.
   */
  async readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse?: OCPP2_0_1.EVSEType, chargingStates?: OCPP2_0_1.ChargingStateEnumType[] | undefined): Promise<Transaction[]> {
    const includeObj = evse
      ? [
        {
          model: Evse,
          where: { id: evse.id, connectorId: evse.connectorId ? evse.connectorId : null },
        },
      ]
      : [];
    return await this.transaction
      .readAllByQuery({
        where: { stationId, ...(chargingStates ? { chargingState: { [Op.in]: chargingStates } } : {}) },
        include: includeObj,
      })
      .then((row) => row as Transaction[]);
  }

  async readAllActiveTransactionsByIdTokenAndTransactionEventType(idToken: IdToken, eventType: TransactionEventType): Promise<Transaction[]> {
    if (eventType && eventType !== TransactionEventType.transactionEvent && eventType !== TransactionEventType.startTransaction) {
      this.logger.warn(`Invalid eventType ${eventType} provided for idToken ${idToken.idToken} and type ${idToken.type}`);
      return [];
    }

    return await this.transaction.readAllByQuery({
      where: { isActive: true },
      include: [
        {
          model: eventType === TransactionEventType.transactionEvent ? TransactionEvent : StartTransaction,
          as: eventType === TransactionEventType.transactionEvent ? Transaction.TRANSACTION_EVENTS_ALIAS : undefined,
          required: true,
          include: [
            {
              model: IdToken,
              required: true,
              where: {
                idToken: idToken.idToken,
                type: idToken.type,
              },
            },
          ],
        },
      ],
    });
  }

  async readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]> {
    return this.meterValue
      .readAllByQuery({
        where: { transactionDatabaseId: transactionDataBaseId },
      })
      .then((row) => row as MeterValue[]);
  }

  findByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    return this.transaction.readOnlyOneByQuery({
      where: { transactionId },
      include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, Evse],
    });
  }

  async getTransactions(dateFrom?: Date, dateTo?: Date, offset?: number, limit?: number): Promise<Transaction[]> {
    const queryOptions: any = {
      where: {},
      include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, Evse],
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

    return this.transaction.readAllByQuery(queryOptions);
  }

  async getTransactionsCount(dateFrom?: Date, dateTo?: Date): Promise<number> {
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

  async readAllTransactionsByQuery(query: object): Promise<Transaction[]> {
    return await this.transaction.readAllByQuery(query);
  }

  async getEvseIdsWithActiveTransactionByStationId(stationId: string): Promise<number[]> {
    const activeTransactions = await this.transaction.readAllByQuery({
      where: {
        stationId: stationId,
        isActive: true,
      },
      include: [Evse],
    });

    const evseIds: number[] = [];
    activeTransactions.forEach((transaction) => {
      const evseId = transaction.evse?.id;
      if (evseId) {
        evseIds.push(evseId);
      }
    });
    return evseIds;
  }

  async getActiveTransactionByStationIdAndEvseId(stationId: string, evseId: number): Promise<Transaction | undefined> {
    // TODO: replace with readOneByQuery after we add the logic
    //  to guarantee that only one active transaction per evse exists
    return await this.transaction
      .readAllByQuery({
        where: {
          stationId,
          isActive: true,
        },
        include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, { model: Evse, where: { id: evseId }, required: true }], // required: true ensures the inner join
      })
      .then((transactions) => {
        if (transactions.length > 1) {
          transactions.sort((t1, t2) => t2.updatedAt.getTime() - t1.updatedAt.getTime());
        }
        return transactions[0];
      });
  }

  async createMeterValue(meterValue: OCPP2_0_1.MeterValueType, transactionDatabaseId?: number | null): Promise<void> {
    await this.s.transaction(async (sequelizeTransaction) => {
      const savedMeterValue = await MeterValue.create(
        {
          transactionDatabaseId: transactionDatabaseId,
          ...meterValue,
        },
        { transaction: sequelizeTransaction },
      );
      this.meterValue.emit('created', [savedMeterValue]);
    });
  }

  async updateTransactionTotalCostById(totalCost: number, id: number): Promise<void> {
    await this.transaction.updateByKey({ totalCost: totalCost }, id.toString());
  }

  async createTransactionByStartTransaction(request: OCPP1_6.StartTransactionRequest, transactionId: number, stationId: string): Promise<Transaction | undefined> {
    return await this.s.transaction(async (sequelizeTransaction) => {
      // Build StartTransaction event
      let event = StartTransaction.build({
        stationId,
        ...request,
      });

      // Associate IdToken with StartTransaction
      const idToken = await this.idToken.readOnlyOneByQuery({
        where: {
          idToken: request.idTag,
          type: null,
        },
        transaction: sequelizeTransaction,
      });
      if (!idToken) {
        this.logger.error(`Unable to find idTag ${request.idTag}. Create transaction failed.`);
        return undefined;
      }
      event.idTokenId = idToken.id;

      // Associate Connector with StartTransaction
      const connector = await this.connector.readOnlyOneByQuery({
        where: {
          connectorId: request.connectorId,
          stationId,
        },
        transaction: sequelizeTransaction,
      });
      if (!connector) {
        this.logger.error(`Unable to find connector ${request.connectorId}. Create transaction failed.`);
        return undefined;
      }
      event.connectorId = connector.id;

      // Store transaction in db
      let newTransaction = Transaction.build({
        stationId,
        isActive: true,
        transactionId: transactionId.toString(),
      });
      newTransaction = await newTransaction.save({ transaction: sequelizeTransaction });

      // Store StartTransaction in db
      event.transactionDatabaseId = newTransaction.id;
      event = await event.save({ transaction: sequelizeTransaction });
      this.startTransaction.emit('created', [event]);

      // Return the new transaction with StartTransaction and IdToken
      await newTransaction.reload({
        include: [{ model: StartTransaction, include: [IdToken] }],
        transaction: sequelizeTransaction,
      });
      this.transaction.emit('created', [newTransaction]);
      return newTransaction;
    });
  }
}

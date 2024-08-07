// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type ChargingStateEnumType, CrudRepository, type EVSEType, IdTokenEnumType, type IdTokenType, MeterValueType, MeterValueUtils, SystemConfig, TransactionEventEnumType, type TransactionEventRequest } from '@citrineos/base';
import { type ITransactionEventRepository } from '../../../interfaces';
import { MeterValue, Transaction, TransactionEvent } from '../model/TransactionEvent';
import { SequelizeRepository } from './Base';
import { IdToken } from '../model/Authorization';
import { Evse } from '../model/DeviceModel';
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeTransactionEventRepository extends SequelizeRepository<TransactionEvent> implements ITransactionEventRepository {
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  idToken: CrudRepository<IdToken>;
  meterValue: CrudRepository<MeterValue>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    namespace = TransactionEvent.MODEL_NAME,
    sequelizeInstance?: Sequelize,
    transaction?: CrudRepository<Transaction>,
    evse?: CrudRepository<Evse>,
    idToken?: CrudRepository<IdToken>,
    meterValue?: CrudRepository<MeterValue>,
  ) {
    super(config, namespace, logger, sequelizeInstance);
    this.transaction = transaction ? transaction : new SequelizeRepository<Transaction>(config, Transaction.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken ? idToken : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.meterValue = meterValue ? meterValue : new SequelizeRepository<MeterValue>(config, MeterValue.MODEL_NAME, logger, sequelizeInstance);
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
  async createOrUpdateTransactionByTransactionEventAndStationId(value: TransactionEventRequest, stationId: string): Promise<Transaction> {
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
      let transaction: Transaction;
      let created = false;
      const existingTransaction = await this.s.models[Transaction.MODEL_NAME].findOne({
        where: {
          stationId,
          transactionId: value.transactionInfo.transactionId,
        },
        transaction: sequelizeTransaction,
      });

      const updatedTransaction = Transaction.build({
        stationId,
        evseDatabaseId: evse ? evse.get('databaseId') : null,
        ...value.transactionInfo,
      });

      if (existingTransaction) {
        if (existingTransaction.get('isActive') !== false && value.eventType === TransactionEventEnumType.Ended) {
          updatedTransaction.set('isActive', false);
        }
        await existingTransaction.update({ ...updatedTransaction }, { transaction: sequelizeTransaction });
        transaction = (await existingTransaction.reload({
          transaction: sequelizeTransaction,
          include: [
            {
              model: TransactionEvent,
              as: Transaction.TRANSACTION_EVENTS_ALIAS,
            },
            MeterValue,
          ],
        })) as Transaction;
      } else {
        updatedTransaction.set('isActive', value.eventType !== TransactionEventEnumType.Ended);
        transaction = await updatedTransaction.save({ transaction: sequelizeTransaction });
        created = true;
      }

      const transactionDatabaseId = transaction.id;

      let event = TransactionEvent.build({
        stationId,
        transactionDatabaseId,
        ...value,
      });

      if (value.idToken && value.idToken.type !== IdTokenEnumType.NoAuthorization) {
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
                transactionEventId: event.get('id'),
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

      await transaction.reload({
        include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, Evse],
        transaction: sequelizeTransaction,
      });
      await this.calculateAndUpdateTotalKwh(transaction);

      if (created) {
        this.transaction.emit('created', [transaction]);
      } else {
        this.transaction.emit('updated', [transaction]);
      }
      return transaction;
    });
  }

  async readAllByStationIdAndTransactionId(stationId: string, transactionId: string): Promise<TransactionEventRequest[]> {
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
  async readAllTransactionsByStationIdAndEvseAndChargingStates(stationId: string, evse?: EVSEType, chargingStates?: ChargingStateEnumType[] | undefined): Promise<Transaction[]> {
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

  readAllActiveTransactionsByIdToken(idToken: IdTokenType): Promise<Transaction[]> {
    return this.transaction
      .readAllByQuery({
        where: { isActive: true },
        include: [
          {
            model: TransactionEvent,
            as: Transaction.TRANSACTION_EVENTS_ALIAS,
            include: [
              {
                model: IdToken,
                where: {
                  idToken: idToken.idToken,
                  type: idToken.type,
                },
              },
            ],
          },
        ],
      })
      .then((row) => row as Transaction[]);
  }

  readAllMeterValuesByTransactionDataBaseId(transactionDataBaseId: number): Promise<MeterValue[]> {
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
        include: [{ model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] }, MeterValue, { model: Evse, where: { id: evseId } }],
      })
      .then((transactions) => {
        if (transactions.length > 1) {
          transactions.sort((t1, t2) => t2.createdAt.getTime() - t1.createdAt.getTime());
        }
        return transactions[0];
      });
  }

  async createMeterValue(meterValue: MeterValueType): Promise<void> {
    const createdMeterValue = await MeterValue.create({ ...meterValue });
    this.meterValue.emit('created', [createdMeterValue]);
  }

  private async calculateAndUpdateTotalKwh(transaction: Transaction): Promise<number> {
    const totalKwh = MeterValueUtils.getTotalKwh(transaction.meterValues ?? []);

    await transaction.update({ totalKwh });

    return totalKwh;
  }
}

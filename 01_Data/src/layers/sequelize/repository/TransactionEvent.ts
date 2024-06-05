// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type ChargingStateEnumType, CrudRepository, type EVSEType, type IdTokenType, SystemConfig, TransactionEventEnumType, type TransactionEventRequest } from '@citrineos/base';
import { type ITransactionEventRepository } from '../../../interfaces';
import { MeterValue, Transaction, TransactionEvent } from '../model/TransactionEvent';
import { SequelizeRepository } from './Base';
import { IdToken } from '../model/Authorization';
import { Evse } from '../model/DeviceModel';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeTransactionEventRepository extends SequelizeRepository<TransactionEvent> implements ITransactionEventRepository {
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  meterValue: CrudRepository<MeterValue>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    namespace = TransactionEvent.MODEL_NAME,
    sequelizeInstance?: Sequelize,
    transaction?: CrudRepository<Transaction>,
    evse?: CrudRepository<Evse>,
    meterValue?: CrudRepository<MeterValue>,
  ) {
    super(config, namespace, logger, sequelizeInstance);
    this.transaction = transaction ? transaction : new SequelizeRepository<Transaction>(config, namespace, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, namespace, logger, sequelizeInstance);
    this.meterValue = meterValue ? meterValue : new SequelizeRepository<MeterValue>(config, namespace, logger, sequelizeInstance);
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

    const savedTransaction = await this.s.transaction(async (sequelizeTransaction) => {
      // TODO create of update here
      let transaction: Transaction;
      let created = false;
      const existingTransaction = await this.s.models[Transaction.MODEL_NAME].findOne({
        where: {
          stationId,
          isActive: value.eventType !== TransactionEventEnumType.Ended,
        },
        transaction: sequelizeTransaction,
      });
      const updatedTransaction = Transaction.build({
        stationId,
        isActive: value.eventType !== TransactionEventEnumType.Ended,
        evseDatabaseId: evse ? evse.get('databaseId') : null,
        ...value.transactionInfo,
      });
      if (!existingTransaction) {
        transaction = await updatedTransaction.save({ transaction: sequelizeTransaction });
        created = true;
      } else {
        await existingTransaction.update({ ...updatedTransaction }, { transaction: sequelizeTransaction });
        transaction = (await existingTransaction.reload({
          transaction: sequelizeTransaction,
          include: [TransactionEvent, MeterValue],
        })) as Transaction;
      }

      const transactionDatabaseId = transaction.get('id');

      const event = await TransactionEvent.create(
        {
          stationId,
          transactionDatabaseId,
          ...value,
        },
        { transaction: sequelizeTransaction },
      );
      if (event.meterValue && event.meterValue.length > 0) {
        await Promise.all(
          event.meterValue.map(async (meterValue) => {
            await MeterValue.create(
              {
                transactionEventId: event.get('id'),
                transactionDatabaseId: transactionDatabaseId,
                ...meterValue,
              },
              { transaction: sequelizeTransaction },
            );
            this.meterValue.emit('created', [meterValue]);
          }),
        );
      }
      await event.reload({ include: [MeterValue] });
      this.emit('created', [event]);
      await transaction.reload({ include: [TransactionEvent, MeterValue] });
      if (created) {
        this.transaction.emit('created', [transaction]);
      } else {
        this.transaction.emit('updated', [transaction]);
      }
      return transaction;
    });

    return savedTransaction;
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
      include: [MeterValue],
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
}

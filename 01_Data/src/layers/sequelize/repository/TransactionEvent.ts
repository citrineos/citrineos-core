// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type ChargingStateEnumType, type EVSEType, type IdTokenType, TransactionEventEnumType, type TransactionEventRequest, CrudRepository, SystemConfig } from '@citrineos/base';
import { type ITransactionEventRepository } from '../../../interfaces';
import { MeterValue, Transaction, TransactionEvent } from '../model/TransactionEvent';
import { SequelizeRepository } from './Base';
import { IdToken } from '../model/Authorization';
import { Evse } from '../model/DeviceModel';
import { Op } from 'sequelize';
import { Sequelize, type Model } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';

export class TransactionEventRepository extends SequelizeRepository<TransactionEvent> implements ITransactionEventRepository {
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  meterValue: CrudRepository<MeterValue>;

  constructor(config: SystemConfig, namespace: string, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize, transaction?: CrudRepository<Transaction>, evse?: CrudRepository<Evse>, meterValue?: CrudRepository<MeterValue>) {
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
      [evse] = await this.evse.upsert(Evse.build({ ...value.evse }));
    }
    let transaction = Transaction.build({
      stationId,
      isActive: value.eventType !== TransactionEventEnumType.Ended,
      evseDatabaseId: evse ? evse.get('databaseId') : null,
      ...value.transactionInfo,
    });

    [transaction] = await this.transaction.upsert(transaction);

    const transactionDatabaseId = transaction.get('id');
    const event = TransactionEvent.build(
      {
        stationId,
        transactionDatabaseId,
        ...value,
      },
      { include: [MeterValue] },
    );
    event.meterValue?.forEach((meterValue) => (meterValue.transactionDatabaseId = transactionDatabaseId));
    await super.create(event);
    return transaction;
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
    return await this.transaction
      .readAllByQuery({
        where: { stationId, transactionId },
        include: [MeterValue],
      })
      .then((rows) => (rows.length > 0 ? rows[0] : undefined));
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
    const includeObj = evse ? [{ model: Evse, where: { id: evse.id, connectorId: evse.connectorId ? evse.connectorId : null } }] : [];
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
    return this.meterValue.readAllByQuery({
        where: { transactionDatabaseId: transactionDataBaseId },
      })
      .then((row) => row as MeterValue[]);
  }
}

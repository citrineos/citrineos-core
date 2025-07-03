// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

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
import { IdToken } from '../model/Authorization';
import { Evse } from '../model/DeviceModel';
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { MeterValueMapper } from '../mapper/2.0.1';
import { Connector } from '../model/Location';
import { SequelizeChargingStationSequenceRepository } from './ChargingStationSequence';

export class SequelizeTransactionEventRepository
  extends SequelizeRepository<TransactionEvent>
  implements ITransactionEventRepository
{
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  idToken: CrudRepository<IdToken>;
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
    evse?: CrudRepository<Evse>,
    idToken?: CrudRepository<IdToken>,
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
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken
      ? idToken
      : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
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
    let evse: Evse | undefined;
    if (value.evse) {
      [evse] = await this.evse.readOrCreateByQuery(tenantId, {
        where: {
          tenantId,
          id: value.evse.id,
          connectorId: value.evse.connectorId ? value.evse.connectorId : null,
        },
      });
    }

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
          tenantId,
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
        tenantId,
        stationId,
        transactionDatabaseId,
        ...value,
      });

      if (value.idToken && value.idToken.type !== OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
        const idToken = await this.idToken.readOnlyOneByQuery(tenantId, {
          where: {
            idToken: value.idToken.idToken,
            type: value.idToken.type,
          },
          sequelizeTransaction,
        });
        if (!idToken) {
          // TODO: Log Warning...
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
                tenantId,
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
          { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] },
          MeterValue,
          Evse,
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
        include: [{ model: Transaction, where: { transactionId } }, MeterValue, Evse, IdToken],
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
      include: [MeterValue, Evse],
    });
  }

  async readAllTransactionsByStationIdAndEvseAndChargingStates(
    tenantId: number,
    stationId: string,
    evse?: OCPP2_0_1.EVSEType,
    chargingStates?: OCPP2_0_1.ChargingStateEnumType[] | undefined,
  ): Promise<Transaction[]> {
    const includeObj = evse
      ? [
          {
            model: Evse,
            where: { id: evse.id, connectorId: evse.connectorId ? evse.connectorId : null },
          },
        ]
      : [];
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

  async readAllActiveTransactionsIncludeTransactionEventByIdToken(
    tenantId: number,
    idToken: OCPP2_0_1.IdTokenType,
  ): Promise<Transaction[]> {
    return await this.transaction.readAllByQuery(tenantId, {
      where: { isActive: true },
      include: [
        {
          model: TransactionEvent,
          as: Transaction.TRANSACTION_EVENTS_ALIAS,
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

  async readAllActiveTransactionsIncludeStartTransactionByIdToken(
    tenantId: number,
    idToken: string,
  ): Promise<Transaction[]> {
    return await this.transaction.readAllByQuery(tenantId, {
      where: { isActive: true },
      include: [
        {
          model: StartTransaction,
          required: true,
          include: [
            {
              model: IdToken,
              required: true,
              where: {
                idToken: idToken,
              },
            },
          ],
        },
      ],
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
        { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] },
        MeterValue,
        Evse,
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
        { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] },
        MeterValue,
        Evse,
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
      const evseId = transaction.evse?.id;
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
          { model: TransactionEvent, as: Transaction.TRANSACTION_EVENTS_ALIAS, include: [IdToken] },
          MeterValue,
          { model: Evse, where: { id: evseId }, required: true },
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
  ): Promise<void> {
    await this.s.transaction(async (sequelizeTransaction) => {
      const savedMeterValue = await MeterValue.create(
        {
          tenantId,
          transactionDatabaseId: transactionDatabaseId,
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

      // Associate IdToken with StartTransaction
      const idToken = await this.idToken.readOnlyOneByQuery(tenantId, {
        where: {
          idToken: request.idTag,
        },
        sequelizeTransaction,
      });
      if (!idToken) {
        this.logger.error(`Unable to find idTag ${request.idTag}.`);
        throw new Error(`Unable to find idTag ${request.idTag}.`);
      }
      event.idTokenDatabaseId = idToken.id;

      // Associate Connector with StartTransaction
      const connector = await this.connector.readOnlyOneByQuery(tenantId, {
        where: {
          connectorId: request.connectorId,
          stationId,
        },
        sequelizeTransaction,
      });
      if (!connector) {
        this.logger.error(`Unable to find connector ${request.connectorId}.`);
        throw new Error(`Unable to find connector ${request.connectorId}.`);
      }
      event.connectorDatabaseId = connector.id;

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

  async createStopTransaction(
    tenantId: number,
    transactionDatabaseId: number,
    stationId: string,
    meterStop: number,
    timestamp: Date,
    meterValues: MeterValue[],
    reason?: string,
    idTokenDatabaseId?: number,
  ): Promise<StopTransaction> {
    const stopTransaction = await StopTransaction.create({
      tenantId,
      stationId,
      transactionDatabaseId,
      meterStop,
      timestamp: timestamp.toISOString(),
      reason,
      idTokenDatabaseId,
      meterValues,
    });
    this.stopTransaction.emit('created', [stopTransaction]);

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

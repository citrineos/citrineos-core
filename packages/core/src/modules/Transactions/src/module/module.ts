// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  AbstractModule,
  EventGroup,
  type OcppModuleDependencies,
} from '@citrineos/base';
import type {
  ITariffRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';

export interface TransactionsModuleDependencies extends OcppModuleDependencies {
  transactionEventRepository: ITransactionEventRepository;
  tariffRepository: ITariffRepository;
  transactionsHandlers: AbstractHandler[];
}

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _tariffRepository: ITariffRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    transactionEventRepository,
    tariffRepository,
  }: TransactionsModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.Transactions,
      ocppSender,
      logger,
      ocppValidator,
    );
    this._transactionEventRepository = transactionEventRepository;
    this._tariffRepository = tariffRepository;
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get tariffRepository(): ITariffRepository {
    return this._tariffRepository;
  }
}

export default TransactionsModule;

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, AbstractModule, type OcppModuleDependencies } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { ITariffRepository, ITransactionEventRepository } from '@citrineos/dal';

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
    transactionsHandlers,
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
      transactionsHandlers,
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

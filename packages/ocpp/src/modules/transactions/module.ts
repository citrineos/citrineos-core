// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, AbstractModule, type OcppModuleDependencies } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { ITariffRepository } from '@citrineos/dal';

export interface TransactionsModuleDependencies extends OcppModuleDependencies {
  tariffRepository: ITariffRepository;
  transactionsHandlers: AbstractHandler[];
}

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  protected _tariffRepository: ITariffRepository;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
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
    this._tariffRepository = tariffRepository;
  }

  get tariffRepository(): ITariffRepository {
    return this._tariffRepository;
  }
}

export default TransactionsModule;

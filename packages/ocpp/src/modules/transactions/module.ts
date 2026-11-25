// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, AbstractModule, type OcppModuleDependencies } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { ITariffRepository } from '@citrineos/dal';
import type { CostNotifier } from './cost-notifier.js';

export interface TransactionsModuleDependencies extends OcppModuleDependencies {
  tariffRepository: ITariffRepository;
  transactionsHandlers: AbstractHandler[];
  costNotifier?: CostNotifier;
}

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  protected _tariffRepository: ITariffRepository;
  protected _costNotifier?: CostNotifier;

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
    costNotifier,
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
    this._costNotifier = costNotifier;
  }

  get tariffRepository(): ITariffRepository {
    return this._tariffRepository;
  }

  async shutdown(): Promise<void> {
    this._costNotifier?.shutdown();
    await super.shutdown();
  }
}

export default TransactionsModule;

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
    AbstractModule,
    CallAction,
    EventGroup,
    ICache,
    IMessageHandler,
    IMessageSender,
    SystemConfig,
} from '@citrineos/base';
import {
    IAuthorizationRepository,
    IDeviceModelRepository,
    ITariffRepository,
    ITransactionEventRepository,
    sequelize,
} from '@citrineos/data';
import {RabbitMqReceiver, RabbitMqSender, Timer} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import {ILogObj, Logger} from 'tslog';
import {LocationsControllerApi} from '../../apis/LocationsControllerApi';

/**
 * Component that handles transaction related messages.
 */
export class OcpiCredentialsModule extends AbstractModule {
    protected _requests: CallAction[] = [];
    protected _responses: CallAction[] = [];

    protected _transactionEventRepository: ITransactionEventRepository;
    protected _authorizeRepository: IAuthorizationRepository;
    protected _deviceModelRepository: IDeviceModelRepository;
    protected _tariffRepository: ITariffRepository;

    private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
    private readonly _costUpdatedInterval: number | undefined;

    private locationsControllerApi = new LocationsControllerApi();

    /**
     * This is the constructor function that initializes the {@link TransactionModule}.
     *
     * @param {SystemConfig} config - The `config` contains configuration settings for the module.
     *
     * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
     *
     * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
     * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
     *
     * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
     * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
     *
     * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
     * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
     *
     * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository} which represents a repository for accessing and manipulating authorization data.
     * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance
     * is created and used.
     *
     * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating variable data.
     * If no `authorizeRepository` is provided, a default {@link sequelize:authorizeRepository} instance is
     * created and used.
     *
     * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
     * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is
     * created and used.
     *
     * @param {ITariffRepository} [tariffRepository] - An optional parameter of type {@link ITariffRepository} which
     * represents a repository for accessing and manipulating variable data.
     * If no `deviceModelRepository` is provided, a default {@link sequelize:tariffRepository} instance is
     * created and used.
     */
    constructor(
        config: SystemConfig,
        cache: ICache,
        sender?: IMessageSender,
        handler?: IMessageHandler,
        logger?: Logger<ILogObj>,
        transactionEventRepository?: ITransactionEventRepository,
        authorizeRepository?: IAuthorizationRepository,
        deviceModelRepository?: IDeviceModelRepository,
        tariffRepository?: ITariffRepository,
    ) {
        super(
            config,
            cache,
            handler || new RabbitMqReceiver(config, logger),
            sender || new RabbitMqSender(config, logger),
            EventGroup.Transactions,
            logger,
        );

        const timer = new Timer();
        this._logger.info('Initializing...');

        if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
            throw new Error(
                'Could not initialize module due to failure in handler initialization.',
            );
        }

        this._transactionEventRepository =
            transactionEventRepository ||
            new sequelize.TransactionEventRepository(config, logger);
        this._authorizeRepository =
            authorizeRepository ||
            new sequelize.AuthorizationRepository(config, logger);
        this._deviceModelRepository =
            deviceModelRepository ||
            new sequelize.DeviceModelRepository(config, logger);
        this._tariffRepository =
            tariffRepository || new sequelize.TariffRepository(config, logger);

        this._sendCostUpdatedOnMeterValue =
            config.modules.transactions.sendCostUpdatedOnMeterValue;
        this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;

        this._logger.info(`Initialized in ${timer.end()}ms...`);
    }

    get transactionEventRepository(): ITransactionEventRepository {
        return this._transactionEventRepository;
    }

    get authorizeRepository(): IAuthorizationRepository {
        return this._authorizeRepository;
    }

    get deviceModelRepository(): IDeviceModelRepository {
        return this._deviceModelRepository;
    }

    get tariffRepository(): ITariffRepository {
        return this._tariffRepository;
    }
}

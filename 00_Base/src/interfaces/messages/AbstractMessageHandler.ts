// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Logger, ILogObj } from "tslog";
import { IMessageHandler, IMessage, OcppRequest, OcppResponse, OcppError } from "../..";
import { SystemConfig } from "../../config/types";
import { CallAction } from "../../ocpp/rpc/message";
import { IModule } from "../modules";
import { HandlerProperties } from ".";

/**
 * Abstract class implementing {@link IMessageHandler}.
 */
export abstract class AbstractMessageHandler implements IMessageHandler {

    /**
     * Fields
     */

    protected _config: SystemConfig;
    protected _logger: Logger<ILogObj>;

    /**
     * Constructor
     *
     * @param config The system configuration.
     * @param logger [Optional] The logger to use.
     */
    constructor(config: SystemConfig, logger?: Logger<ILogObj>) {
        this._config = config;
        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });
    }

    /**
     * Abstract Methods
     */

    abstract subscribe(identifier: string, actions?: CallAction[], filter?: { [k: string]: string; }): Promise<boolean>;
    abstract unsubscribe(identifier: string): Promise<boolean>;
    abstract handle(message: IMessage<OcppRequest | OcppResponse | OcppError>, props?: HandlerProperties): Promise<void>;
    abstract shutdown(): void;

    abstract get module(): IModule | undefined;
    abstract set module(value: IModule | undefined);
}
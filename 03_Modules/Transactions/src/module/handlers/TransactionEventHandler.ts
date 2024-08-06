import {
    AbstractModule, AdditionalInfoType,
    AttributeEnumType, AuthorizationStatusEnumType, CallAction, CostUpdatedRequest,
    HandlerProperties, IdTokenInfoType, IdTokenType,
    IMessage, MeterValueUtils, SystemConfig,
    TransactionEventEnumType,
    TransactionEventRequest,
    TransactionEventResponse
} from "@citrineos/base";
import {
    Authorization,
    IAuthorizationRepository, IDeviceModelRepository,
    ITariffRepository,
    ITransactionEventRepository,
    Tariff,
    Transaction,
    VariableAttribute
} from "@citrineos/data";
import {IHandler} from "./IHandler";
import {ILogObj, Logger} from "tslog";
import {IAuthorizer} from "@citrineos/util";

export class TransactionEventHandler implements IHandler {
    declare sendCostUpdatedOnMeterValue: boolean | undefined;
    declare costUpdatedInterval: number | undefined;

    constructor(
                readonly config: SystemConfig,
                readonly abstractModule: AbstractModule,
                readonly transactionEventRepository: ITransactionEventRepository,
                readonly tariffRepository: ITariffRepository,
                protected authorizeRepository: IAuthorizationRepository,
                protected deviceModelRepository: IDeviceModelRepository,
                private authorizers: IAuthorizer[],
                readonly logger: Logger<ILogObj>,) {
        this.sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
        this.costUpdatedInterval = config.modules.transactions.costUpdatedInterval;
    }

    async handle(message: IMessage<TransactionEventRequest>,
                 props?: HandlerProperties) {
        const stationId: string = message.context.stationId;

        await this.transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
            message.payload,
            stationId,
        );

        const transactionEvent = message.payload;
        const transactionId = transactionEvent.transactionInfo.transactionId;
        if (transactionEvent.idToken) {
            const authorizations =
                await this.authorizeRepository.readAllByQuerystring({
                    ...transactionEvent.idToken,
                });
            const response = await this.buildTransactionEventResponse(
                authorizations,
                message,
                stationId,
                transactionId,
                transactionEvent,
            );
            this.abstractModule.sendCallResultWithMessage(message, response).then(
                (messageConfirmation) => {
                    this.logger.debug(
                        'Transaction response sent: ',
                        messageConfirmation,
                    );
                },
            );
        } else {
            const response: TransactionEventResponse = {
                // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
            };

            const transaction: Transaction | undefined =
                await this.transactionEventRepository.readTransactionByStationIdAndTransactionId(
                    stationId,
                    transactionId,
                );

            if (message.payload.eventType === TransactionEventEnumType.Updated) {
                // I02 - Show EV Driver Running Total Cost During Charging
                if (
                    transaction &&
                    transaction.isActive &&
                    this.sendCostUpdatedOnMeterValue
                ) {
                    response.totalCost = await this.calculateTotalCost(
                        stationId,
                        transaction.id,
                        transaction.totalKwh,
                    );
                }

                // I06 - Update Tariff Information During Transaction
                const tariffAvailableAttributes: VariableAttribute[] =
                    await this.deviceModelRepository.readAllByQuerystring({
                        stationId: stationId,
                        component_name: 'TariffCostCtrlr',
                        variable_instance: 'Tariff',
                        variable_name: 'Available',
                        type: AttributeEnumType.Actual,
                    });
                const supportTariff: boolean =
                    tariffAvailableAttributes.length !== 0 &&
                    Boolean(tariffAvailableAttributes[0].value);

                if (supportTariff && transaction && transaction.isActive) {
                    this.logger.debug(
                        `Checking if updated tariff information is available for traction ${transaction.transactionId}`,
                    );
                    // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
                }
            }

            if (
                message.payload.eventType === TransactionEventEnumType.Ended &&
                transaction
            ) {
                response.totalCost = await this.calculateTotalCost(
                    stationId,
                    transaction.id,
                    transaction.totalKwh,
                );
            }

            this.abstractModule.sendCallResultWithMessage(message, response).then(
                (messageConfirmation) => {
                    this.logger.debug(
                        'Transaction response sent: ',
                        messageConfirmation,
                    );
                },
            );
        }
    }

    private async calculateTotalCost(
        stationId: string,
        transactionDbId: number,
        totalKwh?: number,
    ): Promise<number> {
        // TODO: This is a temp workaround. We need to refactor the calculation of totalCost when tariff
        //  implementation is finalized
        let totalCost = 0;

        const tariff: Tariff | undefined =
            await this.tariffRepository.findByStationId(stationId);
        if (tariff) {
            this.logger.debug(`Tariff ${tariff.id} found for station ${stationId}`);
            if (!totalKwh) {
                totalKwh = MeterValueUtils.getTotalKwh(
                    await this.transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
                        transactionDbId,
                    ),
                );

                await Transaction.update(
                    { totalKwh: totalKwh },
                    { where: { id: transactionDbId }, returning: false },
                );
            }

            this.logger.debug(`TotalKwh: ${totalKwh}`);
            totalCost = this._roundCost(totalKwh * tariff.pricePerKwh);
        } else {
            this.logger.error(`Tariff not found for station ${stationId}`);
        }

        return totalCost;
    }

    /**
     * Round floor the given cost to 2 decimal places, e.g., given 1.2378, return 1.23
     *
     * @param {number} cost - cost
     * @return {number} rounded cost
     */
    private _roundCost(cost: number): number {
        return Math.floor(cost * 100) / 100;
    }

    private async buildTransactionEventResponse(
        authorizations: Authorization[],
        message: IMessage<TransactionEventRequest>,
        stationId: string,
        transactionId: string,
        transactionEvent: TransactionEventRequest,
    ): Promise<TransactionEventResponse> {
        const transactionEventResponse: TransactionEventResponse = {
            idTokenInfo: {
                status: AuthorizationStatusEnumType.Unknown,
                // TODO determine how/if to set personalMessage
            },
        };

        if (authorizations.length !== 1) {
            return transactionEventResponse;
        }

        const authorization = authorizations[0];
        if (authorization) {
            if (authorization.idTokenInfo) {
                // Extract DTO fields from sequelize Model<any, any> objects
                const idTokenInfo: IdTokenInfoType = {
                    status: authorization.idTokenInfo.status,
                    cacheExpiryDateTime: authorization.idTokenInfo.cacheExpiryDateTime,
                    chargingPriority: authorization.idTokenInfo.chargingPriority,
                    language1: authorization.idTokenInfo.language1,
                    evseId: authorization.idTokenInfo.evseId,
                    groupIdToken: authorization.idTokenInfo.groupIdToken
                        ? {
                            additionalInfo:
                                authorization.idTokenInfo.groupIdToken.additionalInfo &&
                                authorization.idTokenInfo.groupIdToken.additionalInfo.length >
                                0
                                    ? (authorization.idTokenInfo.groupIdToken.additionalInfo.map(
                                        (additionalInfo) => ({
                                            additionalIdToken: additionalInfo.additionalIdToken,
                                            type: additionalInfo.type,
                                        }),
                                    ) as [AdditionalInfoType, ...AdditionalInfoType[]])
                                    : undefined,
                            idToken: authorization.idTokenInfo.groupIdToken.idToken,
                            type: authorization.idTokenInfo.groupIdToken.type,
                        }
                        : undefined,
                    language2: authorization.idTokenInfo.language2,
                    personalMessage: authorization.idTokenInfo.personalMessage,
                };

                if (idTokenInfo.status === AuthorizationStatusEnumType.Accepted) {
                    if (
                        idTokenInfo.cacheExpiryDateTime &&
                        new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
                    ) {
                        transactionEventResponse.idTokenInfo = {
                            status: AuthorizationStatusEnumType.Invalid,
                            groupIdToken: idTokenInfo.groupIdToken,
                            // TODO determine how/if to set personalMessage
                        };
                    } else {
                        // TODO: Determine how to check for NotAllowedTypeEVSE, NotAtThisLocation, NotAtThisTime, NoCredit
                        // TODO: allow for a 'real time auth' type call to fetch token status.
                        transactionEventResponse.idTokenInfo = idTokenInfo;
                    }
                    for (const authorizer of this.authorizers) {
                        if (
                            transactionEventResponse.idTokenInfo.status !==
                            AuthorizationStatusEnumType.Accepted
                        ) {
                            break;
                        }
                        const result: Partial<IdTokenType> = await authorizer.authorize(
                            authorization,
                            message.context,
                        );
                        Object.assign(transactionEventResponse.idTokenInfo, result);
                    }
                } else {
                    // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
                    // N.B. Other non-Accepted statuses should not be allowed to be stored.
                    transactionEventResponse.idTokenInfo = idTokenInfo;
                }
            } else {
                // Assumed to always be valid without IdTokenInfo
                transactionEventResponse.idTokenInfo = {
                    status: AuthorizationStatusEnumType.Accepted,
                    // TODO determine how/if to set personalMessage
                };
            }
        }

        if (
            transactionEvent.eventType === TransactionEventEnumType.Started &&
            transactionEventResponse &&
            transactionEventResponse.idTokenInfo?.status ===
            AuthorizationStatusEnumType.Accepted &&
            transactionEvent.idToken
        ) {
            if (this.costUpdatedInterval) {
                this.updateCost(
                    stationId,
                    transactionId,
                    this.costUpdatedInterval,
                    message.context.tenantId,
                );
            }

            // TODO there should only be one active transaction per evse of a station.
            // old transactions should be marked inactive and an alert should be raised (this can only happen in the field with charger bugs or missed messages)

            // Check for ConcurrentTx
            const activeTransactions =
                await this.transactionEventRepository.readAllActiveTransactionsByIdToken(
                    transactionEvent.idToken,
                );

            // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
            if (activeTransactions.length > 1) {
                const groupIdToken = transactionEventResponse.idTokenInfo?.groupIdToken;
                transactionEventResponse.idTokenInfo = {
                    status: AuthorizationStatusEnumType.ConcurrentTx,
                    groupIdToken: groupIdToken,
                    // TODO determine how/if to set personalMessage
                };
            }
        }

        return transactionEventResponse;
    }

    /**
     * Internal method to execute a costUpdated request for an ongoing transaction repeatedly based on the costUpdatedInterval
     *
     * @param {string} stationId - The identifier of the client connection.
     * @param {string} transactionId - The identifier of the transaction.
     * @param {number} costUpdatedInterval - The costUpdated interval in milliseconds.
     * @param {string} tenantId - The identifier of the tenant.
     * @return {void} This function does not return anything.
     */
    private updateCost(
        stationId: string,
        transactionId: string,
        costUpdatedInterval: number,
        tenantId: string,
    ): void {
        setInterval(async () => {
            const transaction: Transaction | undefined =
                await this.transactionEventRepository.readTransactionByStationIdAndTransactionId(
                    stationId,
                    transactionId,
                );
            if (transaction && transaction.isActive) {
                const cost = await this.calculateTotalCost(stationId, transaction.id);
                this.abstractModule.sendCall(stationId, tenantId, CallAction.CostUpdated, {
                    totalCost: cost,
                    transactionId: transaction.transactionId,
                } as CostUpdatedRequest).then(() => {
                    this.logger.info(
                        `Sent costUpdated for ${transaction.transactionId} with totalCost ${cost}`,
                    );
                });
            }
        }, costUpdatedInterval * 1000);
    }
}

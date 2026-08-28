// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type BootstrapConfig,
  CacheNamespace,
  type ICache,
  type IMessage,
  type IOcppSender,
  OcppError,
  recordAuthorizeResult,
} from '@citrineos/base';
import {
  AttributeEnum,
  AuthorizationStatusEnum,
  ErrorCode,
  EventGroup,
  type HandlerProperties,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPPVersion,
  type SystemConfig,
  TransactionEventEnum,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import {
  ChargingSchedule,
  type IChargingProfileRepository,
  type IDeviceModelRepository,
  type ITransactionEventRepository,
  OCPP2_0_1_Mapper,
  Transaction,
  VariableAttribute,
} from '@dal/index.js';
import { isForeignKeyConstraintError } from '@util/errors.js';
import type { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';
import { SignedMeterValuesUtil } from '@/util/index.js';
import type { CostNotifier } from '@modules/Transactions/src/module/CostNotifier.js';
import type { CostCalculator } from '@modules/Transactions/src/module/CostCalculator.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.TransactionEvent)
export class TransactionEventRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _cache: ICache;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _costCalculator: CostCalculator;
  protected _costNotifier: CostNotifier;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _signedMeterValuesUtil: SignedMeterValuesUtil;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _transactionService: TransactionService;

  private readonly _costUpdatedInterval: number | undefined;
  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;

  constructor({
    logger,
    ocppSender,
    cache,
    chargingProfileRepository,
    config,
    costCalculator,
    costNotifier,
    deviceModelRepository,
    signedMeterValuesUtil,
    transactionEventRepository,
    transactionService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    cache: ICache;
    chargingProfileRepository: IChargingProfileRepository;
    config: BootstrapConfig & SystemConfig;
    costCalculator: CostCalculator;
    costNotifier: CostNotifier;
    deviceModelRepository: IDeviceModelRepository;
    signedMeterValuesUtil: SignedMeterValuesUtil;
    transactionEventRepository: ITransactionEventRepository;
    transactionService: TransactionService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._cache = cache;
    this._chargingProfileRepository = chargingProfileRepository;
    this._costCalculator = costCalculator;
    this._costNotifier = costNotifier;
    this._deviceModelRepository = deviceModelRepository;
    this._signedMeterValuesUtil = signedMeterValuesUtil;
    this._transactionEventRepository = transactionEventRepository;
    this._transactionService = transactionService;

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;
  }

  async handle(
    message: IMessage<OCPP2_request_types.TransactionEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    //TODO: Need additional handling for OCPP 2.1 as we need to extend the transaction service for ocpp 2.1

    this._logger.debug(
      this.createHandlerReceivedMessageLog(`TransactionEventRequest ${message.protocol}`),
      message,
      props,
    );

    const tenantId: number = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;
    const isOcpp21 = message.protocol === OCPPVersion.OCPP2_1;

    const transactionEvent = message.payload;
    const transactionId = transactionEvent.transactionInfo.transactionId;
    let response: OCPP2_response_types.TransactionEventResponse | undefined = undefined;
    let transaction: Transaction | undefined = undefined;
    if (transactionEvent.idToken) {
      if (isOcpp21) {
        response = await this._transactionService.authorizeOcpp21IdToken(
          tenantId,
          transactionEvent,
          message.context,
        );
      } else {
        response = await this._transactionService.authorizeOcpp201IdToken(
          tenantId,
          transactionEvent,
          message.context,
        );
      }

      recordAuthorizeResult({
        status: response.idTokenInfo?.status,
        ocppVersion: String(message.protocol),
        action: 'TransactionEvent',
      });
    }
    if (transactionEvent.eventType !== TransactionEventEnum.Started) {
      const existingTransaction =
        await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
          tenantId,
          ocppConnectionName,
          transactionId,
        );
      if (existingTransaction && !existingTransaction.isActive) {
        this._logger.warn(
          `Received ${transactionEvent.eventType} for already-ended transaction ${transactionId} on ${ocppConnectionName}. Ignoring.`,
        );
        await this._ocppSender.sendCallResultWithMessage(message, response ?? {});
        return;
      }
    }

    try {
      transaction =
        await this._transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
          tenantId,
          message.payload,
          ocppConnectionName,
        );
    } catch (error) {
      if (isForeignKeyConstraintError(error)) {
        await this._ocppSender.sendCallErrorWithMessage(
          message,
          new OcppError(
            message.context.correlationId,
            ErrorCode.PropertyConstraintViolation,
            'Referenced entity does not exist.',
          ),
        );
        return;
      }
      throw error;
    }
    if (message.payload.reservationId) {
      await this._transactionService.deactivateReservation(
        tenantId,
        transactionId,
        message.payload.reservationId,
        ocppConnectionName,
      );
    }
    await this.deactivateOtherActiveTransactionsAtEvse201(
      tenantId,
      transactionId,
      ocppConnectionName,
      transactionEvent,
    );

    if (response) {
      // F07: Remote start with fixed cost, energy, SoC or time
      // When TransactionEvent(Started) arrives with remoteStartId, check cache for stored transactionLimit
      if (
        transactionEvent.eventType === TransactionEventEnum.Started &&
        transactionEvent.transactionInfo.remoteStartId &&
        isOcpp21
      ) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
        const remoteStartId = transactionEvent.transactionInfo.remoteStartId;

        try {
          const cacheKey = `remotestart:${tenantId}:${ocppConnectionName}:${remoteStartId}`;
          const cachedLimitStr = await this._cache.get<string>(cacheKey, CacheNamespace.Other);

          if (cachedLimitStr) {
            const remoteStartLimit: OCPP2_1.TransactionLimitType = JSON.parse(cachedLimitStr);

            // F07.FR.02: Set transactionLimit in response
            if (
              remoteStartLimit.maxCost != null ||
              remoteStartLimit.maxEnergy != null ||
              remoteStartLimit.maxTime != null ||
              remoteStartLimit.maxSoC != null
            ) {
              ocpp21Response.transactionLimit = {};
              if (remoteStartLimit.maxCost != null) {
                ocpp21Response.transactionLimit.maxCost = remoteStartLimit.maxCost;
              }
              if (remoteStartLimit.maxEnergy != null) {
                ocpp21Response.transactionLimit.maxEnergy = remoteStartLimit.maxEnergy;
              }
              if (remoteStartLimit.maxTime != null) {
                ocpp21Response.transactionLimit.maxTime = remoteStartLimit.maxTime;
              }
              if (remoteStartLimit.maxSoC != null) {
                ocpp21Response.transactionLimit.maxSoC = remoteStartLimit.maxSoC;
              }

              // Clear the cache entry - limit is consumed on first transaction start
              await this._cache.remove(cacheKey, CacheNamespace.Other);

              this._logger.info(
                `Set transactionLimit from RequestStartTransaction for station ${ocppConnectionName}, ` +
                  `remoteStartId=${remoteStartId}, transaction ${transactionId}: ` +
                  `maxCost=${remoteStartLimit.maxCost}, maxEnergy=${remoteStartLimit.maxEnergy}, ` +
                  `maxTime=${remoteStartLimit.maxTime}, maxSoC=${remoteStartLimit.maxSoC}`,
              );
            }
          }
        } catch (error) {
          this._logger.error(
            `Failed to read remote start transaction limit from cache for remoteStartId ${remoteStartId}`,
            error,
          );
        }
      }

      // Include transactionLimit in TransactionEventResponse when setting/changing a limit.
      if (isOcpp21 && transaction) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
        const stationTransactionLimit = (
          message.payload as unknown as OCPP2_1.TransactionEventRequest
        ).transactionInfo?.transactionLimit;

        this.syncTransactionLimitToResponse(
          ocpp21Response,
          transaction,
          stationTransactionLimit,
          ocppConnectionName,
          transactionId,
        );
      }

      // For DirectPayment tokens on Started events, include transactionLimit.
      // C25: First check cache for QR web payment limits (maxCost/maxTime/maxEnergy from QR URL).
      // Fall back to PaymentCtrlr.AuthorizationAmount from the device model if no QR limits found.
      if (
        transactionEvent.eventType === TransactionEventEnum.Started &&
        response.idTokenInfo?.status === AuthorizationStatusEnum.Accepted &&
        isOcpp21 &&
        transactionEvent.idToken?.type === OCPP2_1.IdTokenEnumType.DirectPayment
      ) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;

        // C25.FR.03-06: Check cache for QR payment limits set by initiateWebPayment endpoint
        if (!ocpp21Response.transactionLimit && transactionEvent.evse?.id != null) {
          try {
            const cacheKey = `webpayment:${tenantId}:${ocppConnectionName}:${transactionEvent.evse.id}`;
            const cachedLimitsStr = await this._cache.get<string>(cacheKey, CacheNamespace.Other);
            if (cachedLimitsStr) {
              const qrLimits: { maxCost?: number; maxTime?: number; maxEnergy?: number } =
                JSON.parse(cachedLimitsStr);
              if (
                qrLimits.maxCost != null ||
                qrLimits.maxTime != null ||
                qrLimits.maxEnergy != null
              ) {
                ocpp21Response.transactionLimit = {};
                if (qrLimits.maxCost != null) {
                  ocpp21Response.transactionLimit.maxCost = qrLimits.maxCost;
                }
                if (qrLimits.maxTime != null) {
                  ocpp21Response.transactionLimit.maxTime = qrLimits.maxTime;
                }
                if (qrLimits.maxEnergy != null) {
                  ocpp21Response.transactionLimit.maxEnergy = qrLimits.maxEnergy;
                }
                await this._cache.remove(cacheKey, CacheNamespace.Other);
                this._logger.info(
                  `Set transactionLimit from QR payment session for station ${ocppConnectionName}, ` +
                    `evseId=${transactionEvent.evse.id}, transaction ${transactionId}: ` +
                    `maxCost=${qrLimits.maxCost}, maxTime=${qrLimits.maxTime}, ` +
                    `maxEnergy=${qrLimits.maxEnergy}`,
                );
              }
            }
          } catch (error) {
            this._logger.error('Failed to read QR payment limits from cache', error);
          }
        }

        // Fall back to PaymentCtrlr.AuthorizationAmount if no QR limits were found
        if (!ocpp21Response.transactionLimit) {
          try {
            const authAmountAttributes: VariableAttribute[] =
              await this._deviceModelRepository.readAllByQuerystring(tenantId, {
                tenantId,
                ocppConnectionName,
                component_name: 'PaymentCtrlr',
                variable_name: 'AuthorizationAmount',
                type: AttributeEnum.Actual,
              });

            if (authAmountAttributes.length > 0 && authAmountAttributes[0].value) {
              const authorizationAmount = parseFloat(authAmountAttributes[0].value);
              if (!isNaN(authorizationAmount) && authorizationAmount > 0) {
                // Only set if not already set by another flow (e.g., C17 prepaid)
                ocpp21Response.transactionLimit = {
                  maxCost: authorizationAmount,
                };
                this._logger.info(
                  `Set transactionLimit.maxCost=${authorizationAmount} for DirectPayment ` +
                    `token on station ${ocppConnectionName}, transaction ${transactionId}.`,
                );
              }
            }
          } catch (error) {
            this._logger.error(
              'Failed to read PaymentCtrlr.AuthorizationAmount from device model',
              error,
            );
          }
        }
      }

      // E16.FR.02: Persist the CSMS-set transactionLimit to the DB so that subsequent
      // TransactionEventRequests can have the limit echoed back via the E16 sync logic.
      // This covers limits set by C17 (prepaid), C25 (QR web payment), and E16 itself.
      if (isOcpp21 && transaction) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
        await this.persistTransactionLimitToDb(
          tenantId,
          ocpp21Response,
          transactionId,
          ocppConnectionName,
        );
      }

      const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(
        message,
        response,
      );
      this._logger.debug('Transaction response sent: ', messageConfirmation);
      // If the transaction is accepted and interval is set, start the cost update
      if (
        transactionEvent.eventType === TransactionEventEnum.Started &&
        response.idTokenInfo?.status === AuthorizationStatusEnum.Accepted &&
        this._costUpdatedInterval
      ) {
        this._costNotifier.notifyWhileActive(
          ocppConnectionName,
          transactionId,
          message.context.tenantId,
          this._costUpdatedInterval,
          message.protocol,
        );
      }
    } else {
      const response: OCPP2_response_types.TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };

      // E16.FR.02: Include transactionLimit in TransactionEventResponse when setting/changing a limit.
      if (isOcpp21 && transaction) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
        const stationTransactionLimit = (
          message.payload as unknown as OCPP2_1.TransactionEventRequest
        ).transactionInfo?.transactionLimit;

        this.syncTransactionLimitToResponse(
          ocpp21Response,
          transaction,
          stationTransactionLimit,
          ocppConnectionName,
          transactionId,
        );
      }

      if (message.payload.eventType === TransactionEventEnum.Updated) {
        // I02 - Show EV Driver Running Total Cost During Charging
        if (
          transaction &&
          transaction.isActive &&
          transaction.totalKwh &&
          this._sendCostUpdatedOnMeterValue
        ) {
          response.totalCost = await this._costCalculator.calculateTotalCost(
            tenantId,
            transaction.connectorId,
            transaction.totalKwh,
          );
        }

        // C23: Increasing authorization amount
        // When CS sends TransactionEventRequest(Updated) with triggerReason=LimitSet (OCPP 2.1),
        // it indicates the authorization amount has been increased and transactionLimit.maxCost updated.
        if (isOcpp21 && transaction && transaction.isActive) {
          const ocpp21Payload = message.payload as unknown as OCPP2_1.TransactionEventRequest;
          if (
            ocpp21Payload.triggerReason === OCPP2_1.TriggerReasonEnumType.LimitSet &&
            ocpp21Payload.transactionInfo?.transactionLimit?.maxCost != null
          ) {
            const newMaxCost = ocpp21Payload.transactionInfo.transactionLimit.maxCost;
            this._logger.info(
              `Authorization amount increased for station ${ocppConnectionName}, ` +
                `transaction ${transactionId}. New maxCost=${newMaxCost}.`,
            );

            // Persist the updated limit to the transactionLimit column so that
            // subsequent E16 sync checks read the correct value.
            try {
              const updatedLimit = {
                ...(transaction.transactionLimit ?? {}),
                maxCost: newMaxCost,
              };
              await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
                tenantId,
                { transactionLimit: updatedLimit } as Partial<Transaction>,
                transactionId,
                ocppConnectionName,
              );
            } catch (error) {
              this._logger.error(
                `Failed to store updated maxCost for transaction ${transactionId}`,
                error,
              );
            }
          }
        }

        // I06 - Update Tariff Information During Transaction
        const tariffAvailableAttributes: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            ocppConnectionName: ocppConnectionName,
            component_name: 'TariffCostCtrlr',
            variable_instance: 'Tariff',
            variable_name: 'Available',
            type: AttributeEnum.Actual,
          });
        // A device model boolean arrives as the string "false" or "true" (Part 2 §2.1.4), so it
        // has to be compared, not coerced.
        const supportTariff: boolean =
          tariffAvailableAttributes[0]?.value?.toLowerCase() === 'true';

        if (supportTariff && transaction && transaction.isActive) {
          this._logger.debug(
            `Checking if updated tariff information is available for traction ${transaction.transactionId}`,
          );
          // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
        }

        // E17 - Transaction resumption after power loss
        // When CS sends TransactionEventRequest(Updated) with triggerReason=TxResumed,
        // it indicates the transaction has resumed after a power loss or reboot.
        // CSMS should re-send any applicable TxProfile charging profiles for this transaction.
        if (isOcpp21 && transaction && transaction.isActive) {
          const ocpp21Payload = message.payload as unknown as OCPP2_1.TransactionEventRequest;
          if (ocpp21Payload.triggerReason === OCPP2_1.TriggerReasonEnumType.TxResumed) {
            this._logger.info(
              `Transaction ${transactionId} resumed after power loss on station ${ocppConnectionName}. ` +
                `Checking for TxProfile charging profiles to re-send.`,
            );

            try {
              // Query active TxProfile charging profiles associated with this transaction
              const txProfiles = await this._chargingProfileRepository.readAllByQuery(tenantId, {
                where: {
                  tenantId,
                  ocppConnectionName,
                  chargingProfilePurpose: OCPP2_1.ChargingProfilePurposeEnumType.TxProfile,
                  transactionDatabaseId: transaction.id,
                  isActive: true,
                },
                include: [{ model: ChargingSchedule, as: 'chargingSchedule' }],
              });

              if (txProfiles.length > 0) {
                this._logger.info(
                  `Found ${txProfiles.length} active TxProfile(s) to re-send for ` +
                    `transaction ${transactionId} on station ${ocppConnectionName}.`,
                );

                for (const profile of txProfiles) {
                  try {
                    const chargingProfileType =
                      OCPP2_0_1_Mapper.ChargingProfileMapper.toChargingProfileType(
                        profile,
                        transactionId,
                      );
                    await this._ocppSender.sendCall({
                      ocppConnectionName,
                      tenantId,
                      protocol: message.protocol,
                      action: OCPP_CallAction.SetChargingProfile,
                      eventGroup: EventGroup.Transactions,
                      payload: {
                        evseId: profile.evseId ?? transaction.evseId,
                        chargingProfile: chargingProfileType,
                      } as OCPP2_request_types.SetChargingProfileRequest,
                    });
                    this._logger.info(
                      `Re-sent TxProfile id=${profile.id} for transaction ${transactionId} ` +
                        `on station ${ocppConnectionName}.`,
                    );
                  } catch (sendError) {
                    this._logger.error(
                      `Failed to re-send TxProfile id=${profile.id} for ` +
                        `transaction ${transactionId} on station ${ocppConnectionName}`,
                      sendError,
                    );
                  }
                }
              } else {
                this._logger.debug(
                  `No active TxProfile charging profiles found for ` +
                    `transaction ${transactionId} on station ${ocppConnectionName}.`,
                );
              }
            } catch (error) {
              this._logger.error(
                `Failed to query TxProfile charging profiles for ` +
                  `transaction ${transactionId} on station ${ocppConnectionName}`,
                error,
              );
            }
          }
        }
      }

      if (message.payload.eventType === TransactionEventEnum.Ended && transaction.totalKwh) {
        response.totalCost = await this._costCalculator.calculateTotalCost(
          tenantId,
          transaction.connectorId,
          transaction.totalKwh,
        );
      }

      // OCPP 2.1 C20 Cancel transaction after start of transaction before costs has been incurred
      if (
        isOcpp21 &&
        transactionEvent.eventType === TransactionEventEnum.Ended &&
        (transactionEvent.triggerReason === OCPP2_1.TriggerReasonEnumType.StopAuthorized ||
          transactionEvent.triggerReason === OCPP2_1.TriggerReasonEnumType.EVConnectTimeout) &&
        (!transaction.totalKwh || transaction.totalKwh <= 0)
      ) {
        const tariffEnabled: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            ocppConnectionName: message.context.ocppConnectionName,
            component_name: 'TariffCostCtrlr',
            variable_name: 'Enabled',
            variable_instance: 'Tariff',
            type: AttributeEnum.Actual,
          });
        // C20.FR.03: central cost calculation is what applies when the station is not doing it
        // itself, i.e. TariffCostCtrlr.Enabled[Tariff] is false or was never reported. A device
        // model boolean arrives as the string "false" or "true" (Part 2 §2.1.4).
        const localCostCalculation = tariffEnabled[0]?.value?.toLowerCase() === 'true';
        if (!localCostCalculation) {
          this._logger.info(`Central cost calculation is used for transaction ${transactionId}`);
          response.totalCost = 0;
        }
      }

      // Store total cost in db
      if (response.totalCost && transaction) {
        await this._transactionEventRepository.updateTransactionTotalCostById(
          tenantId,
          response.totalCost,
          transaction.id,
        );
      }

      // C21.FR.05/FR.06: If SettlementByCSMS is true and transaction ended, CSMS should settle with PSP
      if (message.payload.eventType === TransactionEventEnum.Ended && transaction) {
        try {
          const settlementByCSMSAttributes: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring(tenantId, {
              tenantId,
              ocppConnectionName,
              component_name: 'PaymentCtrlr',
              variable_name: 'SettlementByCSMS',
              type: AttributeEnum.Actual,
            });

          const settlementByCSMS =
            settlementByCSMSAttributes.length > 0 &&
            settlementByCSMSAttributes[0].value?.toLowerCase() === 'true';

          if (settlementByCSMS) {
            const totalCost = response.totalCost ?? transaction.totalCost;
            this._logger.info(
              `SettlementByCSMS is true for station ${ocppConnectionName}, ` +
                `transaction ${transaction.transactionId}. ` +
                `CSMS should settle totalCost=${totalCost} with PSP. ` +
                `This requires external PSP integration.`,
            );
            // PSP settlement integration point:
            // Implementers should extend this to call their PSP API to settle
            // the payment using the pspRef from the authorization's idToken.
          }
        } catch (error) {
          this._logger.error(
            'Failed to check PaymentCtrlr.SettlementByCSMS from device model',
            error,
          );
        }
      }

      if (transactionEvent.meterValue) {
        const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
          tenantId,
          ocppConnectionName,
          transactionEvent.meterValue,
        );

        if (!meterValuesValid) {
          this._logger.warn(
            'One or more MeterValues in this TransactionEvent have an invalid signature.',
          );
        }
      }

      // E16.FR.02: Persist the CSMS-set transactionLimit to the DB so that subsequent
      // TransactionEventRequests can have the limit echoed back via the E16 sync logic.
      if (isOcpp21 && transaction) {
        const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
        await this.persistTransactionLimitToDb(
          tenantId,
          ocpp21Response,
          transactionId,
          ocppConnectionName,
        );
      }

      const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(
        message,
        response,
      );
      this._logger.debug(
        this.createHandlerSentMessageLog('TransactionEventResponse'),
        messageConfirmation,
      );
    }
  }

  protected async deactivateOtherActiveTransactionsAtEvse201(
    tenantId: number,
    transactionId: string,
    ocppConnectionName: string,
    request: OCPP2_request_types.TransactionEventRequest,
  ) {
    const eventType = request.eventType;
    const evse = request.evse;
    const evseIsDefined = evse !== null && evse !== undefined;
    if (evseIsDefined) {
      if (
        eventType === TransactionEventEnum.Started ||
        eventType === TransactionEventEnum.Updated
      ) {
        await this._transactionService.deactivateOtherActiveTransactionsAtEvse(
          tenantId,
          transactionId,
          ocppConnectionName,
          evse,
        );
      }
    }
  }

  /**
   * Helper method to sync transactionLimit between DB and station for OCPP 2.1.
   * Adds transactionLimit to response if DB limit differs from station's reported limit.
   */
  private syncTransactionLimitToResponse(
    response: OCPP2_1.TransactionEventResponse,
    transaction: Transaction,
    stationTransactionLimit: OCPP2_1.TransactionLimitType | null | undefined,
    ocppConnectionName: string,
    transactionId: string,
  ): void {
    const dbTransactionLimit = transaction.transactionLimit;
    if (!dbTransactionLimit) {
      return;
    }

    // Check if station's limit matches DB limit
    const limitsMatch =
      stationTransactionLimit &&
      stationTransactionLimit.maxCost === dbTransactionLimit.maxCost &&
      stationTransactionLimit.maxEnergy === dbTransactionLimit.maxEnergy &&
      stationTransactionLimit.maxTime === dbTransactionLimit.maxTime &&
      stationTransactionLimit.maxSoC === dbTransactionLimit.maxSoC;

    if (limitsMatch) {
      return; // No need to include in response
    }

    // Build response transactionLimit with only defined fields
    response.transactionLimit = {};
    if (dbTransactionLimit.maxCost !== undefined) {
      response.transactionLimit.maxCost = dbTransactionLimit.maxCost;
    }
    if (dbTransactionLimit.maxEnergy !== undefined) {
      response.transactionLimit.maxEnergy = dbTransactionLimit.maxEnergy;
    }
    if (dbTransactionLimit.maxTime !== undefined) {
      response.transactionLimit.maxTime = dbTransactionLimit.maxTime;
    }
    if (dbTransactionLimit.maxSoC !== undefined) {
      response.transactionLimit.maxSoC = dbTransactionLimit.maxSoC;
    }

    this._logger.info(
      `Including transactionLimit in response for station ${ocppConnectionName}, ` +
        `transaction ${transactionId}: ${JSON.stringify(response.transactionLimit)}`,
    );
  }

  /**
   * Helper method to persist transactionLimit from response to DB for OCPP 2.1.
   * This ensures subsequent requests can sync the limit via E16 logic.
   */
  private async persistTransactionLimitToDb(
    tenantId: number,
    response: OCPP2_1.TransactionEventResponse,
    transactionId: string,
    ocppConnectionName: string,
  ): Promise<void> {
    if (!response.transactionLimit) {
      return;
    }

    try {
      await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
        tenantId,
        { transactionLimit: response.transactionLimit } as Partial<Transaction>,
        transactionId,
        ocppConnectionName,
      );
      this._logger.debug(
        `Persisted transactionLimit to DB for station ${ocppConnectionName}, ` +
          `transaction ${transactionId}: ${JSON.stringify(response.transactionLimit)}`,
      );
    } catch (error) {
      this._logger.error(
        `Failed to persist transactionLimit for transaction ${transactionId}`,
        error,
      );
    }
  }
}

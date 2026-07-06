// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CallAction,
  HandlerProperties,
  IMessage,
  MeterValueDto,
  OcppModuleDependencies,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  AbstractModule,
  AsHandler,
  AttributeEnum,
  AuthorizationStatusEnum,
  CacheNamespace,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  OCPP1_6,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  TariffSetStatusEnum,
  TransactionEventEnum,
} from '@citrineos/base';
import { OCPP2_0_1_Mapper, sequelize } from '@dal/index.js';
import type {
  IAuthorizationRepository,
  IChargingProfileRepository,
  IDeviceModelRepository,
  ILocationRepository,
  IOCPPMessageRepository,
  ITariffRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';
import { Authorization } from '@dal/layers/sequelize/model/Authorization/index.js';
import { ChargingSchedule } from '@dal/layers/sequelize/model/ChargingProfile/index.js';
import { VariableAttribute } from '@dal/layers/sequelize/model/DeviceModel/index.js';
import { Tariff } from '@dal/layers/sequelize/model/Tariff/Tariffs.js';
import {
  StartTransaction,
  Transaction,
} from '@dal/layers/sequelize/model/TransactionEvent/index.js';
import type { SignedMeterValuesUtil } from '@util/security/SignedMeterValuesUtil.js';
import { Op } from 'sequelize';

import type { CostCalculator } from './CostCalculator.js';
import type { CostNotifier } from './CostNotifier.js';
import type { StatusNotificationService } from './StatusNotificationService.js';
import type { TransactionService } from './TransactionService.js';

export interface TransactionsModuleDependencies extends OcppModuleDependencies {
  transactionEventRepository: ITransactionEventRepository;
  authorizationRepository: IAuthorizationRepository;
  deviceModelRepository: IDeviceModelRepository;
  locationRepository: ILocationRepository;
  tariffRepository: ITariffRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  chargingProfileRepository: IChargingProfileRepository;
  transactionService: TransactionService;
  statusNotificationService: StatusNotificationService;
  costCalculator: CostCalculator;
  costNotifier: CostNotifier;
  signedMeterValuesUtil: SignedMeterValuesUtil;
}

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  _requests: CallAction[] = [];

  _responses: CallAction[] = [];
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _locationRepository: ILocationRepository;
  protected _tariffRepository: ITariffRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;

  protected _transactionService: TransactionService;
  protected _statusNotificationService: StatusNotificationService;

  private readonly _signedMeterValuesUtil: SignedMeterValuesUtil;
  private _costNotifier: CostNotifier;
  private _costCalculator: CostCalculator;

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
  private readonly _costUpdatedInterval: number | undefined;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    transactionEventRepository,
    authorizationRepository,
    deviceModelRepository,
    locationRepository,
    tariffRepository,
    ocppMessageRepository,
    chargingProfileRepository,
    transactionService,
    statusNotificationService,
    costCalculator,
    costNotifier,
    signedMeterValuesUtil,
  }: TransactionsModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.Transactions, logger, ocppValidator);

    this._requests = config.modules.transactions.requests;
    this._responses = config.modules.transactions.responses;

    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizationRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._locationRepository = locationRepository;
    this._tariffRepository = tariffRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._chargingProfileRepository = chargingProfileRepository;

    this._transactionService = transactionService;
    this._statusNotificationService = statusNotificationService;
    this._costCalculator = costCalculator;
    this._costNotifier = costNotifier;
    this._signedMeterValuesUtil = signedMeterValuesUtil;

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;
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

  get ocppMessageRepository(): IOCPPMessageRepository {
    return this._ocppMessageRepository;
  }

  /**
   * Handle OCPP 2.x requests
   */

  //TODO: Need additional handling for OCPP 2.1 as we need to extend the transaction service for ocpp 2.1
  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<OCPP2_request_types.TransactionEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Transaction event received:', message, props);
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
        await this.sendCallResultWithMessage(message, response ?? {});
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
      if ((error as any).name === 'SequelizeForeignKeyConstraintError') {
        await this.sendCallErrorWithMessage(
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
                // Clear the session from cache — limits are consumed on first transaction start
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

      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
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
        const supportTariff: boolean =
          tariffAvailableAttributes.length !== 0 && Boolean(tariffAvailableAttributes[0].value);

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
                    await this.sendCall(
                      ocppConnectionName,
                      tenantId,
                      OCPPVersion.OCPP2_1,
                      OCPP_CallAction.SetChargingProfile,
                      {
                        evseId: profile.evseId ?? transaction.evseId,
                        chargingProfile: chargingProfileType,
                      } as OCPP2_request_types.SetChargingProfileRequest,
                    );
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
        // C20.FR.03
        if (tariffEnabled.length == 0 || !tariffEnabled[0].value) {
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

      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
      this._logger.debug('Transaction response sent: ', messageConfirmation);
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<OCPP2_request_types.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues received:', message, props);

    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    const meterValues = message.payload.meterValue;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const evseId = message.payload.evseId;

    // When evseId is 0, the MeterValuesRequest message SHALL be associated with the entire Charging Station.
    if (this._sendCostUpdatedOnMeterValue && evseId !== 0) {
      const activeTransaction: Transaction | undefined =
        await this.transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
          tenantId,
          ocppConnectionName,
          evseId,
        );
      if (!activeTransaction) {
        this._logger.error(
          'Active Transaction not found on charging station {} evse {}',
          ocppConnectionName,
          evseId,
        );
      }

      const meterValuesCreated = await this._transactionService.createMeterValues(
        tenantId,
        meterValues,
        activeTransaction?.id,
        activeTransaction?.transactionId,
        activeTransaction?.tariffId,
      );

      if (activeTransaction) {
        await this._transactionService.recalculateTotalKwh(activeTransaction, meterValuesCreated);
        await this._costNotifier.calculateCostAndNotify(
          activeTransaction,
          message.context.tenantId,
          message.protocol,
        );
      }
    } else {
      await this._transactionService.createMeterValues(tenantId, meterValues);
    }

    const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
      tenantId,
      ocppConnectionName,
      meterValues,
    );

    if (!meterValuesValid) {
      throw new OcppError(
        message.context.correlationId,
        ErrorCode.SecurityError,
        'One or more MeterValues have an invalid signature.',
      );
    }

    const response: OCPP2_response_types.MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('MeterValues response sent: ', messageConfirmation);
  }

  //TODO: Need a meter event handler for OCPP 2.1 as we need to tweak or extend the transaction service for ocpp 2.1 (meter helper method is dependent on service)

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.StatusNotification)
  protected async _handleStatusNotification(
    message: IMessage<OCPP2_request_types.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification received:', message, props);

    await this._statusNotificationService
      .processStatusNotification(
        message.context.tenantId,
        message.context.ocppConnectionName,
        message.payload,
      )
      .catch((error) => {
        this._logger.error('Failed to process status notification', error);
      });

    // Create response
    const response: OCPP2_response_types.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  /**
   * Handle OCPP 2.x common responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<OCPP2_response_types.CostUpdatedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CostUpdated response received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetTransactionStatus)
  protected async _handleGetTransactionStatus(
    message: IMessage<OCPP2_response_types.GetTransactionStatusResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetTransactionStatus response received:', message, props);

    const response = message.payload;
    if (response.ongoingIndicator !== null && response.ongoingIndicator !== undefined) {
      await this._transactionService.updateTransactionStatus(
        message.context.tenantId,
        message.context.ocppConnectionName,
        message.context.correlationId,
        response.ongoingIndicator,
      );
    }
  }

  /**
   * C19 - Cancellation prior to transaction
   * C21 - Settlement at end of transaction
   * C22 - Settlement is rejected or fails
   * Handles NotifySettlementRequest from Charging Station to inform CSMS
   * that a payment has been canceled, settled, rejected, or failed.
   *
   * C21.FR.02: CS sends NotifySettlementRequest with status, amount, time, transId, and pspRef.
   * C21.FR.03: If PaymentCtrlr.ReceiptByCSMS = true, CSMS responds with receiptUrl (only for Settled).
   * C21.FR.04: If ReceiptByCSMS = false, CS includes receiptUrl/receiptId in the request (no action needed from CSMS).
   * C22.FR.01: If status is Rejected, store settlement data without receipt information.
   * C22.FR.02: If status is Failed, store settlement data without receipt information.
   */
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.NotifySettlement)
  protected async _handleNotifySettlement(
    message: IMessage<OCPP2_1.NotifySettlementRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifySettlementRequest received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const request = message.payload;

    this._logger.info(
      `NotifySettlement received: pspRef=${request.pspRef}, status=${request.status}, ` +
        `amount=${request.settlementAmount}, transactionId=${request.transactionId ?? 'none'}`,
    );

    const isSettled = request.status === OCPP2_1.PaymentStatusEnumType.Settled;
    const isRejected = request.status === OCPP2_1.PaymentStatusEnumType.Rejected;
    const isFailed = request.status === OCPP2_1.PaymentStatusEnumType.Failed;
    const isCancelled = request.status === OCPP2_1.PaymentStatusEnumType.Canceled;

    const isValidSettlementStatus = isSettled || isRejected || isFailed || isCancelled;
    if (!isValidSettlementStatus) {
      throw new OcppError(
        message.context.correlationId,
        ErrorCode.PropertyConstraintViolation,
        `Invalid settlement status: ${request.status}. Must be one of 'Settled', 'Rejected', 'Canceled' or 'Failed'.`,
      );
    }

    if (isRejected || isFailed) {
      this._logger.warn(
        `Settlement ${request.status} for station ${ocppConnectionName}, ` +
          `transaction ${request.transactionId ?? 'none'}, pspRef=${request.pspRef}, ` +
          `amount=${request.settlementAmount}. ` +
          `statusInfo=${request.statusInfo ?? 'none'}. ` +
          `CPO may need to manually capture the amount via PSP using the pspRef.`,
      );
    }

    // Store settlement data on the transaction if a transactionId is provided
    if (request.transactionId) {
      try {
        const settlementData: Record<string, unknown> = {
          pspRef: request.pspRef,
          status: request.status,
          settlementAmount: request.settlementAmount,
          settlementTime: request.settlementTime,
          statusInfo: request.statusInfo,
        };
        //Do NOT include receipt information for Rejected/Failed statuses
        if (isSettled) {
          settlementData.receiptId = request.receiptId;
          settlementData.receiptUrl = request.receiptUrl;
          settlementData.vatNumber = request.vatNumber;
        }

        // Fetch existing transaction to merge customData rather than overwrite it.
        // This preserves any existing customData fields (e.g., transactionLimit set by C23).
        const existingTransaction =
          await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
            tenantId,
            ocppConnectionName,
            request.transactionId,
          );
        const existingCustomData = existingTransaction?.customData ?? {};

        await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
          tenantId,
          {
            customData: {
              ...existingCustomData,
              settlement: settlementData,
            },
          } as Partial<Transaction>,
          request.transactionId,
          ocppConnectionName,
        );
      } catch (error) {
        this._logger.error(
          `Failed to store settlement data for transaction ${request.transactionId}`,
          error,
        );
      }
    }

    const response: OCPP2_1.NotifySettlementResponse = {};

    // Only generate receiptUrl for successful (Settled) settlements.
    // Do NOT include receiptUrl or receiptId for Rejected/Failed statuses.
    if (isSettled) {
      try {
        const receiptByCSMSAttributes: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            ocppConnectionName,
            component_name: 'PaymentCtrlr',
            variable_name: 'ReceiptByCSMS',
            type: AttributeEnum.Actual,
          });

        const receiptByCSMS =
          receiptByCSMSAttributes.length > 0 &&
          receiptByCSMSAttributes[0].value?.toLowerCase() === 'true';

        if (receiptByCSMS) {
          const receiptBaseUrl = this.config.modules.transactions.receiptBaseUrl;
          if (receiptBaseUrl) {
            const receiptId = request.transactionId
              ? `${ocppConnectionName}-${request.transactionId}-${request.pspRef}`
              : `${ocppConnectionName}-${request.pspRef}`;
            response.receiptUrl = `${receiptBaseUrl}/${encodeURIComponent(receiptId)}`;
            response.receiptId = receiptId;
            this._logger.info(`ReceiptByCSMS is true, generated receiptUrl=${response.receiptUrl}`);
          } else {
            this._logger.warn(
              'ReceiptByCSMS is true but no receiptBaseUrl configured in transactions module config. ' +
                'Cannot generate receiptUrl.',
            );
          }
        }
      } catch (error) {
        this._logger.error('Failed to read PaymentCtrlr.ReceiptByCSMS from device model', error);
      }
    }

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifySettlement response sent:', messageConfirmation);

    // After settlement, CSMS MAY send SetDisplayMessageRequest with receipt URL
    // to display on the charging station (e.g., as a QR code).
    const finalReceiptUrl = response.receiptUrl ?? request.receiptUrl;
    if (isSettled && finalReceiptUrl) {
      try {
        const displayMessageId = Date.now() % 2147483647; // Unique positive integer ID
        await this.sendCall(
          ocppConnectionName,
          tenantId,
          OCPPVersion.OCPP2_1,
          OCPP_CallAction.SetDisplayMessage,
          {
            message: {
              id: displayMessageId,
              priority: OCPP2_1.MessagePriorityEnumType.AlwaysFront,
              transactionId: request.transactionId,
              message: {
                format: OCPP2_1.MessageFormatEnumType.URI,
                content: finalReceiptUrl,
              },
            },
          } as OCPP2_1.SetDisplayMessageRequest,
        );
        this._logger.info(
          `Sent SetDisplayMessageRequest with receiptUrl=${finalReceiptUrl} to station ${ocppConnectionName}`,
        );
      } catch (error) {
        this._logger.error(
          `Failed to send SetDisplayMessageRequest to station ${ocppConnectionName}`,
          error,
        );
      }
    }
  }

  /**
   * Handle OCPP 1.6 requests
   */

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StatusNotification)
  protected async _handleOcpp16StatusNotification(
    message: IMessage<OCPP1_6.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification request received:', message, props);

    await this._statusNotificationService.processOcpp16StatusNotification(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload,
    );

    // Create response
    const response: OCPP1_6.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.MeterValues)
  protected async _handleOcpp16MeterValues(
    message: IMessage<OCPP1_6.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues request received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const connectorId = message.payload.connectorId;
    const transactionId = message.payload.transactionId;
    const meterValues = message.payload.meterValue;

    if (connectorId !== 0 && transactionId && meterValues.length > 0) {
      try {
        const meterValueEntities: MeterValueDto[] = [];
        for (const meterValue of meterValues) {
          if (meterValue.sampledValue && meterValue.sampledValue.length > 0) {
            const meterValueEntity = OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(meterValue);
            meterValueEntity.tenantId = tenantId;
            meterValueEntity.connectorId = connectorId;
            meterValueEntities.push(meterValueEntity);
          }
        }
        if (meterValueEntities.length > 0) {
          await this._transactionEventRepository.updateTransactionByMeterValues(
            tenantId,
            meterValueEntities,
            ocppConnectionName,
            transactionId,
          );
        }
      } catch (e) {
        this._logger.error(`Failed to process MeterValues.`, e);
      }
    }

    await this.sendCallResultWithMessage(message, {} as OCPP1_6.MeterValuesResponse);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StartTransaction)
  protected async _handleOcpp16StartTransaction(
    message: IMessage<OCPP1_6.StartTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StartTransaction request received:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const request = message.payload;

    // Authorize
    const response = await this._transactionService.authorizeOcpp16IdToken(
      message.context,
      request.idTag,
      request.connectorId,
    );

    // Send response to charger
    if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this.sendCallResultWithMessage(message, response);
    } else {
      try {
        // Create transaction
        const newTransaction =
          await this._transactionEventRepository.createTransactionByStartTransaction(
            tenantId,
            request,
            ocppConnectionName,
          );
        response.transactionId = parseInt(newTransaction.transactionId);
      } catch (error) {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Charging station') && errorMessage.includes('does not exist')) {
          this._logger.error(
            `Charging station ${ocppConnectionName} does not exist for idTag ${request.idTag}`,
          );
        } else {
          this._logger.error(`Failed to create transaction for idTag ${request.idTag}`, error);
        }
        response.idTagInfo = {
          status: OCPP1_6.StartTransactionResponseStatus.Invalid,
        };
      }
      await this.sendCallResultWithMessage(message, response);
    }

    await this.deactivateOtherActiveTransactionsAtEvse16(
      tenantId,
      response.transactionId.toString(),
      ocppConnectionName,
      request,
    );

    // Deactivate reservation only if the transaction was accepted.
    // A rejected StartTransaction (auth failure or DB error) should not
    // consume the reservation — the charger may retry or another idTag
    // may use it.
    if (
      request.reservationId &&
      response.idTagInfo.status === OCPP1_6.StartTransactionResponseStatus.Accepted
    ) {
      await this._transactionService.deactivateReservation(
        tenantId,
        response.transactionId.toString(),
        request.reservationId,
        ocppConnectionName,
      );
    }
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StopTransaction)
  protected async _handleOcpp16StopTransaction(
    message: IMessage<OCPP1_6.StopTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StopTransaction request received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const request = message.payload;

    const authorization: Authorization | undefined = request.idTag
      ? await this._authorizeRepository.readOnlyOneByQuerystring(tenantId, {
          idToken: request.idTag,
        })
      : undefined;

    let idTokenInfoStatus = authorization?.status;
    if (authorization === undefined && request.idTag) {
      // Unknown idTag, fallback to Invalid
      idTokenInfoStatus = 'Invalid';
    }
    switch (idTokenInfoStatus) {
      case AuthorizationStatusEnum.Accepted:
      case AuthorizationStatusEnum.Blocked:
      case AuthorizationStatusEnum.Expired:
      case AuthorizationStatusEnum.ConcurrentTx:
      case AuthorizationStatusEnum.Invalid:
        break;
      default: // Other OCPP 2.0.1 statuses default to Invalid for OCPP 1.6
        idTokenInfoStatus = AuthorizationStatusEnum.Invalid;
    }

    let parentIdTag: string | undefined = undefined;
    if (authorization?.groupAuthorizationId) {
      const parentAuth = await this._authorizeRepository.readOnlyOneByQuery(tenantId, {
        where: { id: authorization.groupAuthorizationId },
      });
      if (parentAuth) {
        parentIdTag = parentAuth.idToken;
      }
    }

    const stopTransactionResponse: OCPP1_6.StopTransactionResponse = {
      ...(request.idTag
        ? {
            idTagInfo: {
              expiryDate: authorization?.cacheExpiryDateTime,
              parentIdTag,
              status: idTokenInfoStatus as unknown as OCPP1_6.StopTransactionResponseStatus,
            },
          }
        : {}),
    };

    await this.sendCallResultWithMessage(message, stopTransactionResponse);

    const transaction = await Transaction.findOne({
      where: {
        ocppConnectionName,
        tenantId,
        transactionId: request.transactionId.toString(),
      },
      include: [StartTransaction],
    });

    if (!transaction) {
      this._logger.error(`Transaction ${request.transactionId} not found.`);
      return;
    }

    const stopTransaction = await this._transactionEventRepository.createStopTransaction(
      tenantId,
      transaction.id,
      ocppConnectionName,
      request.meterStop,
      new Date(request.timestamp),
      request.transactionData?.map((data) =>
        OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(
          data as OCPP1_6.MeterValuesRequest['meterValue'][0],
        ),
      ) || [],
      request.reason || (request.idTag ? 'Remote' : 'Local'),
      authorization?.id,
    );

    if (!stopTransaction) {
      this._logger.error(
        `Failed to create StopTransaction record for transaction ${request.transactionId}`,
      );
    }

    if (transaction.startTransaction) {
      transaction.totalKwh = (request.meterStop - transaction.startTransaction.meterStart) / 1000; // Convert from Wh to kWh
    } else {
      this._logger.warn(
        `StartTransaction record not found at station ${ocppConnectionName} for transactionId ${request.transactionId}. 
        Cannot calculate totalKwh.`,
      );
    }
    transaction.isActive = false;
    transaction.stoppedReason = request.reason;
    transaction.endTime = request.timestamp;
    await transaction.save();
  }

  /**
   * Handle OCPP 2.1 responses
   */
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.SetDefaultTariff)
  protected async _handleSetDefaultTariff(
    message: IMessage<OCPP2_1.SetDefaultTariffResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 2.1 SetDefaultTariff response received:', message, props);

    if (message.payload.status !== TariffSetStatusEnum.Accepted) {
      this._logger.warn(
        `SetDefaultTariff rejected for station ${message.context.ocppConnectionName}: ${message.payload.status}`,
      );
      return;
    }

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    const storedRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });

    if (!storedRequest) {
      this._logger.error(
        `No SetDefaultTariffRequest found for correlationId ${message.context.correlationId} on station ${ocppConnectionName}`,
      );
      return;
    }

    const request = storedRequest.message[3] as OCPP2_1.SetDefaultTariffRequest;
    const tariffData = request.tariff;

    const newTariff = Tariff.build({
      tenantId,
      currency: tariffData.currency,
      pricePerKwh: 0,
      tariffId: tariffData.tariffId,
      validFrom: tariffData.validFrom ?? undefined,
      description: tariffData.description ?? undefined,
      energy: tariffData.energy ?? undefined,
      chargingTime: tariffData.chargingTime ?? undefined,
      idleTime: tariffData.idleTime ?? undefined,
      fixedFee: tariffData.fixedFee ?? undefined,
      reservationTime: tariffData.reservationTime ?? undefined,
      reservationFixed: tariffData.reservationFixed ?? undefined,
      minCost: tariffData.minCost ?? undefined,
      maxCost: tariffData.maxCost ?? undefined,
    });

    const storedTariff = await this._tariffRepository.upsertTariffByTariffId(tenantId, newTariff);
    this._logger.info(`Tariff ${storedTariff.id} stored for station ${ocppConnectionName}`);
  }

  /**
   * Handle OCPP 2.1 GetTariffs request
   * I09.FR.01: evseId=0 returns tariffs for all EVSEs
   * I09.FR.02: evseId>0 returns tariffs only for that EVSE
   * I09.FR.03: No tariffs returns NoTariff status
   * I09.FR.04: DefaultTariff includes evseIds list
   * I09.FR.05: DriverTariff includes idTokens list
   * I09.FR.06: DriverTariff with active transaction includes evseIds
   * I09.FR.07: Include validFrom when present
   */
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.GetTariffs)
  protected async _handleGetTariffs(
    message: IMessage<OCPP2_1.GetTariffsRequest>,
    props?: HandlerProperties,
  ): Promise<OCPP2_1.GetTariffsResponse> {
    this._logger.debug('OCPP 2.1 GetTariffs request received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const requestedEvseId = message.payload.evseId;

    try {
      // Get charging station
      const station = await this._locationRepository.readChargingStationByStationId(
        tenantId,
        ocppConnectionName,
      );

      if (!station) {
        this._logger.error(`Charging station not found: ${ocppConnectionName}`);
        return {
          status: OCPP2_1.TariffGetStatusEnumType.Rejected,
          statusInfo: {
            reasonCode: 'StationNotFound',
            additionalInfo: `Charging station ${ocppConnectionName} not found`,
          },
        };
      }

      // Map to store tariff assignments by tariffId
      // Using a helper type to track Sets before converting to arrays
      type TariffAssignmentBuilder = Omit<OCPP2_1.TariffAssignmentType, 'evseIds' | 'idTokens'> & {
        evseIds: Set<number>;
        idTokens: Set<string>;
      };
      const tariffAssignmentsMap = new Map<string, TariffAssignmentBuilder>();

      // Query default tariffs from Connectors
      // I09.FR.01 & I09.FR.02: Filter by evseId if requested
      const connectors = await sequelize.Connector.findAll({
        where: {
          tenantId,
          ocppConnectionName,
          tariffId: { [Op.ne]: null },
        },
        include: [
          {
            model: sequelize.Evse,
            as: 'evse',
            required: true,
            ...(requestedEvseId > 0 && {
              where: { evseTypeId: requestedEvseId },
            }),
          },
          {
            model: Tariff,
            as: 'tariff',
            required: true,
          },
        ],
      });

      // I09.FR.04: DefaultTariff includes evseIds list
      for (const connector of connectors) {
        const tariff = connector.tariff;
        if (tariff && tariff.tariffId) {
          const evseTypeId = connector.evse?.evseTypeId;
          if (evseTypeId !== undefined && evseTypeId !== null) {
            if (!tariffAssignmentsMap.has(tariff.tariffId)) {
              tariffAssignmentsMap.set(tariff.tariffId, {
                tariffId: tariff.tariffId,
                tariffKind: OCPP2_1.TariffKindEnumType.DefaultTariff,
                validFrom: tariff.validFrom,
                evseIds: new Set(),
                idTokens: new Set(),
              });
            }
            tariffAssignmentsMap.get(tariff.tariffId)!.evseIds.add(evseTypeId);
          }
        }
      }

      // Query driver-specific tariffs from Authorizations
      const authorizations = await Authorization.findAll({
        where: {
          tenantId,
          tariffId: { [Op.ne]: null },
        },
        include: [
          {
            model: Tariff,
            as: 'tariff',
            required: true,
          },
        ],
      });

      // I09.FR.05: DriverTariff includes idTokens list
      for (const authorization of authorizations) {
        const tariff = authorization.tariff;
        if (tariff && tariff.tariffId) {
          if (!tariffAssignmentsMap.has(tariff.tariffId)) {
            tariffAssignmentsMap.set(tariff.tariffId, {
              tariffId: tariff.tariffId,
              tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
              validFrom: tariff.validFrom,
              evseIds: new Set(),
              idTokens: new Set(),
            });
          }
          const assignment = tariffAssignmentsMap.get(tariff.tariffId)!;
          assignment.idTokens.add(authorization.idToken);
        }
      }

      // I09.FR.06: DriverTariff with active transaction includes evseIds
      // Query active transactions to associate driver tariffs with EVSEs
      const activeTransactions = await Transaction.findAll({
        where: {
          tenantId,
          ocppConnectionName,
          isActive: true,
          authorizationId: { [Op.ne]: null },
        },
        include: [
          {
            model: Authorization,
            as: 'authorization',
            required: true,
            where: {
              tariffId: { [Op.ne]: null },
            },
            include: [
              {
                model: Tariff,
                as: 'tariff',
                required: true,
              },
            ],
          },
          {
            model: sequelize.Evse,
            as: 'evse',
            required: true,
            ...(requestedEvseId > 0 && {
              where: { evseTypeId: requestedEvseId },
            }),
          },
        ],
      });

      for (const transaction of activeTransactions) {
        // TypeScript doesn't infer nested include types, so we need to access safely
        const authorization = transaction.authorization as typeof transaction.authorization & {
          tariff?: typeof Tariff.prototype;
        };
        const tariff = authorization?.tariff;
        const evseTypeId = transaction.evse?.evseTypeId;
        if (tariff && tariff.tariffId && evseTypeId !== undefined && evseTypeId !== null) {
          const assignment = tariffAssignmentsMap.get(tariff.tariffId);
          if (assignment) {
            assignment.evseIds.add(evseTypeId);
          }
        }
      }

      // Convert map to array
      const tariffAssignments: OCPP2_1.TariffAssignmentType[] = Array.from(
        tariffAssignmentsMap.values(),
      ).map((assignment) => {
        const result: OCPP2_1.TariffAssignmentType = {
          tariffId: assignment.tariffId,
          tariffKind: assignment.tariffKind,
        };

        // I09.FR.07: Include validFrom when present
        if (assignment.validFrom) {
          result.validFrom = assignment.validFrom;
        }

        // I09.FR.04: DefaultTariff includes evseIds
        // I09.FR.06: DriverTariff with active transaction includes evseIds
        if (assignment.evseIds.size > 0) {
          result.evseIds = Array.from(assignment.evseIds).sort() as [number, ...number[]];
        }

        // I09.FR.05: DriverTariff includes idTokens
        if (assignment.idTokens.size > 0) {
          result.idTokens = Array.from(assignment.idTokens).sort() as [string, ...string[]];
        }

        return result;
      });

      // I09.FR.03: No tariffs returns NoTariff status
      if (tariffAssignments.length === 0) {
        this._logger.info(`No tariffs found for station ${ocppConnectionName}`);
        return {
          status: OCPP2_1.TariffGetStatusEnumType.NoTariff,
        };
      }

      this._logger.info(
        `Returning ${tariffAssignments.length} tariff assignments for station ${ocppConnectionName}`,
      );

      return {
        status: OCPP2_1.TariffGetStatusEnumType.Accepted,
        tariffAssignments: tariffAssignments as [
          OCPP2_1.TariffAssignmentType,
          ...OCPP2_1.TariffAssignmentType[],
        ],
      };
    } catch (error) {
      this._logger.error('Error handling GetTariffs request:', error);
      return {
        status: OCPP2_1.TariffGetStatusEnumType.Rejected,
        statusInfo: {
          reasonCode: 'InternalError',
          additionalInfo: error instanceof Error ? error.message : 'Unknown error',
        },
      };
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

  protected async deactivateOtherActiveTransactionsAtEvse16(
    tenantId: number,
    transactionId: string,
    ocppConnectionName: string,
    request: OCPP1_6.StartTransactionRequest,
  ) {
    const connector = await this._locationRepository.readConnectorByStationIdAndOcpp16ConnectorId(
      tenantId,
      ocppConnectionName,
      request.connectorId,
    );
    if (!connector) {
      this._logger.error(`Unable to find connector ${request.connectorId}.`);
      throw new Error(`Unable to find connector ${request.connectorId}.`);
    }
    await this._transactionService.deactivateOtherActiveTransactionsAtEvse(
      tenantId,
      transactionId,
      ocppConnectionName,
      request.connectorId,
    );
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

export default TransactionsModule;

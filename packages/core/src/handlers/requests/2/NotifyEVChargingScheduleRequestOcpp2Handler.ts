// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsRequestHandler, type IMessage, type IOcppSender, OCPP2_common_types, OCPP2_request_types, OCPP2_response_types } from '@citrineos/base';
import { ChargingProfileKindEnum, ChargingProfilePurposeEnum, EventGroup, GenericStatusEnum, type HandlerProperties, OCPP_2_VER_LIST, OCPP_CallAction } from '@citrineos/types';
import { Transaction } from '@/dal/index.js';
import type {
  IChargingProfileRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import type { ISmartCharging } from '@modules/SmartCharging/src/module/smartCharging/SmartCharging.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEVChargingSchedule)
export class NotifyEVChargingScheduleRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _smartChargingService: ISmartCharging;

  constructor({
    logger,
    ocppSender,
    transactionEventRepository,
    chargingProfileRepository,
    smartChargingService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    transactionEventRepository: ITransactionEventRepository;
    chargingProfileRepository: IChargingProfileRepository;
    smartChargingService: ISmartCharging;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._transactionEventRepository = transactionEventRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._smartChargingService = smartChargingService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('NotifyEVChargingScheduleRequest'),
      message,
      props,
    );

    const request = message.payload as OCPP2_request_types.NotifyEVChargingScheduleRequest;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    // There are different definitions for Accepted and Rejected in NotifyEVChargingScheduleResponse
    // in OCPP 2.0.1 V3 Part 2, see (1) 1.37.2 status field description and (2) K17.FR.11 and K17.FR.12
    // We use (1) in our code, i.e., always return Accepted in response
    await this._ocppSender.sendCallResultWithMessage(message, {
      status: GenericStatusEnum.Accepted,
    } as OCPP2_response_types.NotifyEVChargingScheduleResponse);

    const activeTransaction =
      await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
        tenantId,
        ocppConnectionName,
        request.evseId,
      );
    if (!activeTransaction) {
      this._logger.error(
        `No active transaction on station ${ocppConnectionName} evse ${request.evseId}`,
      );
      return;
    } else {
      this._logger.info(
        `Found active transaction on station ${ocppConnectionName} evse ${request.evseId}: ${JSON.stringify(activeTransaction)}`,
      );
    }

    try {
      await this._smartChargingService.checkLimitsOfChargingSchedule(
        request,
        tenantId,
        ocppConnectionName,
        activeTransaction,
      );
    } catch (error) {
      this._logger.error(
        `EV charging schedule is NOT within limits of existing ChargingSchedule: ${error}`,
      );
      // Currently, we simply trust the given EV charging schedule and create a new charging profile based on it
      const setChargingProfileRequest = await this._generateSetChargingProfileRequest(
        request,
        activeTransaction,
        tenantId,
        ocppConnectionName,
      );
      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId: message.context.tenantId,
        protocol: message.protocol,
        action: OCPP_CallAction.SetChargingProfile,
        eventGroup: EventGroup.SmartCharging,
        payload: setChargingProfileRequest,
      });
    }
  }

  /**
   * Generates a `SetChargingProfileRequest` from the given `NotifyEVChargingScheduleRequest`.
   *
   * This method creates a charging profile based on the EV's charging schedule.
   *
   * @param request - The `NotifyEVChargingScheduleRequest` containing EV's charging schedule.
   * @param transaction - The transaction associated with the charging profile.
   * @param ocppConnectionName - The connection name of the charging station
   *
   * @returns A `SetChargingProfileRequest` with a generated charging profile.
   */
  private async _generateSetChargingProfileRequest(
    request: OCPP2_request_types.NotifyEVChargingScheduleRequest,
    transaction: Transaction,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<OCPP2_request_types.SetChargingProfileRequest> {
    const { chargingSchedule, evseId } = request;

    const purpose = ChargingProfilePurposeEnum.TxProfile;
    chargingSchedule.id = await this._chargingProfileRepository.getNextChargingScheduleId(
      tenantId,
      ocppConnectionName,
    );

    // startSchedule SHALL be present when chargingProfileKind is Absolute (OCPP 2.0.1 K01.FR.41);
    // compliant charging stations reject the profile otherwise.
    if (!chargingSchedule.startSchedule) {
      chargingSchedule.startSchedule = new Date().toISOString();
    }

    const chargingProfile = {
      id: await this._chargingProfileRepository.getNextChargingProfileId(
        tenantId,
        ocppConnectionName,
      ),
      stackLevel: await this._chargingProfileRepository.getNextStackLevel(
        tenantId,
        ocppConnectionName,
        transaction.id,
        purpose,
      ),
      chargingProfilePurpose: purpose,
      chargingProfileKind: ChargingProfileKindEnum.Absolute,
      chargingSchedule: [chargingSchedule],
      transactionId: transaction.transactionId,
    } as OCPP2_common_types.ChargingProfileType;

    return {
      evseId,
      chargingProfile,
    } as OCPP2_request_types.SetChargingProfileRequest;
  }
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationDto, ICache, TenantPartnerDto } from '@citrineos/base';
import { OCPPVersion } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, InjectMany, Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';
import type {
  GetTenantPartnerByIdQueryResult,
  GetTenantPartnerByIdQueryVariables,
} from '../graphql/index.js';
import { GET_TENANT_PARTNER_BY_ID, OcpiGraphqlClient } from '../graphql/index.js';
import type { OcpiConfig, UnlockConnector } from '../index.js';
import { CacheWrapper, CommandResultType, CommandType, OcpiConfigToken } from '../index.js';
import type { CancelReservation } from '../model/CancelReservation.js';
import type { ReserveNow } from '../model/ReserveNow.js';
import type { SetChargingProfile } from '../model/SetChargingProfile.js';
import type { StartSession } from '../model/StartSession.js';
import type { StopSession } from '../model/StopSession.js';
import { CommandsClientApi } from '../trigger/CommandsClientApi.js';
import {
  COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
  COMMAND_RESPONSE_URL_CACHE_RESOLVED,
} from './Consts.js';
import { OCPP_COMMAND_HANDLER, OCPPCommandHandler } from './ocppCommandHandlers/base.js';

@Service()
export class CommandExecutor {
  @Inject()
  protected logger!: Logger<ILogObj>;
  @Inject()
  protected ocpiGraphqlClient!: OcpiGraphqlClient;
  @Inject()
  protected commandsClientApi!: CommandsClientApi;
  @Inject(OcpiConfigToken)
  protected config!: OcpiConfig;

  protected cache!: ICache;
  private handlerRegistry = new Map<OCPPVersion, OCPPCommandHandler>();

  constructor(
    @Inject() cacheWrapper: CacheWrapper,
    @InjectMany(OCPP_COMMAND_HANDLER) handlers: OCPPCommandHandler[],
  ) {
    this.cache = cacheWrapper.cache;
    handlers.forEach((handler) => {
      this.handlerRegistry.set(handler.supportedVersion, handler);
    });
  }

  public async executeStartSession(
    startSession: StartSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
  ): Promise<void> {
    this.logger.info('Executing StartSession command', { startSession });

    const commandId = await this.generateCommandId(startSession.response_url, tenantPartner);

    const commandHandler = this.getCommandHandler(
      chargingStation.protocol || undefined,
      tenantPartner,
      startSession.response_url,
      commandId,
    );
    if (commandHandler) {
      await commandHandler.sendStartSessionCommand(
        startSession,
        tenantPartner,
        chargingStation,
        commandId,
      );
    } else {
      this.logger.warn('StartSession failed');
    }
    return;
  }

  public async executeStopSession(
    stopSession: StopSession,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
  ): Promise<void> {
    this.logger.info('Executing StopSession command', { stopSession });

    const commandId = await this.generateCommandId(stopSession.response_url, tenantPartner);

    const commandHandler = this.getCommandHandler(
      chargingStation.protocol || undefined,
      tenantPartner,
      stopSession.response_url,
      commandId,
    );
    if (commandHandler) {
      await commandHandler.sendStopSessionCommand(
        stopSession,
        tenantPartner,
        chargingStation,
        commandId,
      );
    } else {
      this.logger.warn('StopSession failed');
    }
    return;
  }

  public async executeUnlockConnector(
    unlockConnector: UnlockConnector,
    tenantPartner: TenantPartnerDto,
    chargingStation: ChargingStationDto,
  ): Promise<void> {
    this.logger.info('Executing UnlockConnector command', { unlockConnector });

    const commandId = await this.generateCommandId(unlockConnector.response_url, tenantPartner);

    const commandHandler = this.getCommandHandler(
      chargingStation.protocol || undefined,
      tenantPartner,
      unlockConnector.response_url,
      commandId,
    );
    if (commandHandler) {
      await commandHandler.sendUnlockConnectorCommand(
        unlockConnector,
        tenantPartner,
        chargingStation,
        commandId,
      );
    } else {
      this.logger.warn('UnlockConnector failed');
    }
    return;
  }

  public async executeGetActiveChargingProfile(
    _sessionId: string,
    _duration: number,
    _responseUrl: string,
  ) {
    // based on the current assumption, transactionId is equal to sessionId
    // If this map assumption changes, this needs to be changed
    // const transaction =
    //   await this.transactionRepo.findByTransactionId(sessionId);
    // if (!transaction) {
    //   throw new NotFoundError('Transaction not found');
    // }
    // const session = (
    //   await this.sessionMapper.mapTransactionsToSessions([transaction])
    // )[0];
    // if (!session) {
    //   throw new NotFoundError('Session not found');
    // }
    // const correlationId = uuidv4();
    // await this.responseUrlRepo.saveResponseUrl(
    //   correlationId,
    //   responseUrl,
    //   new OcpiParams(
    //     session.country_code,
    //     session.party_id,
    //     session.cdr_token.country_code,
    //     session.cdr_token.party_id,
    //   ),
    // );
    // const request = {
    //   duration: duration,
    //   evseId: transaction.evse?.id,
    // } as OCPP2_0_1.GetCompositeScheduleRequest;
    // await this.abstractModule.sendCall(
    //   transaction.stationId,
    //   'tenantId',
    //   OCPPVersion.OCPP2_0_1,
    //   OCPP2_0_1_CallAction.GetCompositeSchedule,
    //   request,
    //   undefined,
    //   correlationId,
    //   MessageOrigin.ChargingStationManagementSystem,
    // );
  }

  public async executeClearChargingProfile(_sessionId: string, _responseUrl: string) {
    // based on the current assumption, transactionId is equal to sessionId
    // If this map assumption changes, this needs to be changed
    // const transaction =
    //   await this.transactionRepo.findByTransactionId(sessionId);
    // if (!transaction) {
    //   throw new NotFoundError('Transaction not found');
    // }
    // const session = (
    //   await this.sessionMapper.mapTransactionsToSessions([transaction])
    // )[0];
    // if (!session) {
    //   throw new NotFoundError('Session not found');
    // }
    // const chargingProfiles =
    //   await this.sessionChargingProfileRepo.readAllByQuery({
    //     where: {
    //       sessionId: sessionId, // sessionId is unique constraint
    //     },
    //   });
    // if (!chargingProfiles || chargingProfiles.length === 0) {
    //   throw new NotFoundError('Charging profile not found');
    // }
    // const correlationId = uuidv4();
    // await this.responseUrlRepo.saveResponseUrl(
    //   correlationId,
    //   responseUrl,
    //   new OcpiParams(
    //     session.country_code,
    //     session.party_id,
    //     session.cdr_token.country_code,
    //     session.cdr_token.party_id,
    //   ),
    // );
    // const request = {
    //   chargingProfileId: chargingProfiles[0].chargingProfileId,
    // } as OCPP2_0_1.ClearChargingProfileRequest;
    // await this.abstractModule.sendCall(
    //   transaction.stationId,
    //   'tenantId',
    //   OCPPVersion.OCPP2_0_1,
    //   OCPP2_0_1_CallAction.ClearChargingProfile,
    //   request,
    //   undefined,
    //   correlationId,
    //   MessageOrigin.ChargingStationManagementSystem,
    // );
  }

  public async executePutChargingProfile(
    _sessionId: string,
    _setChargingProfile: SetChargingProfile,
  ) {
    // based on the current assumption, transactionId is equal to sessionId
    // If this map assumption changes, this needs to be changed
    // const transaction =
    //   await this.transactionRepo.findByTransactionId(sessionId);
    // if (!transaction) {
    //   throw new NotFoundError('Transaction not found');
    // }
    // const session = (
    //   await this.sessionMapper.mapTransactionsToSessions([transaction])
    // )[0];
    // if (!session) {
    //   throw new NotFoundError('Session not found');
    // }
    // if (!transaction.evse) {
    //   throw new NotFoundError('Evse not found');
    // }
    // const evseId = transaction.evse.id;
    // const correlationId = uuidv4();
    // await this.responseUrlRepo.saveResponseUrl(
    //   correlationId,
    //   setChargingProfile.response_url,
    //   new OcpiParams(
    //     session.country_code,
    //     session.party_id,
    //     session.cdr_token.country_code,
    //     session.cdr_token.party_id,
    //   ),
    // );
    // const stationId = transaction.stationId;
    // const setChargingProfileRequest = await this.mapSetChargingProfileRequest(
    //   setChargingProfile.charging_profile,
    //   evseId,
    //   sessionId,
    //   stationId,
    // );
    // await this.chargingProfileRepo.createOrUpdateChargingProfile(
    //   setChargingProfileRequest.chargingProfile,
    //   stationId,
    //   evseId,
    // );
    // await this.sessionChargingProfileRepo.createOrUpdateSessionChargingProfile(
    //   sessionId,
    //   setChargingProfileRequest.chargingProfile.id,
    //   setChargingProfileRequest.chargingProfile.chargingSchedule[0].id,
    // );
    // await this.abstractModule.sendCall(
    //   stationId,
    //   'tenantId',
    //   OCPPVersion.OCPP2_0_1,
    //   OCPP2_0_1_CallAction.SetChargingProfile,
    //   setChargingProfileRequest,
    //   undefined,
    //   correlationId,
    //   MessageOrigin.ChargingStationManagementSystem,
    // );
  }

  public async executeReserveNow(
    _reserveNow: ReserveNow,
    _countryCode: string,
    _partyId: string,
  ): Promise<void> {
    // Currently, it rejects the request if the evse_uid is missing
    // When we have the solution to handle the optional evse_uid, we should change this
    // if (!reserveNow.evse_uid) {
    //   throw new BadRequestError('Missing evse_uid');
    // }
    // const evseId = Number(EXTRACT_EVSE_ID(reserveNow.evse_uid!));
    // const stationId = EXTRACT_STATION_ID(reserveNow.evse_uid!);
    // // Check if evse exists and given evse_uid matches the given location_id
    // if (
    //   !(await this.locationsDatasource.getEvse(
    //     Number(reserveNow.location_id),
    //     stationId,
    //     evseId,
    //   ))
    // ) {
    //   throw new NotFoundError('EVSE not found');
    // }
    // const ocpiLocation =
    //   await this.ocpiLocationRepo.getLocationByCoreLocationId(
    //     Number(reserveNow.location_id),
    //   );
    // if (!ocpiLocation) {
    //   throw new NotFoundError('Location not found');
    // }
    // const correlationId = uuidv4();
    // await this.responseUrlRepo.saveResponseUrl(
    //   correlationId,
    //   reserveNow.response_url,
    //   new OcpiParams(
    //     ocpiLocation[OcpiLocationProps.countryCode],
    //     ocpiLocation[OcpiLocationProps.partyId],
    //     countryCode,
    //     partyId,
    //   ),
    // );
    // const [request, coreReservationDBId] =
    //   await this.createAndStoreReservations(
    //     reserveNow,
    //     stationId,
    //     evseId,
    //     countryCode,
    //     partyId,
    //   );
    // // Store the correlationId and core reservationDBId in the call message so that we can update the corresponding
    // // core reservation when the response is received
    // await this.callMessageRepo.create(
    //   CallMessage.build({
    //     correlationId,
    //     reservationId: coreReservationDBId,
    //   }),
    // );
    // await this.abstractModule.sendCall(
    //   stationId,
    //   'tenantId',
    //   OCPPVersion.OCPP2_0_1,
    //   OCPP2_0_1_CallAction.ReserveNow,
    //   request,
    //   undefined,
    //   correlationId,
    //   MessageOrigin.ChargingStationManagementSystem,
    // );
  }

  public async executeCancelReservation(
    _cancelReservation: CancelReservation,
    _countryCode: string,
    _partyId: string,
  ): Promise<void> {
    // const existingOcpiReservation =
    //   await this.ocpiReservationRepo.readOnlyOneByQuery({
    //     where: {
    //       // unique constraint
    //       [OcpiReservationProps.reservationId]:
    //         cancelReservation.reservation_id,
    //       [OcpiReservationProps.countryCode]: countryCode,
    //       [OcpiReservationProps.partyId]: partyId,
    //     },
    //     include: [Reservation, OcpiLocation],
    //   });
    // if (!existingOcpiReservation) {
    //   throw new NotFoundError(
    //     `Reservation ${cancelReservation.reservation_id} not found`,
    //   );
    // }
    // const correlationId = uuidv4();
    // await this.responseUrlRepo.saveResponseUrl(
    //   correlationId,
    //   cancelReservation.response_url,
    //   new OcpiParams(
    //     existingOcpiReservation[OcpiReservationProps.location][
    //       OcpiLocationProps.countryCode
    //     ],
    //     existingOcpiReservation[OcpiReservationProps.location][
    //       OcpiLocationProps.partyId
    //     ],
    //     countryCode,
    //     partyId,
    //   ),
    // );
    // const existingCoreReservation = existingOcpiReservation.coreReservation;
    // await this.callMessageRepo.create(
    //   CallMessage.build({
    //     correlationId,
    //     reservationId: existingCoreReservation.databaseId,
    //   }),
    // );
    // await this.abstractModule.sendCall(
    //   existingCoreReservation.stationId,
    //   'tenantId',
    //   OCPPVersion.OCPP2_0_1,
    //   OCPP2_0_1_CallAction.CancelReservation,
    //   {
    //     reservationId: existingCoreReservation.id,
    //   } as OCPP2_0_1.CancelReservationRequest,
    //   undefined,
    //   correlationId,
    //   MessageOrigin.ChargingStationManagementSystem,
    // );
  }

  public async handleAsyncCommandResponse(
    tenantPartnerId: number,
    ocppVersion: OCPPVersion,
    command: CommandType,
    commandId: string,
    response: any,
  ): Promise<void> {
    const responseUrl: string | null = await this.cache.get(
      commandId,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
    );
    if (!responseUrl) {
      this.logger.error('Response URL not found in cache', {
        commandId,
      });
      return;
    }

    const tenantPartnerResponse = await this.ocpiGraphqlClient.request<
      GetTenantPartnerByIdQueryResult,
      GetTenantPartnerByIdQueryVariables
    >(GET_TENANT_PARTNER_BY_ID, {
      id: tenantPartnerId,
    });
    if (!tenantPartnerResponse.TenantPartners_by_pk) {
      this.logger.error('Tenant partner not found, unable to complete command', {
        tenantPartnerId,
        command,
        commandId,
      });
      return;
    }
    const tenantPartner = tenantPartnerResponse.TenantPartners_by_pk as TenantPartnerDto;

    const commandHandler = this.getCommandHandler(
      ocppVersion,
      tenantPartner,
      responseUrl,
      commandId,
    );
    if (!commandHandler) {
      this.logger.warn('Command handler not found for command', {
        ocppVersion,
        command,
      });
      return;
    } else {
      await commandHandler.handleAsyncCommandResponse(
        tenantPartner,
        command,
        responseUrl,
        response,
        commandId,
      );
    }
  }

  private async generateCommandId(
    responseUrl: string,
    tenantPartner: TenantPartnerDto,
  ): Promise<string> {
    const commandId = uuidv4();
    await this.cache.set(
      commandId,
      responseUrl,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
      this.config.commands.timeout,
    );

    this.cache
      .onChange(commandId, this.config.commands.timeout, COMMAND_RESPONSE_URL_CACHE_NAMESPACE)
      .then((value) => {
        if (value !== COMMAND_RESPONSE_URL_CACHE_RESOLVED) {
          this.logger.warn('Command timed out', {
            commandId,
          });
          this.commandsClientApi
            .postCommandResult(
              tenantPartner.countryCode!,
              tenantPartner.partyId!,
              tenantPartner.tenant!.countryCode!,
              tenantPartner.tenant!.partyId!,
              tenantPartner.partnerProfileOCPI!,
              responseUrl,
              {
                result: CommandResultType.TIMEOUT,
                message: {
                  language: 'en',
                  text: 'Charging station communication failed',
                },
              },
              commandId,
            )
            .catch((error: any) => {
              this.logger.error('Error posting command result on command timeout', {
                commandId,
                error,
              });
            });
        }
      })
      .catch((error: any) => {
        this.logger.error('Error in command cache onChange', {
          commandId,
          error,
        });
      });

    return commandId;
  }

  private getCommandHandler(
    ocppVersion: OCPPVersion | undefined,
    tenantPartner: TenantPartnerDto,
    responseUrl: string,
    commandId: string,
  ): OCPPCommandHandler | undefined {
    const commandHandler = ocppVersion && this.handlerRegistry.get(ocppVersion);
    if (commandHandler) {
      return commandHandler;
    } else {
      this.logger.warn('Unsupported OCPP version for command', {
        protocol: ocppVersion,
      });
      this.commandsClientApi
        .postCommandResult(
          tenantPartner.countryCode!,
          tenantPartner.partyId!,
          tenantPartner.tenant!.countryCode!,
          tenantPartner.tenant!.partyId!,
          tenantPartner.partnerProfileOCPI!,
          responseUrl,
          {
            result: CommandResultType.FAILED,
            message: {
              language: 'en',
              text: 'Charging station communication failed',
            },
          },
          commandId,
        )
        .catch((error: any) => {
          this.logger.error('Error posting command result for unsupported OCPP version', {
            commandId,
            error,
          });
        });
      return undefined;
    }
  }

  // private async mapSetChargingProfileRequest(
  //   chargingProfile: ChargingProfile,
  //   evseId: number,
  //   sessionId: string,
  //   stationId: string,
  // ): Promise<OCPP2_0_1.SetChargingProfileRequest> {
  // const startDateTime = chargingProfile.start_date_time
  //   ? new Date(chargingProfile.start_date_time)
  //   : undefined;
  // const duration = chargingProfile.duration;
  // let endDateTime;
  // if (startDateTime && duration) {
  //   endDateTime = new Date(startDateTime);
  //   endDateTime.setSeconds(endDateTime.getSeconds() + duration);
  // }
  // // Charging profile periods are required in OCPP SetChargingProfileRequest
  // if (!chargingProfile.charging_profile_period) {
  //   throw new BadRequestError(
  //     'Validation failed: Missing charging_profile_period',
  //   );
  // }
  // const scheduleId =
  //   await this.chargingProfileRepo.getNextChargingScheduleId(stationId);
  // const chargingSchedule = {
  //   id: scheduleId,
  //   startSchedule: startDateTime?.toISOString(),
  //   duration: duration,
  //   chargingRateUnit: chargingProfile.charging_rate_unit.toUpperCase(),
  //   minChargingRate: chargingProfile.min_charging_rate,
  //   chargingSchedulePeriod: chargingProfile.charging_profile_period.map(
  //     (period) => ({
  //       startPeriod: period.start_period,
  //       limit: period.limit,
  //     }),
  //   ),
  // } as OCPP2_0_1.ChargingScheduleType;
  // const profileId =
  //   await this.chargingProfileRepo.getNextChargingProfileId(stationId);
  // const setChargingProfileRequest = {
  //   evseId,
  //   chargingProfile: {
  //     id: profileId,
  //     stackLevel: 0,
  //     chargingProfilePurpose:
  //       OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
  //     chargingProfileKind: startDateTime
  //       ? OCPP2_0_1.ChargingProfileKindEnumType.Absolute
  //       : OCPP2_0_1.ChargingProfileKindEnumType.Relative,
  //     validFrom: startDateTime?.toISOString(),
  //     validTo: endDateTime?.toISOString(),
  //     chargingSchedule: [chargingSchedule],
  //     transactionId: sessionId,
  //   } as OCPP2_0_1.ChargingProfileType,
  // } as OCPP2_0_1.SetChargingProfileRequest;
  // console.log(
  //   `Mapped SetChargingProfileRequest: ${JSON.stringify(setChargingProfileRequest)}`,
  // );
  // return setChargingProfileRequest;
  // }

  /**
   * Create and store reservation related objects, including the core reservation, the ocpi reservation and the
   * reserveNow request
   *
   * @param reserveNow - OCPI reserveNow
   * @param evse - OCPI evse
   * @param countryCode - MSP country code
   * @param partyId - MSP party id
   * @returns [reserveNowRequest, coreReservationDatabaseId]
   */
  // private async createAndStoreReservations(
  //   reserveNow: ReserveNow,
  //   stationId: string,
  //   evseId: number,
  //   countryCode: string,
  //   partyId: string,
  // ): Promise<[OCPP2_0_1.ReserveNowRequest, number]> {
  // const existingOcpiReservation =
  //   await this.ocpiReservationRepo.readOnlyOneByQuery({
  //     where: {
  //       // unique constraint
  //       [OcpiReservationProps.reservationId]: reserveNow.reservation_id,
  //       [OcpiReservationProps.countryCode]: countryCode,
  //       [OcpiReservationProps.partyId]: partyId,
  //     },
  //     include: [Reservation],
  //   });
  // let coreReservationId;
  // if (!existingOcpiReservation) {
  //   // Based on OCPI 2.1.1, The reservation_id sent by the Sender (eMSP) to the Receiver (CPO) SHALL NOT be sent
  //   // directly to a Charge Point. The CPO SHALL make sure the Reservation ID sent to the Charge Point is unique and
  //   // is not used by another Sender(eMSP).
  //   coreReservationId =
  //     await this.coreReservationRepo.getNextReservationId(stationId);
  // } else {
  //   coreReservationId = existingOcpiReservation.coreReservation.id;
  // }
  // if (!coreReservationId) {
  //   throw new Error('Could not get core reservation id.');
  // }
  // const request = {
  //   id: coreReservationId,
  //   expiryDateTime: reserveNow.expiry_date.toISOString(),
  //   idToken: {
  //     idToken: reserveNow.token.uid,
  //     type: OcpiTokensMapper.mapOcpiTokenTypeToOcppIdTokenType(
  //       reserveNow.token.type,
  //     ),
  //   },
  //   evseId,
  // } as OCPP2_0_1.ReserveNowRequest;
  // const storedCoreReservation =
  //   await this.coreReservationRepo.createOrUpdateReservation(
  //     request,
  //     stationId,
  //     false,
  //   );
  // if (!storedCoreReservation) {
  //   throw new Error('Could not create or update reservation in core.');
  // }
  // await this.ocpiReservationRepo.createOrUpdateReservation(
  //   OcpiReservation.build({
  //     [OcpiReservationProps.coreReservationId]:
  //       storedCoreReservation.databaseId,
  //     [OcpiReservationProps.reservationId]: reserveNow.reservation_id,
  //     [OcpiReservationProps.countryCode]: countryCode,
  //     [OcpiReservationProps.partyId]: partyId,
  //     [OcpiReservationProps.locationId]: reserveNow.location_id,
  //     [OcpiReservationProps.evseUid]: reserveNow.evse_uid ?? null,
  //     [OcpiReservationProps.authorizationReference]:
  //       reserveNow.authorization_reference ?? null,
  //   }),
  // );
  // return [request, storedCoreReservation.databaseId];
  // }
}

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  IAuthorizationRepository,
  ITransactionEventRepository,
  Transaction,
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
  IReservationRepository,
  IOCPPMessageRepository,
} from '@citrineos/data';
import {
  AuthorizationStatusType,
  IAuthorizationDto,
  IAuthorizer,
  IMessageContext,
  MessageOrigin,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

export class TransactionService {
  private _transactionEventRepository: ITransactionEventRepository;
  private _authorizeRepository: IAuthorizationRepository;
  private _reservationRepository: IReservationRepository;
  private _ocppMessageRepository: IOCPPMessageRepository;
  private _logger: Logger<ILogObj>;
  private _authorizers: IAuthorizer[];

  constructor(
    transactionEventRepository: ITransactionEventRepository,
    authorizeRepository: IAuthorizationRepository,
    reservationRepository: IReservationRepository,
    ocppMessageRepository: IOCPPMessageRepository,
    realTimeAuthorizer: IAuthorizer,
    authorizers?: IAuthorizer[],
    logger?: Logger<ILogObj>,
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizeRepository;
    this._reservationRepository = reservationRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._authorizers = [realTimeAuthorizer, ...(authorizers || [])];
  }

  async recalculateTotalKwh(tenantId: number, transactionDbId: number) {
    const meterValues =
      await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
        tenantId,
        transactionDbId,
      );
    const meterValueTypes = meterValues.map((meterValue) =>
      OCPP2_0_1_Mapper.MeterValueMapper.toMeterValueType(meterValue),
    );
    const totalKwh = MeterValueUtils.getTotalKwh(meterValueTypes);

    await Transaction.update(
      { totalKwh: totalKwh },
      { where: { id: transactionDbId }, returning: false },
    );

    this._logger.debug(`Recalculated ${totalKwh} kWh for ${transactionDbId} transaction`);
    return totalKwh;
  }

  async authorizeOcpp201IdToken(
    tenantId: number,
    transactionEvent: OCPP2_0_1.TransactionEventRequest,
    messageContext: IMessageContext,
  ): Promise<OCPP2_0_1.TransactionEventResponse> {
    const idToken = transactionEvent.idToken!;
    const authorizations = await this._authorizeRepository.readAllByQuerystring(tenantId, {
      ...idToken,
    });

    const response: OCPP2_0_1.TransactionEventResponse = {
      idTokenInfo: {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Unknown,
        // TODO determine how/if to set personalMessage
      },
    };

    if (authorizations.length !== 1) {
      return response;
    }
    const authorization = authorizations[0];

    if (!authorization.status) {
      // Assumed to always be valid without status
      response.idTokenInfo = {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
        // TODO determine how/if to set personalMessage
      };
      return response;
    }

    // Extract DTO fields from sequelize Model<any, any> objects
    const idTokenInfo = OCPP2_0_1_Mapper.AuthorizationMapper.toIdTokenInfo(authorization);

    if (idTokenInfo.status !== OCPP2_0_1.AuthorizationStatusEnumType.Accepted) {
      // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
      // N.B. Other non-Accepted statuses should not be allowed to be stored.
      response.idTokenInfo = idTokenInfo;
      return response;
    }

    if (idTokenInfo.cacheExpiryDateTime && new Date() > new Date(idTokenInfo.cacheExpiryDateTime)) {
      response.idTokenInfo = {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Invalid,
        groupIdToken: idTokenInfo.groupIdToken,
        // TODO determine how/if to set personalMessage
      };
      return response;
    } else {
      if (
        authorization.concurrentTransaction === true &&
        transactionEvent.eventType === OCPP2_0_1.TransactionEventEnumType.Started
      ) {
        const hasConcurrent = await this._hasConcurrentTransactions(tenantId, authorization.id);
        if (hasConcurrent) {
          response.idTokenInfo = {
            status: OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx,
          };
          return response;
        }
      }

      const result = await this._applyAuthorizers(authorization, messageContext);
      response.idTokenInfo = this._mapAuthorizationDtoToIdTokenInfo(authorization, result);
    }
    this._logger.debug('idToken Authorization final status:', response.idTokenInfo.status);
    return response;
  }

  async createMeterValues(
    tenantId: number,
    meterValues: [OCPP2_0_1.MeterValueType, ...OCPP2_0_1.MeterValueType[]],
    transactionDbId?: number | null,
    transactionId?: string | null,
    tariffId?: number | null,
  ) {
    return Promise.all(
      meterValues.map(async (meterValue) => {
        const hasPeriodic: boolean = meterValue.sampledValue?.some(
          (s) => s.context === OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
        );
        if (transactionDbId && hasPeriodic) {
          await this._transactionEventRepository.createMeterValue(
            tenantId,
            meterValue,
            transactionDbId,
            transactionId,
            tariffId,
          );
        } else {
          await this._transactionEventRepository.createMeterValue(tenantId, meterValue);
        }
      }),
    );
  }

  async authorizeOcpp16IdToken(
    context: IMessageContext,
    idToken: string,
  ): Promise<OCPP1_6.StartTransactionResponse> {
    const response: OCPP1_6.StartTransactionResponse = {
      idTagInfo: {
        status: OCPP1_6.StartTransactionResponseStatus.Invalid,
      },
      transactionId: 0, // default zero for rejected transaction
    };

    try {
      // Find authorization
      const tenantId = context.tenantId;
      const authorizations = await this._authorizeRepository.readAllByQuerystring(tenantId, {
        idToken: idToken,
        type: null,
      });
      if (authorizations.length !== 1) {
        this._logger.error(
          `Found invalid authorizations ${JSON.stringify(authorizations)} for idToken: ${idToken}`,
        );
        return response;
      }
      const authorization = authorizations[0];

      // Check expiration and status
      if (!authorization.status) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Accepted;
        return response;
      }

      const idTokenInfoStatus = OCPP1_6_Mapper.AuthorizationMapper.toStartTransactionResponseStatus(
        authorization.status,
      );
      if (idTokenInfoStatus !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
        response.idTagInfo.status = idTokenInfoStatus;
        return response;
      }

      if (
        authorization.cacheExpiryDateTime &&
        new Date() > new Date(authorization.cacheExpiryDateTime)
      ) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Expired;
        return response;
      }

      // Check concurrent transactions
      const hasConcurrent = await this._hasConcurrentTransactions(tenantId, authorization.id);
      if (hasConcurrent) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
        return response;
      }

      // Check authorizers
      response.idTagInfo.status =
        OCPP1_6_Mapper.AuthorizationMapper.toStartTransactionResponseStatus(
          await this._applyAuthorizers(authorization, context),
        );
      if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
        return response;
      }

      // Accept the idToken
      response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Accepted;
      response.idTagInfo.expiryDate = authorization.cacheExpiryDateTime;
      if (authorization.groupAuthorizationId) {
        // Look up the referenced Authorization for parentIdTag
        const parentAuth = await this._authorizeRepository.readOnlyOneByQuery(tenantId, {
          where: { id: authorization.groupAuthorizationId },
        });
        if (parentAuth) {
          response.idTagInfo.parentIdTag = parentAuth.idToken;
        }
      }
      return response;
    } catch (e) {
      this._logger.error(`Authorization for idToken ${idToken} failed.`, e);
      response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Invalid;
      return response;
    }
  }

  async deactivateReservation(
    tenantId: number,
    transactionId: string,
    reservationId: number,
    stationId: string,
  ): Promise<void> {
    await this._reservationRepository.updateAllByQuery(
      tenantId,
      {
        terminatedByTransaction: transactionId,
        isActive: false,
      },
      {
        where: {
          tenantId,
          id: reservationId,
          stationId: stationId,
        },
      },
    );
  }

  async updateTransactionStatus(
    tenantId: number,
    stationId: string,
    correlationId: string,
    ongoingIndicator: boolean,
  ) {
    const request = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        stationId,
        correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (!request) {
      this._logger.error(
        `No valid GetTransactionStatusRequest found for correlationId ${correlationId}`,
      );
      return;
    }

    const transactionId = request.message[3].transactionId;
    if (!transactionId) {
      this._logger.error(`No valid transactionId found from the message ${request.message[3]}`);
      return;
    }

    const updatedTransaction =
      await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
        tenantId,
        { isActive: ongoingIndicator },
        transactionId,
        stationId,
      );
    if (!updatedTransaction) {
      this._logger.error(`Update transaction ${transactionId} failed.`);
    }
    this._logger.info(`Updated transaction ${transactionId} isActive to ${ongoingIndicator}`);
  }

  private async _applyAuthorizers(
    authorization: IAuthorizationDto,
    messageContext: IMessageContext,
  ): Promise<AuthorizationStatusType> {
    let result = authorization.status;
    for (const authorizer of this._authorizers) {
      if (result !== AuthorizationStatusType.Accepted) {
        break;
      }

      result = await authorizer.authorize(authorization, messageContext);
    }
    return result;
  }

  private async _hasConcurrentTransactions(
    tenantId: number,
    authorizationId: number,
  ): Promise<boolean> {
    const activeTransactions =
      await this._transactionEventRepository.readAllActiveTransactionsByAuthorizationId(
        tenantId,
        authorizationId,
      );

    return activeTransactions.length > 0;
  }

  private _mapAuthorizationDtoToIdTokenInfo(
    dto: IAuthorizationDto,
    status: AuthorizationStatusType,
  ): OCPP2_0_1.IdTokenInfoType {
    return {
      status: OCPP2_0_1_Mapper.AuthorizationMapper.fromAuthorizationStatusType(status),
      cacheExpiryDateTime: dto.cacheExpiryDateTime ?? null,
      chargingPriority: dto.chargingPriority ?? null,
      language1: dto.language1 ?? null,
      language2: dto.language2 ?? null,
      groupIdToken: dto.groupAuthorization
        ? ({
            idToken: dto.groupAuthorization?.idToken ?? '',
            type: dto.groupAuthorization?.idTokenType
              ? OCPP2_0_1_Mapper.AuthorizationMapper.toIdTokenEnumType(
                  dto.groupAuthorization?.idTokenType,
                )
              : '',
          } as OCPP2_0_1.IdTokenType)
        : null,
      personalMessage: dto.personalMessage
        ? ({
            content: dto.personalMessage.content ?? '',
            language: dto.personalMessage.language ?? '',
            format: dto.personalMessage.format ?? OCPP2_0_1.MessageFormatEnumType.ASCII,
          } as OCPP2_0_1.MessageContentType)
        : null,
    };
  }
}

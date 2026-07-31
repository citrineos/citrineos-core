// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  AuthorizationStatusEnum,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import {
  Authorization,
  type IAuthorizationRepository,
  type ITransactionEventRepository,
  StartTransaction,
  Transaction,
} from '@/dal/index.js';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StopTransaction)
export class StopTransactionRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _transactionEventRepository: ITransactionEventRepository;

  constructor({
    logger,
    ocppSender,
    authorizationRepository,
    transactionEventRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    authorizationRepository: IAuthorizationRepository;
    transactionEventRepository: ITransactionEventRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._authorizeRepository = authorizationRepository;
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.StopTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(`StopTransactionRequest ${message.protocol}`, message, props);

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

    await this._ocppSender.sendCallResultWithMessage(message, stopTransactionResponse);

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
}

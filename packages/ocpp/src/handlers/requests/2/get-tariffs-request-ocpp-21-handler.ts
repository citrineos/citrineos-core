// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import { type HandlerProperties, OCPP2_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { Op } from 'sequelize';
import {
  Authorization,
  Connector,
  Evse,
  type IAuthorizationRepository,
  type IChargingStationRepository,
  Tariff,
  Transaction,
} from '@citrineos/dal';

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
@AsRequestHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.GetTariffs)
export class GetTariffsRequestOcpp21Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _authorizationRepository: IAuthorizationRepository;
  protected _locationRepository: IChargingStationRepository;

  constructor({
    logger,
    ocppSender,
    authorizationRepository,
    locationRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    authorizationRepository: IAuthorizationRepository;
    locationRepository: IChargingStationRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._authorizationRepository = authorizationRepository;
    this._locationRepository = locationRepository;
  }

  async handle(
    message: IMessage<OCPP2_1.GetTariffsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`GetTariffsRequest ${message.protocol}`),
      message,
      props,
    );

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
        await this._ocppSender.sendCallResultWithMessage(message, {
          status: OCPP2_1.TariffGetStatusEnumType.Rejected,
          statusInfo: {
            reasonCode: 'StationNotFound',
            additionalInfo: `Charging station ${ocppConnectionName} not found`,
          },
        } as OCPP2_1.GetTariffsResponse);

        return;
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
      const connectors = await Connector.findAll({
        where: {
          tenantId,
          ocppConnectionName,
          tariffId: { [Op.ne]: null },
        },
        include: [
          {
            model: Evse,
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
      const authorizations =
        await this._authorizationRepository.findAllAuthorizationsWithTariffs(tenantId);

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
            model: Evse,
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
        await this._ocppSender.sendCallResultWithMessage(message, {
          status: OCPP2_1.TariffGetStatusEnumType.NoTariff,
        } as OCPP2_1.GetTariffsResponse);
        return;
      }

      this._logger.info(
        `Returning ${tariffAssignments.length} tariff assignments for station ${ocppConnectionName}`,
      );

      await this._ocppSender.sendCallResultWithMessage(message, {
        status: OCPP2_1.TariffGetStatusEnumType.Accepted,
        tariffAssignments: tariffAssignments as [
          OCPP2_1.TariffAssignmentType,
          ...OCPP2_1.TariffAssignmentType[],
        ],
      } as OCPP2_1.GetTariffsResponse);
    } catch (error) {
      this._logger.error('Error handling GetTariffsRequest:', error);
      await this._ocppSender.sendCallResultWithMessage(message, {
        status: OCPP2_1.TariffGetStatusEnumType.Rejected,
        statusInfo: {
          reasonCode: 'InternalError',
          additionalInfo: error instanceof Error ? error.message : 'Unknown error',
        },
      } as OCPP2_1.GetTariffsResponse);
    }
  }
}

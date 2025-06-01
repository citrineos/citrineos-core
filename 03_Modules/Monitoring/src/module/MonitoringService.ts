import { IVariableMonitoringRepository } from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { OCPP2_0_1, OCPP2_0_1_CallAction } from '@citrineos/base';

export class MonitoringService {
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  protected _logger: Logger<ILogObj>;

  constructor(
    variableMonitoringRepository: IVariableMonitoringRepository,
    logger?: Logger<ILogObj>,
  ) {
    this._variableMonitoringRepository = variableMonitoringRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async processClearMonitoringResult(
    tenantId: number,
    stationId: string,
    clearMonitoringResult: [
      OCPP2_0_1.ClearMonitoringResultType,
      ...OCPP2_0_1.ClearMonitoringResultType[],
    ],
  ): Promise<void> {
    for (const clearMonitoringResultType of clearMonitoringResult) {
      const resultStatus: OCPP2_0_1.ClearMonitoringStatusEnumType =
        clearMonitoringResultType.status;
      const monitorId: number = clearMonitoringResultType.id;

      // Reject the variable monitoring if Charging Station accepts to clear or cannot find it.
      if (
        resultStatus === OCPP2_0_1.ClearMonitoringStatusEnumType.Accepted ||
        resultStatus === OCPP2_0_1.ClearMonitoringStatusEnumType.NotFound
      ) {
        await this._variableMonitoringRepository.rejectVariableMonitoringByIdAndStationId(
          tenantId,
          OCPP2_0_1_CallAction.ClearVariableMonitoring,
          monitorId,
          stationId,
        );
      } else {
        const statusInfo: OCPP2_0_1.StatusInfoType | undefined | null =
          clearMonitoringResultType.statusInfo;
        this._logger.error(
          'Failed to clear variable monitoring.',
          monitorId,
          resultStatus,
          statusInfo?.reasonCode,
          statusInfo?.additionalInfo,
        );
      }
    }
  }
}

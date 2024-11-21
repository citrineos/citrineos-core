import { IVariableMonitoringRepository } from '@citrineos/data/dist/interfaces/repositories';
import { ILogObj, Logger } from 'tslog';
import {
  CallAction,
  ClearMonitoringResultType,
  ClearMonitoringStatusEnumType,
  StatusInfoType,
} from '@citrineos/base';

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
    stationId: string,
    clearMonitoringResult: [
      ClearMonitoringResultType,
      ...ClearMonitoringResultType[],
    ],
  ): Promise<void> {
    for (const clearMonitoringResultType of clearMonitoringResult) {
      const resultStatus: ClearMonitoringStatusEnumType =
        clearMonitoringResultType.status;
      const monitorId: number = clearMonitoringResultType.id;

      // Reject the variable monitoring if Charging Station accepts to clear or cannot find it.
      if (
        resultStatus === ClearMonitoringStatusEnumType.Accepted ||
        resultStatus === ClearMonitoringStatusEnumType.NotFound
      ) {
        await this._variableMonitoringRepository.rejectVariableMonitoringByIdAndStationId(
          OCPP2_0_1_CallAction.ClearVariableMonitoring,
          monitorId,
          stationId,
        );
      } else {
        const statusInfo: StatusInfoType | undefined | null =
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

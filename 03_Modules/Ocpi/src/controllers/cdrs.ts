import {AbstractModuleApi} from '@citrineos/base/dist/interfaces/api/AbstractModuleApi';
import {MonitoringModule} from '@citrineos/monitoring/dist/module/module';
import {IMonitoringModuleApi} from '@citrineos/monitoring/dist/module/interface';
import {FastifyInstance, FastifyRequest} from 'fastify';
import {HttpMethod} from '@citrineos/base';
import {sequelize} from '@citrineos/data';
import {ILogObj, Logger} from 'tslog';
import {OcpiResponseUnit} from '../model/ocpiResponseUnit';
import {CDR} from '../model/cDR';
import {AsOcpiEndpoint} from '../util/as.ocpi.endpoint';

/**
 * Server API for the Monitoring module.
 */
export class OcpiModuleApi
  extends AbstractModuleApi<MonitoringModule>
  implements IMonitoringModuleApi {

  /**
   * Constructor for the class.
   *
   * @param {MonitoringModule} monitoringModule - The monitoring module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    monitoringModule: MonitoringModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(monitoringModule, server, logger);
  }

  @AsOcpiEndpoint(
    '/ocpi/receiver/2.2/cdrs',
    HttpMethod.Post,
    null,
    CDR,
    null,
    null,
    OcpiResponseUnit,
  )
  async putDeviceModelVariables(
    request: FastifyRequest<{
      Body: CDR;
    }>,
  ): Promise<sequelize.VariableAttribute[]> {
    return new Promise(() => {}); // TODO
  }
}

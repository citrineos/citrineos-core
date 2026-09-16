// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RoutingControllersOptions } from 'routing-controllers';
import type { AwilixContainer } from 'awilix';
import Koa from 'koa';
import * as packageJson from '../../package.json' with { type: 'json' };
import type { OcpiModuleToken } from './container.js';
import { OcpiModule } from '../types/ocpi-module.js';
import { KoaServer } from './koa-server.js';
import type { OcpiConfig } from '../config/ocpi-types.js';
import type { IDtoModule } from '../handlers/index.js';
import { HealthController } from './koa-server-health-controller.js';

export class OcpiServer extends KoaServer {
  private readonly ocpiConfig: OcpiConfig;
  private readonly container: AwilixContainer;
  private _modules: (OcpiModule | IDtoModule)[] = [];
  get modules(): (OcpiModule | IDtoModule)[] {
    return this._modules;
  }

  private readonly moduleList: OcpiModuleToken[];

  constructor(ocpiConfig: OcpiConfig, container: AwilixContainer, moduleList: OcpiModuleToken[]) {
    super();

    this.ocpiConfig = ocpiConfig;
    this.container = container;
    this.moduleList = moduleList;
  }

  public async initialize() {
    for (const moduleToken of this.moduleList) {
      const constructedModule = this.container.resolve<OcpiModule & IDtoModule>(moduleToken);
      if (constructedModule.init) {
        await constructedModule.init();
      }
      if (constructedModule.initHandlers) {
        await constructedModule.initHandlers();
      }
      this._modules.push(constructedModule);
    }
    this.initKoaServer();
  }

  private initKoaServer() {
    try {
      this.koa = new Koa();
      const controllers = this._modules.map((module) => (module as OcpiModule).getController());
      const options: RoutingControllersOptions = {
        controllers: [...controllers, HealthController],
        routePrefix: '/ocpi',
        middlewares: [],
        defaultErrorHandler: false,
      } as RoutingControllersOptions;
      this.initApp(options);

      this.initKoaSwagger(
        {
          title: 'CitrineOS OCPI 2.2.1',
          version: packageJson.default.version,
        },
        [
          {
            url: '/ocpi',
          },
        ],
      );
      this.run(this.ocpiConfig.ocpiServer.host, this.ocpiConfig.ocpiServer.port);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

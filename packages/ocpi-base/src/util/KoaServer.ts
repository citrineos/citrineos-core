// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import Koa from 'koa';
import type { RoutingControllersOptions } from 'routing-controllers';
import { getMetadataArgsStorage, MetadataArgsStorage, useKoaServer } from 'routing-controllers';
import type { InfoObject, OpenAPIObject, ServerObject } from 'openapi3-ts';
import KoaLogger from 'koa-logger';
import { routingControllersToSpec } from '../openapi-spec-helper/index.js';
import { getAllSchemas } from '../openapi-spec-helper/schemas.js';
import { koaSwagger } from 'koa2-swagger-ui';
import { Server } from 'http';

export class KoaServer {
  koa!: Koa;
  app!: Koa;
  storage!: MetadataArgsStorage;
  spec!: OpenAPIObject;
  server!: Server;

  public run(host: string, port: number) {
    this.app.on('error', (err, _ctx) => {
      console.log('Error intercepted by Koa:', err.message);
    });
    this.server = this.app.listen(port, host);
    console.log(`Server started on port ${port}`);
  }

  public shutdown() {
    if (this.server) {
      this.server.close(() => {
        console.log('Koa server closed');
      });
    } else {
      console.log('No server to close');
    }
  }

  protected initLogger() {
    this.koa.use(KoaLogger());
  }

  protected initApp(options: RoutingControllersOptions = {}) {
    this.app = useKoaServer(this.koa, options);
    this.initLogger();
  }

  protected initKoaSwagger(info: InfoObject, servers: ServerObject[] = []) {
    this.storage = getMetadataArgsStorage();
    this.spec = routingControllersToSpec(
      this.storage,
      {},
      {
        info,
        servers,
        security: [
          {
            authorization: [],
          },
        ],
      },
    );
    this.spec['components'] = {
      securitySchemes: {
        authorization: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Token <base64_token>',
        },
      },
      schemas: getAllSchemas(),
    };
    this.app.use(
      koaSwagger({
        routePrefix: '/docs',
        exposeSpec: true,
        swaggerOptions: {
          spec: this.spec as any,
        },
      }),
    );
  }
}

import {CdrsController} from './controllers/cdrs.controller';
import {getMetadataArgsStorage, useKoaServer} from 'routing-controllers';
import {koaSwagger} from 'koa2-swagger-ui';
import Koa from 'koa';
import {ChargingProfilesController} from './controllers/charging.profiles.controller';
import {authorizationChecker} from './util/authorization.checker';
import {routingControllersToSpec} from './util/openapi';
import {AuthMiddleware} from './util/middleware/auth.middleware';
import {GlobalExceptionHandler} from './util/middleware/global.exception.handler';
import {getAllSchemas} from './schemas';
import {VersionNumber} from "./model/VersionNumber";
import {TariffsController} from "./controllers/tariffs.controller";
import {CommandsController} from "./controllers/commands.controller";
import {LocationsController} from "./controllers/locations.controller";

export {CredentialsModuleApi} from './modules/temp/credentials.api';
export {OcpiModule} from './modules/temp/module';
export {EverythingElseApi} from './modules/temp/everything.else.api';
export {VersionsModuleApi} from './modules/temp/versions.api';

const koa = new Koa();

const app = useKoaServer(koa, {
  authorizationChecker: authorizationChecker,
  controllers: [
    CdrsController,
    ChargingProfilesController,
    TariffsController,
    CommandsController,
    LocationsController
  ],
  routePrefix: '/ocpi/:versionId', // dynamic API version in the prefix
  middlewares: [
    AuthMiddleware,
    GlobalExceptionHandler
  ],
  defaultErrorHandler: false, // Important: Disable the default error handler
});

const storage = getMetadataArgsStorage();

const spec = routingControllersToSpec(
  storage,
  {},
  {
    info: {title: 'CitrineOS OCPI 2.2.1', version: '1.0.0'},
    servers: Object.values(VersionNumber).map(version => ({
      url: `/ocpi/${version}`
    })),
    security: [
      {
        authorization: [],
      },
    ],
  },
);

spec['components'] = {
  securitySchemes: {
    authorization: {
      type: 'http',
      scheme: 'bearer',
    },
  },
  schemas: getAllSchemas(),
};

app.use(
  koaSwagger({
    routePrefix: '/docs',
    exposeSpec: true,
    swaggerOptions: {
      spec: spec as any,
    },
  }),
);

app.on('error', (err, _ctx) => {
  console.log('Error intercepted by Koa:', err.message);
});

app.listen(8085);
console.log('Server started on port 8085');

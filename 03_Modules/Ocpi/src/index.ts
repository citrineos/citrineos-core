import { CdrsController } from './controllers/cdrs.controller';
import { getMetadataArgsStorage, useKoaServer } from 'routing-controllers';
import { koaSwagger } from 'koa2-swagger-ui';
import Koa from 'koa';
import {
  targetConstructorToSchema,
  validationMetadatasToSchemas,
} from 'class-validator-jsonschema';
import { Constructor } from './util/util';
import { ChargingProfilesController } from './controllers/charging.profiles.controller';

// export {CredentialsModuleApi} from './modules/temp/credentials.api';
// export {OcpiModule} from './modules/temp/module';
// export {EverythingElseApi} from './modules/temp/everything.else.api';
// export {VersionsModuleApi} from './modules/temp/versions.api';
import { defaultClassValidatorJsonSchemaOptions } from './util/class.validator';
import { SchemaStore } from './util/schema.store';
import { authorizationChecker } from './util/authorization.checker';
import { routingControllersToSpec } from './util/openapi';
import { AuthMiddleware } from './util/middleware/auth.middleware';
import { GlobalExceptionHandler } from './util/middleware/global.exception.handler';
import { schemas } from './schemas';

const routePrefix = '/ocpi';

const koa = new Koa();

const app = useKoaServer(koa, {
  authorizationChecker: authorizationChecker,
  controllers: [CdrsController, ChargingProfilesController],
  routePrefix: routePrefix,
  middlewares: [AuthMiddleware, GlobalExceptionHandler],
  defaultErrorHandler: false, // Important: Disable the default error handler
});

const storage = getMetadataArgsStorage();

const spec = routingControllersToSpec(
  storage,
  {},
  {
    info: { title: 'CitrineOS OCPI 2.2.1', version: '1.0.0' },
    servers: [{ url: routePrefix }],
    security: [
      {
        authorization: [],
      },
    ],
    components: {
      securitySchemes: {
        authorization: {
          type: 'http',
          scheme: 'bearer',
        },
      },
      schemas,
    },
  },
);

app.use(
  koaSwagger({
    routePrefix: '/docs',
    exposeSpec: true,
    swaggerOptions: {
      spec: spec as any,
    },
  }),
);

app.on('error', (err, ctx) => {
  console.log('Error intercepted by Koa:', err.message);
});

app.listen(8085);
console.log('Server started on port 8085');

export const classToJsonSchema = (clz: Constructor<any>) =>
  targetConstructorToSchema(clz, {});

import 'reflect-metadata';

import { createKoaServer } from 'routing-controllers';
import { TestController } from './controllers/test.controller';
import { koaSwagger } from 'koa2-swagger-ui';
import { swaggerDoc } from './swagger';
import { CdrsController } from './controllers/cdrs.controller';

const app = createKoaServer({
  controllers: [TestController, CdrsController],
});

const swaggerSpec: any = swaggerDoc({
  info: {
    title: 'Citrine OCPI API',
    version: '1.0.0',
    description: 'TODO',
  },
});

app.use(
  koaSwagger({
    routePrefix: '/api/docs',
    swaggerOptions: {
      spec: swaggerSpec,
    },
  }),
);

app.listen(3000);

import Router from 'koa';

export const DEFINITIONS: any = {};
let DEFINITION: any = {};

export function Definition() {
  return function <T extends new (...args: any[]) => {}>(constructor: T) {
    DEFINITIONS[constructor] = {
      name: constructor.name,
      type: 'object',
      ...DEFINITION,
    };
    DEFINITION = {};
  };
}

function toSwaggerRef(ref: any) {
  if (ref.charAt) {
    return ref;
  }
  const definition = DEFINITIONS[ref];
  return `#/definitions/${definition.name}`;
}

export interface ApiPropertyProps {
  required?: boolean;
  type: string;
  example?: string;
  items?: { $ref?: any };
}

export function ApiProperty(props: ApiPropertyProps) {
  return function (_target: any, propertyKey: string) {
    if (!DEFINITION.required) {
      DEFINITION.required = [];
    }
    if (!DEFINITION.properties) {
      DEFINITION.properties = {};
    }

    if (props.required) {
      DEFINITION.required.push(propertyKey);
    }
    if (props.items?.$ref) {
      props.items.$ref = toSwaggerRef(props.items.$ref);
    }

    DEFINITION.properties = { ...DEFINITION.properties, [propertyKey]: props };
  };
}

function getDefinitions(): any {
  return Object.values(DEFINITIONS).reduce(function (acc: any, cur: any) {
    return { ...acc, [cur.name]: cur };
  }, {});
}

export const PATHS: any = {};
let PARAMETERS: any[] = [];
let RESPONSES: any = {};

export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PATCH = 'patch',
  PUT = 'put',
  DELETE = 'delete',
}

export interface ApiOperationProps {
  path: string;
  method: HttpMethod;
  description?: string;
  consumes?: string[];
  operationId?: string;
  tags?: string[];
}

export function ApiOperation(props: ApiOperationProps) {
  const swaggerPath = props.path
    .split('/')
    .map((token) => {
      if (!token.startsWith(':')) {
        return token;
      }
      return `{${token.slice(1)}}`;
    })
    .join('/');

  PATHS[swaggerPath] = {
    [props.method]: {
      description: props.description,
      consumes: props.consumes,
      parameters: PARAMETERS,
      responses: RESPONSES,
      operationId: props.operationId,
      tags: props.tags,
    },
  };
  PARAMETERS = [];
  RESPONSES = {};

  return (
    target: any,
    propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) => {
    if (!target._paths) {
      target._paths = [];
    }
    target._paths.push({
      path: props.path,
      method: props.method,
      propertyKey,
    });
  };
}

export interface ParameterProps {
  in: 'path' | 'body';
  name?: string;
  schema?: { $ref?: any };
  required?: boolean;
}

export function ApiParameter(props: ParameterProps) {
  const { schema, ...rest } = props;

  if (schema?.$ref) {
    schema.$ref = toSwaggerRef(schema.$ref);
  }

  PARAMETERS.push({
    ...rest,
    schema,
  });

  return (
    _target: any,
    _propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) => {};
}

export interface ResponseProps {
  status: number;
  type: string;
  schema?: { $ref: any };
}

export function ApiResponse(props: ResponseProps) {
  const { schema, status, type } = props;

  if (schema?.$ref) {
    schema.$ref = toSwaggerRef(schema.$ref);
  }

  if (!RESPONSES[status]) {
    RESPONSES[status] = { content: {} };
  }
  RESPONSES[status].content = {
    [type]: {
      schema,
    },
  };

  return (
    _target: any,
    _propertyKey: string,
    _descriptor: PropertyDescriptor,
  ) => {};
}

export function applyRoutes(controller: any, router: Router) {
  if (!controller._paths) {
    return;
  }

  controller._paths.forEach((pathObj: any) => {
    const { path, method, propertyKey } = pathObj;
    (router as any)[method as Methods](path, controller[propertyKey]);
  });
}

export interface SwaggerProps {
  info: {
    title: string;
    version: string;
    description: string;
  };
}

export function swaggerDoc(props: SwaggerProps) {
  const definitions = getDefinitions();

  return {
    swagger: '2.0',
    info: props.info,
    paths: PATHS,
    definitions,
    responses: {},
    parameters: {},
    securityDefinitions: {},
    tags: {},
  };
}

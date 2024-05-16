import {OcpiResponse} from '../util/ocpi.response';
import {OcpiParams} from "./util/ocpi.params";

export enum OcpiModules {
  Cdrs = 'cdrs',
  Tariffs = 'tariffs',
  ChargingProfiles = 'chargingprofiles',
  Commands = 'commands',
  Locations = 'locations',
}

export type FetchAPI = WindowOrWorkerGlobalScope['fetch'];
export type InitOverrideFunction = (requestContext: {
  init: HTTPRequestInit;
  context: RequestOpts;
}) => Promise<RequestInit>;

export type Json = any;
export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface HTTPHeaders {
  [key: string]: string;
}

export interface HTTPQuery {
  [key: string]:
    | string
    | number
    | null
    | boolean
    | Array<string | number | null | boolean>
    | Set<string | number | null | boolean>
    | HTTPQuery;
}

export type HTTPBody = Json | FormData | URLSearchParams;

export interface HTTPRequestInit {
  headers?: HTTPHeaders;
  method: HTTPMethod;
  credentials?: RequestCredentials;
  body?: HTTPBody;
}

export interface ApiResponse<T> {
  raw: Response;

  value(): Promise<T>;
}

export interface RequestOpts {
  path: string;
  method: HTTPMethod;
  headers: HTTPHeaders;
  query?: HTTPQuery;
  body?: HTTPBody;
}

export interface ConfigurationParameters {
  basePath?: string; // override base path
  fetchApi?: FetchAPI; // override for fetch implementation
  queryParamsStringify?: (params: HTTPQuery) => string; // stringify function for query strings
  username?: string; // parameter for basic security
  password?: string; // parameter for basic security
  apiKey?:
    | string
    | Promise<string>
    | ((name: string) => string | Promise<string>); // parameter for apiKey security
  accessToken?:
    | string
    | Promise<string>
    | ((name?: string, scopes?: string[]) => string | Promise<string>); // parameter for oauth2 security
  headers?: HTTPHeaders; // header params we want to use on every request
  credentials?: RequestCredentials; // value for the credentials param we want to use on each request
}

export class ResponseError extends Error {
  override name = 'ResponseError' as const;

  constructor(
    public response: Response,
    msg?: string,
  ) {
    super(msg);
  }
}

export class FetchError extends Error {
  override name = 'FetchError' as const;

  constructor(
    public cause: Error,
    msg?: string,
  ) {
    super(msg);
  }
}

export class RequiredError extends Error {
  override name = 'RequiredError' as const;

  constructor(
    public field: string,
    msg?: string,
  ) {
    super(msg);
  }
}

export type ResponseTransformer<T> = (json: any) => T;

export class JSONApiResponse<T> {
  constructor(
    public raw: Response,
    private transformer: ResponseTransformer<T> = (jsonValue: any) => jsonValue,
  ) {
  }

  async value(): Promise<T> {
    return this.transformer(await this.raw.json());
  }
}

export function querystring(params: HTTPQuery, prefix: string = ''): string {
  return (
    Object.keys(params)
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      .map((key) => querystringSingleKey(key, params[key], prefix))
      .filter((part) => part.length > 0)
      .join('&')
  );
}

function querystringSingleKey(
  key: string,
  value:
    | string
    | number
    | null
    | undefined
    | boolean
    | Array<string | number | null | boolean>
    | Set<string | number | null | boolean>
    | HTTPQuery,
  keyPrefix: string = '',
): string {
  const fullKey = keyPrefix + (keyPrefix.length ? `[${key}]` : key);
  if (value instanceof Array) {
    const multiValue = value
      .map((singleValue) => encodeURIComponent(String(singleValue)))
      .join(`&${encodeURIComponent(fullKey)}=`);
    return `${encodeURIComponent(fullKey)}=${multiValue}`;
  }
  if (value instanceof Set) {
    const valueAsArray = Array.from(value);
    return querystringSingleKey(key, valueAsArray, keyPrefix);
  }
  if (value instanceof Date) {
    return `${encodeURIComponent(fullKey)}=${encodeURIComponent(value.toISOString())}`;
  }
  if (value instanceof Object) {
    return querystring(value as HTTPQuery, fullKey);
  }
  return `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`;
}

export class Configuration {
  // todo do we want to keep this configuration or adjust, seems only base path is being used
  constructor(private configuration: ConfigurationParameters = {}) {
  }

  get basePath(): string {
    return this.configuration.basePath != null
      ? this.configuration.basePath
      : process.env.BASE_PATH || 'localhost';
  }

  get fetchApi(): FetchAPI | undefined {
    return this.configuration.fetchApi;
  }

  get queryParamsStringify(): (params: HTTPQuery) => string {
    return this.configuration.queryParamsStringify || querystring;
  }

  get username(): string | undefined {
    return this.configuration.username;
  }

  get password(): string | undefined {
    return this.configuration.password;
  }

  get apiKey(): ((name: string) => string | Promise<string>) | undefined {
    const apiKey = this.configuration.apiKey;
    if (apiKey) {
      return typeof apiKey === 'function' ? apiKey : () => apiKey;
    }
    return undefined;
  }

  get accessToken():
    | ((name?: string, scopes?: string[]) => string | Promise<string>)
    | undefined {
    const accessToken = this.configuration.accessToken;
    if (accessToken) {
      return typeof accessToken === 'function'
        ? accessToken
        : async () => accessToken;
    }
    return undefined;
  }

  get headers(): HTTPHeaders | undefined {
    return this.configuration.headers;
  }

  get credentials(): RequestCredentials | undefined {
    return this.configuration.credentials;
  }

  set config(configuration: Configuration) {
    this.configuration = configuration;
  }
}

export const DefaultConfig = new Configuration();

function isBlob(value: any): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

function isFormData(value: any): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export class BaseAPI {

  CONTROLLER_PATH = 'null';

  private static readonly jsonRegex = new RegExp(
    // eslint-disable-next-line no-control-regex
    '^(:?application/json|[^;/ \t]+/[^;/ \t]+[+]json)[ \t]*(:?;.*)?$',
    'i',
  );

  constructor(protected configuration = DefaultConfig) {
  }

  validateRequiredParam(
    params: any,
    ...paramNameList: string[]
  ) {
    for (let i = 0; i < paramNameList.length; i++) {
      const paramName = paramNameList[i];
      if ((params as any)[paramName] == null) {
        throw new RequiredError(
          paramName,
          this.getRequiredParametersErrorMsgString(paramName)
        );
      }
    }
  }

  validateOcpiParams(
    params: OcpiParams,
  ) {
    if (!params.fromCountryCode || !params.fromCountryCode.length || params.fromCountryCode.length !== 2) {
      throw new RequiredError(
        params.fromCountryCode,
        'Required parameter fromCountryCode must be a 2 character string',
      );
    }
    if (!params.toCountryCode || !params.toCountryCode.length || params.toCountryCode.length !== 2) {
      throw new RequiredError(
        params.toCountryCode,
        'Required parameter toCountryCode must be a 2 character string',
      );
    }
    if (!params.fromPartyId || !params.fromPartyId.length || params.fromPartyId.length !== 3) {
      throw new RequiredError(
        params.fromPartyId,
        'Required parameter fromPartyId must be a 3 character string',
      );
    }
    if (!params.toPartyId || !params.toPartyId.length || params.toPartyId.length !== 3) {
      throw new RequiredError(
        params.toPartyId,
        'Required parameter toPartyId must be a 3 character string',
      );
    }
  }

  getRequiredParametersErrorMsgString(...params: string[]): string {
    return `Required parameters [${params.join(',')}] are null or undefined`;
  }

  /**
   * Check if the given MIME is a JSON MIME.
   * JSON MIME examples:
   *   application/json
   *   application/json; charset=UTF8
   *   APPLICATION/JSON
   *   application/vnd.company+json
   * @param mime - MIME (Multipurpose Internet Mail Extensions)
   * @return True if the given MIME is JSON, false otherwise.
   */
  protected isJsonMime(mime: string | null | undefined): boolean {
    if (!mime) {
      return false;
    }
    return BaseAPI.jsonRegex.test(mime);
  }

  protected getBasePath(params: OcpiParams) {
    return `/ocpi/${params.versionId}/${this.CONTROLLER_PATH}`;
  }

  protected async baseRequest(context: RequestOpts): Promise<Response> {
    const {url, init} = await this.createFetchParams(context);
    return await this.fetchApi(url, init);
  }

  protected async request<T>(context: RequestOpts): Promise<OcpiResponse<T>> {
    const response = await this.baseRequest(context);
    if (response && response.status >= 200 && response.status < 300) {
      const ocpiResponse: OcpiResponse<T> = new OcpiResponse();
      ocpiResponse.status_code = response.status;
      ocpiResponse.data = (await response.json()) as T;
      ocpiResponse.timestamp = new Date();
      return ocpiResponse;
    }
    throw new ResponseError(response, 'Response returned an error code');
  }

  private async createFetchParams(context: RequestOpts) {
    let url = this.configuration.basePath + context.path;
    if (
      context.query !== undefined &&
      Object.keys(context.query).length !== 0
    ) {
      // only add the querystring to the URL if there are query parameters.
      // this is done to avoid urls ending with a "?" character which buggy webservers
      // do not handle correctly sometimes.
      url += '?' + this.configuration.queryParamsStringify(context.query);
    }

    const headers = Object.assign(
      {},
      this.configuration.headers,
      context.headers,
    );
    Object.keys(headers).forEach((key) =>
      headers[key] === undefined ? delete headers[key] : {},
    );

    const initParams = {
      method: context.method,
      headers,
      body: context.body,
      credentials: this.configuration.credentials,
    };

    const overriddenInit: RequestInit = {
      ...initParams,
    };

    let body: any;
    if (
      isFormData(overriddenInit.body) ||
      overriddenInit.body instanceof URLSearchParams ||
      isBlob(overriddenInit.body)
    ) {
      body = overriddenInit.body;
    } else if (this.isJsonMime(headers['Content-Type'])) {
      body = JSON.stringify(overriddenInit.body);
    } else {
      body = overriddenInit.body;
    }

    const init: RequestInit = {
      ...overriddenInit,
      body,
    };

    return {url, init};
  }

  private fetchApi = async (url: string, init: RequestInit) => {
    const fetchParams = {url, init};
    let response: Response | undefined;
    try {
      response = await (this.configuration.fetchApi || fetch)(
        fetchParams.url,
        fetchParams.init,
      );
    } catch (e) {
      if (response === undefined) {
        if (e instanceof Error) {
          throw new FetchError(
            e,
            'The request failed and the interceptors did not return an alternative response',
          );
        } else {
          throw e;
        }
      }
    }
    return response;
  };
}

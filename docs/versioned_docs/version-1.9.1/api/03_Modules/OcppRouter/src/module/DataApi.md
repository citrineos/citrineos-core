[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/OcppRouter/src/module/DataApi

# 03_Modules/OcppRouter/src/module/DataApi

## Classes

### AdminApi

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L57)

Admin API for the OcppRouter.

#### Extends

- `AbstractModuleApi`\<`IMessageRouter`\>

#### Implements

- [`IAdminApi`](interface.md#iadminapi)

#### Constructors

##### Constructor

```ts
new AdminApi(
   ocppRouter,
   networkConnection,
   server,
   config,
   logger?,
   subscriptionRepository?,
   serverNetworkProfileRepository?): AdminApi;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L73)

Constructs a new instance of the class.

###### Parameters

| Parameter                         | Type                              | Description                                     |
| --------------------------------- | --------------------------------- | ----------------------------------------------- |
| `ocppRouter`                      | `IMessageRouter`                  | The OcppRouter module.                          |
| `networkConnection`               | `INetworkConnection`              | The network connection instance.                |
| `server`                          | `FastifyInstance`                 | The Fastify server instance.                    |
| `config`                          | `object` & `object`               | The configuration instance.                     |
| `logger?`                         | `Logger`\<`ILogObj`\>             | The logger instance.                            |
| `subscriptionRepository?`         | `ISubscriptionRepository`         | The subscription repository instance.           |
| `serverNetworkProfileRepository?` | `IServerNetworkProfileRepository` | The server network profile repository instance. |

###### Returns

[`AdminApi`](#adminapi)

###### Overrides

```ts
AbstractModuleApi<IMessageRouter>.constructor
```

#### Properties

| Property                                                                       | Modifier    | Type                                                                   | Inherited from                     | Defined in                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`                                                 | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17                                                                                                                                       |
| <a id="_module"></a> `_module`                                                 | `readonly`  | `IMessageRouter`                                                       | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16                                                                                                                                       |
| <a id="_networkconnection"></a> `_networkConnection`                           | `private`   | `INetworkConnection`                                                   | -                                  | [03_Modules/OcppRouter/src/module/DataApi.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L58) |
| <a id="_server"></a> `_server`                                                 | `readonly`  | `FastifyInstance`                                                      | `AbstractModuleApi._server`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:15                                                                                                                                       |
| <a id="_servernetworkprofilerepository"></a> `_serverNetworkProfileRepository` | `private`   | `IServerNetworkProfileRepository`                                      | -                                  | [03_Modules/OcppRouter/src/module/DataApi.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L60) |
| <a id="_subscriptionrepository"></a> `_subscriptionRepository`                 | `private`   | `ISubscriptionRepository`                                              | -                                  | [03_Modules/OcppRouter/src/module/DataApi.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L59) |
| <a id="registerschema"></a> `registerSchema`                                   | `protected` | (`fastifyInstance`, `schema`, `schemaIdPrefix?`) => `object` \| `null` | `AbstractModuleApi.registerSchema` | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:54                                                                                                                                       |

#### Methods

##### \_addDataRoute()

```ts
protected _addDataRoute(
   namespace,
   method,
   httpMethod,
   querySchema?,
   paramSchema?,
   headerSchema?,
   bodySchema?,
   responseSchema?,
   tags?,
   description?,
   security?): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:52

Add a message route to the server.

###### Parameters

| Parameter         | Type                                                        | Description                     |
| ----------------- | ----------------------------------------------------------- | ------------------------------- |
| `namespace`       | `OCPP2_0_1_Namespace` \| `OCPP1_6_Namespace` \| `Namespace` | The entity type.                |
| `method`          | (...`args`) => `any`                                        | The method to be executed.      |
| `httpMethod`      | `HttpMethod`                                                | The HTTP method to be used.     |
| `querySchema?`    | `object`                                                    | The schema for the querystring. |
| `paramSchema?`    | `object`                                                    | The schema for the parameters.  |
| `headerSchema?`   | `object`                                                    | The schema for the headers.     |
| `bodySchema?`     | `object`                                                    | The schema for the body.        |
| `responseSchema?` | `object`                                                    | The schema for the response.    |
| `tags?`           | `string`[]                                                  | The tags for the route.         |
| `description?`    | `string`                                                    | The description for the route.  |
| `security?`       | `object`[]                                                  | The security for the route.     |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi._addDataRoute;
```

##### \_addMessageRoute()

```ts
protected _addMessageRoute(
   action,
   method,
   bodySchema,
   optionalQuerystrings?): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:35

Add a message route to the server.

###### Parameters

| Parameter               | Type                        | Description                          |
| ----------------------- | --------------------------- | ------------------------------------ |
| `action`                | `CallAction`                | The action to be called.             |
| `method`                | (...`args`) => `any`        | The method to be executed.           |
| `bodySchema`            | `object`                    | The schema for the route.            |
| `optionalQuerystrings?` | `Record`\<`string`, `any`\> | Optional querystrings for the route. |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi._addMessageRoute;
```

##### \_init()

```ts
protected _init(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:25

Initializes the API for the given module.

###### Parameters

| Parameter | Type             | Description                           |
| --------- | ---------------- | ------------------------------------- |
| `module`  | `IMessageRouter` | The module to initialize the API for. |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi._init;
```

##### \_toDataPath()

```ts
protected _toDataPath(input): string;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:339](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L339)

Overrides superclass method to generate the URL path based on the input Namespace
and the module's endpoint prefix configuration.

###### Parameters

| Parameter | Type                                                        | Description          |
| --------- | ----------------------------------------------------------- | -------------------- |
| `input`   | `OCPP2_0_1_Namespace` \| `OCPP1_6_Namespace` \| `Namespace` | The input Namespace. |

###### Returns

`string`

- The generated URL path.

###### Overrides

```ts
AbstractModuleApi._toDataPath;
```

##### \_toMessagePath()

```ts
protected _toMessagePath(input, prefix?): string;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:64

Convert a CallAction to a normed lowercase URL path.

###### Parameters

| Parameter | Type         | Description                              |
| --------- | ------------ | ---------------------------------------- |
| `input`   | `CallAction` | The CallAction to convert to a URL path. |
| `prefix?` | `string`     | The module name.                         |

###### Returns

`string`

- String representation of URL path.

###### Inherited from

```ts
AbstractModuleApi._toMessagePath;
```

##### \_validateSystemToken()

```ts
private _validateSystemToken(request): void;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:297](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L297)

Helper to validate internal system calls

###### Parameters

| Parameter | Type             |
| --------- | ---------------- |
| `request` | `FastifyRequest` |

###### Returns

`void`

##### createWebsocketConfiguration()

```ts
createWebsocketConfiguration(request): Promise<{
  allowUnknownChargingStations: boolean;
  dynamicTenantResolution: boolean;
  host: string;
  id: string;
  ignoreAuthenticationHeaders?: boolean;
  maxConnectionsPerTenant?: number;
  mtlsCertificateAuthorityKeyFilePath?: string;
  pingInterval: number;
  port: number;
  protocols: ("ocpp1.6" | "ocpp2.0.1")[];
  rootCACertificateFilePath?: string;
  securityProfile: number;
  tenantId: number;
  tenantPathMapping?: Record<string, number>;
  tlsCertificateChainFilePath?: string;
  tlsKeyFilePath?: string;
}>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:169](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L169)

###### Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: \{ `allowUnknownChargingStations`: `boolean`; `dynamicTenantResolution`: `boolean`; `host`: `string`; `id`: `string`; `ignoreAuthenticationHeaders?`: `boolean`; `maxConnectionsPerTenant?`: `number`; `mtlsCertificateAuthorityKeyFilePath?`: `string`; `pingInterval`: `number`; `port`: `number`; `protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[]; `rootCACertificateFilePath?`: `string`; `securityProfile`: `number`; `tenantId`: `number`; `tenantPathMapping?`: `Record`\<`string`, `number`\>; `tlsCertificateChainFilePath?`: `string`; `tlsKeyFilePath?`: `string`; \}; \}\> |

###### Returns

`Promise`\<\{
`allowUnknownChargingStations`: `boolean`;
`dynamicTenantResolution`: `boolean`;
`host`: `string`;
`id`: `string`;
`ignoreAuthenticationHeaders?`: `boolean`;
`maxConnectionsPerTenant?`: `number`;
`mtlsCertificateAuthorityKeyFilePath?`: `string`;
`pingInterval`: `number`;
`port`: `number`;
`protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[];
`rootCACertificateFilePath?`: `string`;
`securityProfile`: `number`;
`tenantId`: `number`;
`tenantPathMapping?`: `Record`\<`string`, `number`\>;
`tlsCertificateChainFilePath?`: `string`;
`tlsKeyFilePath?`: `string`;
\}\>

##### deleteSubscriptionById()

```ts
deleteSubscriptionById(request): Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:137](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L137)

###### Parameters

| Parameter | Type                                                            |
| --------- | --------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ModelKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`boolean`\>

##### deleteWebsocketConfiguration()

```ts
deleteWebsocketConfiguration(request): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:310](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L310)

###### Parameters

| Parameter | Type                                                                   |
| --------- | ---------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `WebsocketDeleteQuerystring`; \}\> |

###### Returns

`Promise`\<`void`\>

##### deleteWebsocketConnection()

```ts
deleteWebsocketConnection(request): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:326](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L326)

###### Parameters

| Parameter | Type                                                                    |
| --------- | ----------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ConnectionDeleteQuerystring`; \}\> |

###### Returns

`Promise`\<`void`\>

##### deleteWebsocketMapping()

```ts
deleteWebsocketMapping(request): Promise<{
  allowUnknownChargingStations: boolean;
  dynamicTenantResolution: boolean;
  host: string;
  id: string;
  ignoreAuthenticationHeaders?: boolean;
  maxConnectionsPerTenant?: number;
  mtlsCertificateAuthorityKeyFilePath?: string;
  pingInterval: number;
  port: number;
  protocols: ("ocpp1.6" | "ocpp2.0.1")[];
  rootCACertificateFilePath?: string;
  securityProfile: number;
  tenantId: number;
  tenantPathMapping?: Record<string, number>;
  tlsCertificateChainFilePath?: string;
  tlsKeyFilePath?: string;
}>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:244](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L244)

Removes a mapping for a specific path OR all mappings for a specific tenant from a websocket server.

###### Parameters

| Parameter | Type                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `WebsocketMappingQuerystring` & `object`; \}\> |

###### Returns

`Promise`\<\{
`allowUnknownChargingStations`: `boolean`;
`dynamicTenantResolution`: `boolean`;
`host`: `string`;
`id`: `string`;
`ignoreAuthenticationHeaders?`: `boolean`;
`maxConnectionsPerTenant?`: `number`;
`mtlsCertificateAuthorityKeyFilePath?`: `string`;
`pingInterval`: `number`;
`port`: `number`;
`protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[];
`rootCACertificateFilePath?`: `string`;
`securityProfile`: `number`;
`tenantId`: `number`;
`tenantPathMapping?`: `Record`\<`string`, `number`\>;
`tlsCertificateChainFilePath?`: `string`;
`tlsKeyFilePath?`: `string`;
\}\>

##### getSubscriptionsByChargingStation()

```ts
getSubscriptionsByChargingStation(request): Promise<Subscription[]>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L127)

###### Parameters

| Parameter | Type                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ChargingStationKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`Subscription`[]\>

##### getWebsocketConfigurations()

```ts
getWebsocketConfigurations(request): Promise<
  | {
  allowUnknownChargingStations: boolean;
  dynamicTenantResolution: boolean;
  host: string;
  id: string;
  ignoreAuthenticationHeaders?: boolean;
  maxConnectionsPerTenant?: number;
  mtlsCertificateAuthorityKeyFilePath?: string;
  pingInterval: number;
  port: number;
  protocols: ("ocpp1.6" | "ocpp2.0.1")[];
  rootCACertificateFilePath?: string;
  securityProfile: number;
  tenantId: number;
  tenantPathMapping?: Record<string, number>;
  tlsCertificateChainFilePath?: string;
  tlsKeyFilePath?: string;
}
| object[]>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L147)

###### Parameters

| Parameter | Type                                                                |
| --------- | ------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `WebsocketGetQuerystring`; \}\> |

###### Returns

`Promise`\<
\| \{
`allowUnknownChargingStations`: `boolean`;
`dynamicTenantResolution`: `boolean`;
`host`: `string`;
`id`: `string`;
`ignoreAuthenticationHeaders?`: `boolean`;
`maxConnectionsPerTenant?`: `number`;
`mtlsCertificateAuthorityKeyFilePath?`: `string`;
`pingInterval`: `number`;
`port`: `number`;
`protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[];
`rootCACertificateFilePath?`: `string`;
`securityProfile`: `number`;
`tenantId`: `number`;
`tenantPathMapping?`: `Record`\<`string`, `number`\>;
`tlsCertificateChainFilePath?`: `string`;
`tlsKeyFilePath?`: `string`;
\}
\| `object`[]\>

##### postSubscription()

```ts
postSubscription(request): Promise<number>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L106)

Creates a Subscription.
Will always create a new entity and return its id.

###### Parameters

| Parameter | Type                                                                                  | Description                                                                |
| --------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: `Subscription`; `Querystring`: `TenantQueryString`; \}\> | The request object, containing the body which is parsed as a Subscription. |

###### Returns

`Promise`\<`number`\>

The id of the created subscription.

##### putWebsocketMapping()

```ts
putWebsocketMapping(request): Promise<{
  allowUnknownChargingStations: boolean;
  dynamicTenantResolution: boolean;
  host: string;
  id: string;
  ignoreAuthenticationHeaders?: boolean;
  maxConnectionsPerTenant?: number;
  mtlsCertificateAuthorityKeyFilePath?: string;
  pingInterval: number;
  port: number;
  protocols: ("ocpp1.6" | "ocpp2.0.1")[];
  rootCACertificateFilePath?: string;
  securityProfile: number;
  tenantId: number;
  tenantPathMapping?: Record<string, number>;
  tlsCertificateChainFilePath?: string;
  tlsKeyFilePath?: string;
}>;
```

Defined in: [03_Modules/OcppRouter/src/module/DataApi.ts:196](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/DataApi.ts#L196)

Adds or updates a mapping from a path segment to a tenant for a specific websocket server.

###### Parameters

| Parameter | Type                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `request` | `FastifyRequest`\<\{ `Body`: \{ `path`: `string`; `tenantId`: `number`; \}; `Querystring`: `WebsocketMappingQuerystring`; \}\> |

###### Returns

`Promise`\<\{
`allowUnknownChargingStations`: `boolean`;
`dynamicTenantResolution`: `boolean`;
`host`: `string`;
`id`: `string`;
`ignoreAuthenticationHeaders?`: `boolean`;
`maxConnectionsPerTenant?`: `number`;
`mtlsCertificateAuthorityKeyFilePath?`: `string`;
`pingInterval`: `number`;
`port`: `number`;
`protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[];
`rootCACertificateFilePath?`: `string`;
`securityProfile`: `number`;
`tenantId`: `number`;
`tenantPathMapping?`: `Record`\<`string`, `number`\>;
`tlsCertificateChainFilePath?`: `string`;
`tlsKeyFilePath?`: `string`;
\}\>

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type             |
| --------- | ---------------- |
| `module`  | `IMessageRouter` |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Configuration/src/module/DataApi

# 03_Modules/Configuration/src/module/DataApi

## Classes

### ConfigurationDataApi

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L54)

Server API for the Configuration component.

#### Extends

- `AbstractModuleApi`\<[`ConfigurationModule`](module.md#configurationmodule)\>

#### Implements

- [`IConfigurationModuleApi`](interface.md#iconfigurationmoduleapi)

#### Constructors

##### Constructor

```ts
new ConfigurationDataApi(
   ConfigurationComponent,
   server,
   logger?): ConfigurationDataApi;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L65)

Constructor for the class.

###### Parameters

| Parameter                | Type                                                   | Description                  |
| ------------------------ | ------------------------------------------------------ | ---------------------------- |
| `ConfigurationComponent` | [`ConfigurationModule`](module.md#configurationmodule) | The Configuration component. |
| `server`                 | `FastifyInstance`                                      | The server instance.         |
| `logger?`                | `Logger`\<`ILogObj`\>                                  | Optional logger instance.    |

###### Returns

[`ConfigurationDataApi`](#configurationdataapi)

###### Overrides

```ts
AbstractModuleApi<ConfigurationModule>.constructor
```

#### Properties

| Property                                     | Modifier    | Type                                                                   | Inherited from                     | Defined in                                            |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| <a id="_logger"></a> `_logger`               | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17 |
| <a id="_module"></a> `_module`               | `readonly`  | [`ConfigurationModule`](module.md#configurationmodule)                 | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16 |
| <a id="_server"></a> `_server`               | `readonly`  | `FastifyInstance`                                                      | `AbstractModuleApi._server`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:15 |
| <a id="registerschema"></a> `registerSchema` | `protected` | (`fastifyInstance`, `schema`, `schemaIdPrefix?`) => `object` \| `null` | `AbstractModuleApi.registerSchema` | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:54 |

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

| Parameter | Type                                                   | Description                           |
| --------- | ------------------------------------------------------ | ------------------------------------- |
| `module`  | [`ConfigurationModule`](module.md#configurationmodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:202](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L202)

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

##### deleteBootConfig()

```ts
deleteBootConfig(request): Promise<Boot | undefined>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L100)

###### Parameters

| Parameter | Type                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ChargingStationKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`Boot` \| `undefined`\>

##### deleteNetworkProfiles()

```ts
deleteNetworkProfiles(request): Promise<IMessageConfirmation>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:177](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L177)

###### Parameters

| Parameter | Type                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `NetworkProfileDeleteQuerystring`; \}\> |

###### Returns

`Promise`\<`IMessageConfirmation`\>

##### getBootConfig()

```ts
getBootConfig(request): Promise<Boot | undefined>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L93)

###### Parameters

| Parameter | Type                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ChargingStationKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`Boot` \| `undefined`\>

##### getNetworkProfiles()

```ts
getNetworkProfiles(request): Promise<ChargingStationNetworkProfile[]>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:163](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L163)

###### Parameters

| Parameter | Type                                                                  |
| --------- | --------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `NetworkProfileQuerystring`; \}\> |

###### Returns

`Promise`\<`ChargingStationNetworkProfile`[]\>

##### putBootConfig()

```ts
putBootConfig(request): Promise<BootConfig | undefined>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L79)

###### Parameters

| Parameter | Type                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: `BootNotificationResponse`; `Querystring`: `ChargingStationKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`BootConfig` \| `undefined`\>

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                                   |
| --------- | ------------------------------------------------------ |
| `module`  | [`ConfigurationModule`](module.md#configurationmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

##### updatePassword()

```ts
updatePassword(request): Promise<IMessageConfirmation>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L112)

###### Parameters

| Parameter | Type                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `request` | `FastifyRequest`\<\{ `Body`: `UpdateChargingStationPasswordRequest`; `Querystring`: `UpdateChargingStationPasswordQueryString`; \}\> |

###### Returns

`Promise`\<`IMessageConfirmation`\>

##### updatePasswordForStation()

```ts
private updatePasswordForStation(
   password,
   tenantId,
stationId): Promise<VariableAttribute[]>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:256](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L256)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `password`  | `string` |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`VariableAttribute`[]\>

##### updatePasswordOnStation()

```ts
private updatePasswordOnStation(
   password,
   stationId,
   tenantId,
callbackUrl?): Promise<void>;
```

Defined in: [03_Modules/Configuration/src/module/DataApi.ts:207](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/DataApi.ts#L207)

###### Parameters

| Parameter      | Type     |
| -------------- | -------- |
| `password`     | `string` |
| `stationId`    | `string` |
| `tenantId`     | `number` |
| `callbackUrl?` | `string` |

###### Returns

`Promise`\<`void`\>

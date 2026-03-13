[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/EVDriver/src/module/DataApi

# 03_Modules/EVDriver/src/module/DataApi

## Classes

### EVDriverDataApi

Defined in: [03_Modules/EVDriver/src/module/DataApi.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/DataApi.ts#L21)

Interface for the EVDriver module.

#### Extends

- `AbstractModuleApi`\<[`EVDriverModule`](module.md#evdrivermodule)\>

#### Implements

- [`IEVDriverModuleApi`](interface.md#ievdrivermoduleapi)

#### Constructors

##### Constructor

```ts
new EVDriverDataApi(
   evDriverModule,
   server,
   logger?): EVDriverDataApi;
```

Defined in: [03_Modules/EVDriver/src/module/DataApi.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/DataApi.ts#L32)

Constructs a new instance of the class.

###### Parameters

| Parameter        | Type                                         | Description                  |
| ---------------- | -------------------------------------------- | ---------------------------- |
| `evDriverModule` | [`EVDriverModule`](module.md#evdrivermodule) | The EVDriver module.         |
| `server`         | `FastifyInstance`                            | The Fastify server instance. |
| `logger?`        | `Logger`\<`ILogObj`\>                        | The logger for logging.      |

###### Returns

[`EVDriverDataApi`](#evdriverdataapi)

###### Overrides

```ts
AbstractModuleApi<EVDriverModule>.constructor
```

#### Properties

| Property                                     | Modifier    | Type                                                                   | Inherited from                     | Defined in                                            |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| <a id="_logger"></a> `_logger`               | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17 |
| <a id="_module"></a> `_module`               | `readonly`  | [`EVDriverModule`](module.md#evdrivermodule)                           | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16 |
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

| Parameter | Type                                         | Description                           |
| --------- | -------------------------------------------- | ------------------------------------- |
| `module`  | [`EVDriverModule`](module.md#evdrivermodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/EVDriver/src/module/DataApi.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/DataApi.ts#L58)

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

##### getLocalAuthorizationListVersion()

```ts
getLocalAuthorizationListVersion(request): Promise<LocalListVersion | undefined>;
```

Defined in: [03_Modules/EVDriver/src/module/DataApi.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/EVDriver/src/module/DataApi.ts#L41)

###### Parameters

| Parameter | Type                                                                      |
| --------- | ------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Querystring`: `ChargingStationKeyQuerystring`; \}\> |

###### Returns

`Promise`\<`LocalListVersion` \| `undefined`\>

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                         |
| --------- | -------------------------------------------- |
| `module`  | [`EVDriverModule`](module.md#evdrivermodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

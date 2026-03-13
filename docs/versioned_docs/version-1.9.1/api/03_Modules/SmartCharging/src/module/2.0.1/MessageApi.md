[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/SmartCharging/src/module/2.0.1/MessageApi

# 03_Modules/SmartCharging/src/module/2.0.1/MessageApi

## Classes

### SmartChargingOcpp201Api

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L29)

Server API for the SmartCharging module.

#### Extends

- `AbstractModuleApi`\<[`SmartChargingModule`](../module.md#smartchargingmodule)\>

#### Implements

- [`ISmartChargingModuleApi`](../interface.md#ismartchargingmoduleapi)

#### Constructors

##### Constructor

```ts
new SmartChargingOcpp201Api(
   smartChargingModule,
   server,
   logger?): SmartChargingOcpp201Api;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L40)

Constructs a new instance of the class.

###### Parameters

| Parameter             | Type                                                      | Description                  |
| --------------------- | --------------------------------------------------------- | ---------------------------- |
| `smartChargingModule` | [`SmartChargingModule`](../module.md#smartchargingmodule) | The SmartCharging module.    |
| `server`              | `FastifyInstance`                                         | The Fastify server instance. |
| `logger?`             | `Logger`\<`ILogObj`\>                                     | The logger instance.         |

###### Returns

[`SmartChargingOcpp201Api`](#smartchargingocpp201api)

###### Overrides

```ts
AbstractModuleApi<SmartChargingModule>.constructor
```

#### Properties

| Property                                     | Modifier    | Type                                                                   | Inherited from                     | Defined in                                            |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| <a id="_logger"></a> `_logger`               | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17 |
| <a id="_module"></a> `_module`               | `readonly`  | [`SmartChargingModule`](../module.md#smartchargingmodule)              | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16 |
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

##### \_getChargingRateUnitMemberList()

```ts
private _getChargingRateUnitMemberList(tenantId): Promise<Set<string> | undefined>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:619](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L619)

Returns a set of allowed RateUnit values (if defined on the station).

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |

###### Returns

`Promise`\<`Set`\<`string`\> \| `undefined`\>

##### \_init()

```ts
protected _init(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:25

Initializes the API for the given module.

###### Parameters

| Parameter | Type                                                      | Description                           |
| --------- | --------------------------------------------------------- | ------------------------------------- |
| `module`  | [`SmartChargingModule`](../module.md#smartchargingmodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:611](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L611)

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
protected _toMessagePath(input): string;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:599](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L599)

Overrides superclass method to generate the URL path based on the input CallAction
and the module's endpoint prefix configuration.

###### Parameters

| Parameter | Type         | Description           |
| --------- | ------------ | --------------------- |
| `input`   | `CallAction` | The input CallAction. |

###### Returns

`string`

- The generated URL path.

###### Overrides

```ts
AbstractModuleApi._toMessagePath;
```

##### clearChargingProfile()

```ts
clearChargingProfile(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L52)

###### Parameters

| Parameter      | Type                          | Default value       |
| -------------- | ----------------------------- | ------------------- |
| `identifier`   | `string`[]                    | `undefined`         |
| `request`      | `ClearChargingProfileRequest` | `undefined`         |
| `callbackUrl?` | `string`                      | `undefined`         |
| `tenantId?`    | `number`                      | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### clearedChargingLimit()

```ts
clearedChargingLimit(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:521](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L521)

###### Parameters

| Parameter      | Type                          | Default value       |
| -------------- | ----------------------------- | ------------------- |
| `identifier`   | `string`[]                    | `undefined`         |
| `request`      | `ClearedChargingLimitRequest` | `undefined`         |
| `callbackUrl?` | `string`                      | `undefined`         |
| `tenantId?`    | `number`                      | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### getChargingProfiles()

```ts
getChargingProfiles(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L127)

###### Parameters

| Parameter      | Type                         | Default value       |
| -------------- | ---------------------------- | ------------------- |
| `identifier`   | `string`[]                   | `undefined`         |
| `request`      | `GetChargingProfilesRequest` | `undefined`         |
| `callbackUrl?` | `string`                     | `undefined`         |
| `tenantId?`    | `number`                     | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### getCompositeSchedule()

```ts
getCompositeSchedule(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:545](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L545)

###### Parameters

| Parameter      | Type                          | Default value       |
| -------------- | ----------------------------- | ------------------- |
| `identifier`   | `string`[]                    | `undefined`         |
| `request`      | `GetCompositeScheduleRequest` | `undefined`         |
| `callbackUrl?` | `string`                      | `undefined`         |
| `tenantId?`    | `number`                      | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                                      |
| --------- | --------------------------------------------------------- |
| `module`  | [`SmartChargingModule`](../module.md#smartchargingmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

##### setChargingProfile()

```ts
setChargingProfile(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts:203](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/SmartCharging/src/module/2.0.1/MessageApi.ts#L203)

###### Parameters

| Parameter      | Type                        | Default value       |
| -------------- | --------------------------- | ------------------- |
| `identifier`   | `string`[]                  | `undefined`         |
| `request`      | `SetChargingProfileRequest` | `undefined`         |
| `callbackUrl?` | `string`                    | `undefined`         |
| `tenantId?`    | `number`                    | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/Configuration/src/module/1.6/MessageApi

# 03_Modules/Configuration/src/module/1.6/MessageApi

## Classes

### ConfigurationOcpp16Api

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L25)

Server API for the Configuration component.

#### Extends

- `AbstractModuleApi`\<[`ConfigurationModule`](../module.md#configurationmodule)\>

#### Implements

- [`IConfigurationModuleApi`](../interface.md#iconfigurationmoduleapi)

#### Constructors

##### Constructor

```ts
new ConfigurationOcpp16Api(
   ConfigurationComponent,
   server,
   logger?): ConfigurationOcpp16Api;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L36)

Constructor for the class.

###### Parameters

| Parameter                | Type                                                      | Description                  |
| ------------------------ | --------------------------------------------------------- | ---------------------------- |
| `ConfigurationComponent` | [`ConfigurationModule`](../module.md#configurationmodule) | The Configuration component. |
| `server`                 | `FastifyInstance`                                         | The server instance.         |
| `logger?`                | `Logger`\<`ILogObj`\>                                     | Optional logger instance.    |

###### Returns

[`ConfigurationOcpp16Api`](#configurationocpp16api)

###### Overrides

```ts
AbstractModuleApi<ConfigurationModule>.constructor
```

#### Properties

| Property                                     | Modifier    | Type                                                                   | Inherited from                     | Defined in                                            |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| <a id="_logger"></a> `_logger`               | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17 |
| <a id="_module"></a> `_module`               | `readonly`  | [`ConfigurationModule`](../module.md#configurationmodule)              | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16 |
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

| Parameter | Type                                                      | Description                           |
| --------- | --------------------------------------------------------- | ------------------------------------- |
| `module`  | [`ConfigurationModule`](../module.md#configurationmodule) | The module to initialize the API for. |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi._init;
```

##### \_toDataPath()

```ts
protected _toDataPath(input, prefix?): string;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:72

Convert a namespace to a normed lowercase URL path.

###### Parameters

| Parameter | Type                                                        | Description                                                                         |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `input`   | `OCPP2_0_1_Namespace` \| `OCPP1_6_Namespace` \| `Namespace` | The OCPP2_0_1_Namespace or OCPP1_6_Namespace or Namespace to convert to a URL path. |
| `prefix?` | `string`                                                    | The module name.                                                                    |

###### Returns

`string`

- String representation of URL path.

###### Inherited from

```ts
AbstractModuleApi._toDataPath;
```

##### \_toMessagePath()

```ts
protected _toMessagePath(input): string;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:287](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L287)

Overrides superclass method to generate the URL path based on the input CallAction and the module's endpoint prefix configuration.

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

##### changeAvailability()

```ts
changeAvailability(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:222](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L222)

###### Parameters

| Parameter      | Type                        | Default value       |
| -------------- | --------------------------- | ------------------- |
| `identifier`   | `string`[]                  | `undefined`         |
| `request`      | `ChangeAvailabilityRequest` | `undefined`         |
| `callbackUrl?` | `string`                    | `undefined`         |
| `tenantId?`    | `number`                    | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### changeConfiguration()

```ts
changeConfiguration(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L75)

###### Parameters

| Parameter      | Type                         | Default value       |
| -------------- | ---------------------------- | ------------------- |
| `identifier`   | `string`[]                   | `undefined`         |
| `request`      | `ChangeConfigurationRequest` | `undefined`         |
| `callbackUrl?` | `string`                     | `undefined`         |
| `tenantId?`    | `number`                     | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### dataTransfer()

```ts
dataTransfer(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:262](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L262)

###### Parameters

| Parameter      | Type                  | Default value       |
| -------------- | --------------------- | ------------------- |
| `identifier`   | `string`[]            | `undefined`         |
| `request`      | `DataTransferRequest` | `undefined`         |
| `callbackUrl?` | `string`              | `undefined`         |
| `tenantId?`    | `number`              | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### getConfiguration()

```ts
getConfiguration(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L108)

###### Parameters

| Parameter      | Type                      | Default value       |
| -------------- | ------------------------- | ------------------- |
| `identifier`   | `string`[]                | `undefined`         |
| `request`      | `GetConfigurationRequest` | `undefined`         |
| `callbackUrl?` | `string`                  | `undefined`         |
| `tenantId?`    | `number`                  | `DEFAULT_TENANT_ID` |

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
| `module`  | [`ConfigurationModule`](../module.md#configurationmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

##### reset()

```ts
reset(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:202](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L202)

###### Parameters

| Parameter      | Type           | Default value       |
| -------------- | -------------- | ------------------- |
| `identifier`   | `string`[]     | `undefined`         |
| `request`      | `ResetRequest` | `undefined`         |
| `callbackUrl?` | `string`       | `undefined`         |
| `tenantId?`    | `number`       | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### triggerMessage()

```ts
triggerMessage(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L45)

###### Parameters

| Parameter      | Type                    | Default value       |
| -------------- | ----------------------- | ------------------- |
| `identifier`   | `string`[]              | `undefined`         |
| `request`      | `TriggerMessageRequest` | `undefined`         |
| `callbackUrl?` | `string`                | `undefined`         |
| `tenantId?`    | `number`                | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### updateFirmware()

```ts
updateFirmware(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Configuration/src/module/1.6/MessageApi.ts:242](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Configuration/src/module/1.6/MessageApi.ts#L242)

###### Parameters

| Parameter      | Type                    | Default value       |
| -------------- | ----------------------- | ------------------- |
| `identifier`   | `string`[]              | `undefined`         |
| `request`      | `UpdateFirmwareRequest` | `undefined`         |
| `callbackUrl?` | `string`                | `undefined`         |
| `tenantId?`    | `number`                | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

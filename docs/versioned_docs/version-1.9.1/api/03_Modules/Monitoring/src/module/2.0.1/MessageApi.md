[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/Monitoring/src/module/2.0.1/MessageApi

# 03_Modules/Monitoring/src/module/2.0.1/MessageApi

## Classes

### MonitoringOcpp201Api

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L24)

Server API for the Monitoring module.

#### Extends

- `AbstractModuleApi`\<[`MonitoringModule`](../module.md#monitoringmodule)\>

#### Implements

- [`IMonitoringModuleApi`](../interface.md#imonitoringmoduleapi)

#### Constructors

##### Constructor

```ts
new MonitoringOcpp201Api(
   monitoringModule,
   server,
   logger?): MonitoringOcpp201Api;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L38)

Constructor for the class.

###### Parameters

| Parameter          | Type                                                | Description            |
| ------------------ | --------------------------------------------------- | ---------------------- |
| `monitoringModule` | [`MonitoringModule`](../module.md#monitoringmodule) | The monitoring module. |
| `server`           | `FastifyInstance`                                   | The server instance.   |
| `logger?`          | `Logger`\<`ILogObj`\>                               | The logger instance.   |

###### Returns

[`MonitoringOcpp201Api`](#monitoringocpp201api)

###### Overrides

```ts
AbstractModuleApi<MonitoringModule>.constructor
```

#### Properties

| Property                                                           | Modifier    | Type                                                                   | Default value       | Inherited from                     | Defined in                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------- | ------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_componentdevicedatactrlr"></a> `_componentDeviceDataCtrlr` | `private`   | `"DeviceDataCtrlr"`                                                    | `'DeviceDataCtrlr'` | -                                  | [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L29) |
| <a id="_componentmonitoringctrlr"></a> `_componentMonitoringCtrlr` | `private`   | `"MonitoringCtrlr"`                                                    | `'MonitoringCtrlr'` | -                                  | [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L28) |
| <a id="_logger"></a> `_logger`                                     | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `undefined`         | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17                                                                                                                                                         |
| <a id="_module"></a> `_module`                                     | `readonly`  | [`MonitoringModule`](../module.md#monitoringmodule)                    | `undefined`         | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16                                                                                                                                                         |
| <a id="_server"></a> `_server`                                     | `readonly`  | `FastifyInstance`                                                      | `undefined`         | `AbstractModuleApi._server`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:15                                                                                                                                                         |
| <a id="registerschema"></a> `registerSchema`                       | `protected` | (`fastifyInstance`, `schema`, `schemaIdPrefix?`) => `object` \| `null` | `undefined`         | `AbstractModuleApi.registerSchema` | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:54                                                                                                                                                         |

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

| Parameter | Type                                                | Description                           |
| --------- | --------------------------------------------------- | ------------------------------------- |
| `module`  | [`MonitoringModule`](../module.md#monitoringmodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:426](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L426)

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

##### clearVariableMonitoring()

```ts
clearVariableMonitoring(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L144)

###### Parameters

| Parameter      | Type                             | Default value       |
| -------------- | -------------------------------- | ------------------- |
| `identifier`   | `string`[]                       | `undefined`         |
| `request`      | `ClearVariableMonitoringRequest` | `undefined`         |
| `callbackUrl?` | `string`                         | `undefined`         |
| `tenantId?`    | `number`                         | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### getVariables()

```ts
getVariables(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:305](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L305)

###### Parameters

| Parameter      | Type                  | Default value       |
| -------------- | --------------------- | ------------------- |
| `identifier`   | `string`[]            | `undefined`         |
| `request`      | `GetVariablesRequest` | `undefined`         |
| `callbackUrl?` | `string`              | `undefined`         |
| `tenantId?`    | `number`              | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### processBatches()

```ts
private processBatches(
   stationId,
   tenantId,
   version,
   action,
   requestData,
   dataKey,
   itemsPerMessage,
callbackUrl?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:378](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L378)

Processes data in batches and sends them to the specified OCPP action.

###### Parameters

| Parameter         | Type                        | Description                                                       |
| ----------------- | --------------------------- | ----------------------------------------------------------------- |
| `stationId`       | `string`                    | The station's identifier.                                         |
| `tenantId`        | `number`                    | The tenant identifier.                                            |
| `version`         | `OCPPVersion`               | The OCPP version to use.                                          |
| `action`          | `OCPP2_0_1_CallAction`      | The OCPP 2.0.1 action to call.                                    |
| `requestData`     | `Record`\<`string`, `any`\> | The request object containing the data array to batch.            |
| `dataKey`         | `string`                    | The key in `requestData` that contains the array to batch.        |
| `itemsPerMessage` | `number`                    | The maximum number of items to include in a single batch message. |
| `callbackUrl?`    | `string`                    | An optional callback URL.                                         |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

- Array of message confirmations for each batch.

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                                |
| --------- | --------------------------------------------------- |
| `module`  | [`MonitoringModule`](../module.md#monitoringmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

##### setMonitoringBase()

```ts
setMonitoringBase(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:232](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L232)

###### Parameters

| Parameter      | Type                       | Default value       |
| -------------- | -------------------------- | ------------------- |
| `identifier`   | `string`[]                 | `undefined`         |
| `request`      | `SetMonitoringBaseRequest` | `undefined`         |
| `callbackUrl?` | `string`                   | `undefined`         |
| `tenantId?`    | `number`                   | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### setMonitoringLevel()

```ts
setMonitoringLevel(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:209](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L209)

###### Parameters

| Parameter      | Type                        | Default value       |
| -------------- | --------------------------- | ------------------- |
| `identifier`   | `string`[]                  | `undefined`         |
| `request`      | `SetMonitoringLevelRequest` | `undefined`         |
| `callbackUrl?` | `string`                    | `undefined`         |
| `tenantId?`    | `number`                    | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### setVariableMonitoring()

```ts
setVariableMonitoring(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L50)

###### Parameters

| Parameter      | Type                           | Default value       |
| -------------- | ------------------------------ | ------------------- |
| `identifier`   | `string`[]                     | `undefined`         |
| `request`      | `SetVariableMonitoringRequest` | `undefined`         |
| `callbackUrl?` | `string`                       | `undefined`         |
| `tenantId?`    | `number`                       | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### setVariables()

```ts
setVariables(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts:252](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Monitoring/src/module/2.0.1/MessageApi.ts#L252)

###### Parameters

| Parameter      | Type                  | Default value       |
| -------------- | --------------------- | ------------------- |
| `identifier`   | `string`[]            | `undefined`         |
| `request`      | `SetVariablesRequest` | `undefined`         |
| `callbackUrl?` | `string`              | `undefined`         |
| `tenantId?`    | `number`              | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

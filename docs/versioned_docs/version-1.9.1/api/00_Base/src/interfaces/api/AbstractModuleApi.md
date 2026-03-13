[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/AbstractModuleApi

# 00_Base/src/interfaces/api/AbstractModuleApi

## Classes

### `abstract` AbstractModuleApi

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L32)

Abstract module api class implementation.

#### Type Parameters

| Type Parameter                                          |
| ------------------------------------------------------- |
| `T` _extends_ [`IModule`](../modules/Module.md#imodule) |

#### Implements

- [`IModuleApi`](ModuleApi.md#imoduleapi)

#### Constructors

##### Constructor

```ts
new AbstractModuleApi<T>(
   module,
   server,
   ocppVersion,
logger?): AbstractModuleApi<T>;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L38)

###### Parameters

| Parameter     | Type                                                             |
| ------------- | ---------------------------------------------------------------- |
| `module`      | `T`                                                              |
| `server`      | `FastifyInstance`                                                |
| `ocppVersion` | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion) \| `null` |
| `logger?`     | `Logger`\<`ILogObj`\>                                            |

###### Returns

[`AbstractModuleApi`](#abstract-abstractmoduleapi)\<`T`\>

#### Properties

| Property                                 | Modifier   | Type                                                             | Defined in                                                                                                                                                                                          |
| ---------------------------------------- | ---------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`           | `readonly` | `Logger`\<`ILogObj`\>                                            | [00_Base/src/interfaces/api/AbstractModuleApi.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L35) |
| <a id="_module"></a> `_module`           | `readonly` | `T`                                                              | [00_Base/src/interfaces/api/AbstractModuleApi.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L34) |
| <a id="_ocppversion"></a> `_ocppVersion` | `private`  | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion) \| `null` | [00_Base/src/interfaces/api/AbstractModuleApi.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L36) |
| <a id="_server"></a> `_server`           | `readonly` | `FastifyInstance`                                                | [00_Base/src/interfaces/api/AbstractModuleApi.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L33) |

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

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:195](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L195)

Add a message route to the server.

###### Parameters

| Parameter         | Type                                                                                                                                                                                                                                | Description                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `namespace`       | \| [`OCPP2_0_1_Namespace`](../../ocpp/persistence/namespace.md#ocpp2_0_1_namespace) \| [`OCPP1_6_Namespace`](../../ocpp/persistence/namespace.md#ocpp1_6_namespace) \| [`Namespace`](../../ocpp/persistence/namespace.md#namespace) | The entity type.                |
| `method`          | (...`args`) => `any`                                                                                                                                                                                                                | The method to be executed.      |
| `httpMethod`      | [`HttpMethod`](../api.md#httpmethod)                                                                                                                                                                                                | The HTTP method to be used.     |
| `querySchema?`    | `object`                                                                                                                                                                                                                            | The schema for the querystring. |
| `paramSchema?`    | `object`                                                                                                                                                                                                                            | The schema for the parameters.  |
| `headerSchema?`   | `object`                                                                                                                                                                                                                            | The schema for the headers.     |
| `bodySchema?`     | `object`                                                                                                                                                                                                                            | The schema for the body.        |
| `responseSchema?` | `object`                                                                                                                                                                                                                            | The schema for the response.    |
| `tags?`           | `string`[]                                                                                                                                                                                                                          | The tags for the route.         |
| `description?`    | `string`                                                                                                                                                                                                                            | The description for the route.  |
| `security?`       | `object`[]                                                                                                                                                                                                                          | The security for the route.     |

###### Returns

`void`

##### \_addMessageRoute()

```ts
protected _addMessageRoute(
   action,
   method,
   bodySchema,
   optionalQuerystrings?): void;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L110)

Add a message route to the server.

###### Parameters

| Parameter               | Type                                                 | Description                          |
| ----------------------- | ---------------------------------------------------- | ------------------------------------ |
| `action`                | [`CallAction`](../../ocpp/rpc/message.md#callaction) | The action to be called.             |
| `method`                | (...`args`) => `any`                                 | The method to be executed.           |
| `bodySchema`            | `object`                                             | The schema for the route.            |
| `optionalQuerystrings?` | `Record`\<`string`, `any`\>                          | Optional querystrings for the route. |

###### Returns

`void`

##### \_init()

```ts
protected _init(module): void;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L59)

Initializes the API for the given module.

###### Parameters

| Parameter | Type | Description                           |
| --------- | ---- | ------------------------------------- |
| `module`  | `T`  | The module to initialize the API for. |

###### Returns

`void`

##### \_toDataPath()

```ts
protected _toDataPath(input, prefix?): string;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:475](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L475)

Convert a namespace to a normed lowercase URL path.

###### Parameters

| Parameter | Type                                                                                                                                                                                                                                | Description                                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`   | \| [`OCPP2_0_1_Namespace`](../../ocpp/persistence/namespace.md#ocpp2_0_1_namespace) \| [`OCPP1_6_Namespace`](../../ocpp/persistence/namespace.md#ocpp1_6_namespace) \| [`Namespace`](../../ocpp/persistence/namespace.md#namespace) | The [OCPP2_0_1_Namespace](../../ocpp/persistence/namespace.md#ocpp2_0_1_namespace) or [OCPP1_6_Namespace](../../ocpp/persistence/namespace.md#ocpp1_6_namespace) or [Namespace](../../ocpp/persistence/namespace.md#namespace) to convert to a URL path. |
| `prefix?` | `string`                                                                                                                                                                                                                            | The module name.                                                                                                                                                                                                                                         |

###### Returns

`string`

- String representation of URL path.

##### \_toMessagePath()

```ts
protected _toMessagePath(input, prefix?): string;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:459](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L459)

Convert a [CallAction](../../ocpp/rpc/message.md#callaction) to a normed lowercase URL path.

###### Parameters

| Parameter | Type                                                 | Description                                                                      |
| --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `input`   | [`CallAction`](../../ocpp/rpc/message.md#callaction) | The [CallAction](../../ocpp/rpc/message.md#callaction) to convert to a URL path. |
| `prefix?` | `string`                                             | The module name.                                                                 |

###### Returns

`string`

- String representation of URL path.

##### registerSchema()

```ts
protected registerSchema(
   fastifyInstance,
   schema,
   schemaIdPrefix?): object | null;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:322](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L322)

###### Parameters

| Parameter         | Type              |
| ----------------- | ----------------- |
| `fastifyInstance` | `FastifyInstance` |
| `schema`          | `any`             |
| `schemaIdPrefix?` | `string`          |

###### Returns

`object` \| `null`

##### registerSchemaForOpts()

```ts
private registerSchemaForOpts(fastifyInstance, _opts): void;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:295](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L295)

###### Parameters

| Parameter         | Type              |
| ----------------- | ----------------- |
| `fastifyInstance` | `FastifyInstance` |
| `_opts`           | `any`             |

###### Returns

`void`

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:384](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L384)

###### Parameters

| Parameter | Type |
| --------- | ---- |
| `module`  | `T`  |

###### Returns

`void`

##### removeUnknownKeys()

```ts
private removeUnknownKeys(schema): any;
```

Defined in: [00_Base/src/interfaces/api/AbstractModuleApi.ts:414](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AbstractModuleApi.ts#L414)

###### Parameters

| Parameter | Type  |
| --------- | ----- |
| `schema`  | `any` |

###### Returns

`any`

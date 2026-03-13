[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 03_Modules/Certificates/src/module/2.0.1/MessageApi

# 03_Modules/Certificates/src/module/2.0.1/MessageApi

## Classes

### CertificatesOcpp201Api

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L23)

Server API for the Certificates module.

#### Extends

- `AbstractModuleApi`\<[`CertificatesModule`](../module.md#certificatesmodule)\>

#### Implements

- [`ICertificatesModuleApi`](../interface.md#icertificatesmoduleapi)

#### Constructors

##### Constructor

```ts
new CertificatesOcpp201Api(
   certificatesModule,
   server,
   logger?): CertificatesOcpp201Api;
```

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L34)

Constructs a new instance of the class.

###### Parameters

| Parameter            | Type                                                    | Description                  |
| -------------------- | ------------------------------------------------------- | ---------------------------- |
| `certificatesModule` | [`CertificatesModule`](../module.md#certificatesmodule) | The Certificates module.     |
| `server`             | `FastifyInstance`                                       | The Fastify server instance. |
| `logger?`            | `Logger`\<`ILogObj`\>                                   | The logger instance.         |

###### Returns

[`CertificatesOcpp201Api`](#certificatesocpp201api)

###### Overrides

```ts
AbstractModuleApi<CertificatesModule>.constructor
```

#### Properties

| Property                                     | Modifier    | Type                                                                   | Inherited from                                                                                | Defined in                                            |
| -------------------------------------------- | ----------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| <a id="_logger"></a> `_logger`               | `readonly`  | `Logger`\<`ILogObj`\>                                                  | [`CertificatesDataApi`](../DataApi.md#certificatesdataapi).[`_logger`](../DataApi.md#_logger) | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17 |
| <a id="_module"></a> `_module`               | `readonly`  | [`CertificatesModule`](../module.md#certificatesmodule)                | `AbstractModuleApi._module`                                                                   | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16 |
| <a id="_server"></a> `_server`               | `readonly`  | `FastifyInstance`                                                      | `AbstractModuleApi._server`                                                                   | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:15 |
| <a id="registerschema"></a> `registerSchema` | `protected` | (`fastifyInstance`, `schema`, `schemaIdPrefix?`) => `object` \| `null` | `AbstractModuleApi.registerSchema`                                                            | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:54 |

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

| Parameter | Type                                                    | Description                           |
| --------- | ------------------------------------------------------- | ------------------------------------- |
| `module`  | [`CertificatesModule`](../module.md#certificatesmodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:172](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L172)

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

##### certificateSigned()

```ts
certificateSigned(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L50)

Interface implementation

###### Parameters

| Parameter      | Type                       | Default value       |
| -------------- | -------------------------- | ------------------- |
| `identifier`   | `string`[]                 | `undefined`         |
| `request`      | `CertificateSignedRequest` | `undefined`         |
| `callbackUrl?` | `string`                   | `undefined`         |
| `tenantId?`    | `number`                   | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### deleteCertificate()

```ts
deleteCertificate(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:125](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L125)

###### Parameters

| Parameter      | Type                       | Default value       |
| -------------- | -------------------------- | ------------------- |
| `identifier`   | `string`[]                 | `undefined`         |
| `request`      | `DeleteCertificateRequest` | `undefined`         |
| `callbackUrl?` | `string`                   | `undefined`         |
| `tenantId?`    | `number`                   | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### getInstalledCertificateIds()

```ts
getInstalledCertificateIds(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L102)

###### Parameters

| Parameter      | Type                                | Default value       |
| -------------- | ----------------------------------- | ------------------- |
| `identifier`   | `string`[]                          | `undefined`         |
| `request`      | `GetInstalledCertificateIdsRequest` | `undefined`         |
| `callbackUrl?` | `string`                            | `undefined`         |
| `tenantId?`    | `number`                            | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### installCertificate()

```ts
installCertificate(
   identifier,
   request,
   callbackUrl?,
tenantId?): Promise<IMessageConfirmation[]>;
```

Defined in: [03_Modules/Certificates/src/module/2.0.1/MessageApi.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/2.0.1/MessageApi.ts#L73)

###### Parameters

| Parameter      | Type                        | Default value       |
| -------------- | --------------------------- | ------------------- |
| `identifier`   | `string`[]                  | `undefined`         |
| `request`      | `InstallCertificateRequest` | `undefined`         |
| `callbackUrl?` | `string`                    | `undefined`         |
| `tenantId?`    | `number`                    | `DEFAULT_TENANT_ID` |

###### Returns

`Promise`\<`IMessageConfirmation`[]\>

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                                    |
| --------- | ------------------------------------------------------- |
| `module`  | [`CertificatesModule`](../module.md#certificatesmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

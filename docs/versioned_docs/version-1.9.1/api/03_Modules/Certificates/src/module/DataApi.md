[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/Certificates/src/module/DataApi

# 03_Modules/Certificates/src/module/DataApi

## Classes

### CertificatesDataApi

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L54)

Server API for the Certificates module.

#### Extends

- `AbstractModuleApi`\<[`CertificatesModule`](module.md#certificatesmodule)\>

#### Implements

- [`ICertificatesModuleApi`](interface.md#icertificatesmoduleapi)

#### Constructors

##### Constructor

```ts
new CertificatesDataApi(
   certificatesModule,
   server,
   fileStorage,
   websocketServersConfig,
   logger?): CertificatesDataApi;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L70)

Constructs a new instance of the class.

###### Parameters

| Parameter                | Type                                                 | Description                         |
| ------------------------ | ---------------------------------------------------- | ----------------------------------- |
| `certificatesModule`     | [`CertificatesModule`](module.md#certificatesmodule) | The Certificates module.            |
| `server`                 | `FastifyInstance`                                    | The Fastify server instance.        |
| `fileStorage`            | `IFileStorage`                                       | The fileStorage                     |
| `websocketServersConfig` | `object`[]                                           | Configuration for websocket servers |
| `logger?`                | `Logger`\<`ILogObj`\>                                | The logger instance.                |

###### Returns

[`CertificatesDataApi`](#certificatesdataapi)

###### Overrides

```ts
AbstractModuleApi<CertificatesModule>.constructor
```

#### Properties

| Property                                                       | Modifier    | Type                                                                   | Inherited from                     | Defined in                                                                                                                                                                                      |
| -------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_filestorage"></a> `_fileStorage`                       | `private`   | `IFileStorage`                                                         | -                                  | [03_Modules/Certificates/src/module/DataApi.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L59) |
| <a id="_logger"></a> `_logger`                                 | `readonly`  | `Logger`\<`ILogObj`\>                                                  | `AbstractModuleApi._logger`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:17                                                                                                                                           |
| <a id="_module"></a> `_module`                                 | `readonly`  | [`CertificatesModule`](module.md#certificatesmodule)                   | `AbstractModuleApi._module`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:16                                                                                                                                           |
| <a id="_server"></a> `_server`                                 | `readonly`  | `FastifyInstance`                                                      | `AbstractModuleApi._server`        | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:15                                                                                                                                           |
| <a id="_websocketserversconfig"></a> `_websocketServersConfig` | `private`   | `object`[]                                                             | -                                  | [03_Modules/Certificates/src/module/DataApi.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L58) |
| <a id="registerschema"></a> `registerSchema`                   | `protected` | (`fastifyInstance`, `schema`, `schemaIdPrefix?`) => `object` \| `null` | `AbstractModuleApi.registerSchema` | 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:54                                                                                                                                           |

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

| Parameter | Type                                                 | Description                           |
| --------- | ---------------------------------------------------- | ------------------------------------- |
| `module`  | [`CertificatesModule`](module.md#certificatesmodule) | The module to initialize the API for. |

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

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:500](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L500)

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

##### generateCertificateChain()

```ts
generateCertificateChain(request): Promise<Certificate[]>;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L147)

This endpoint is used to create certificate chain, root CA, sub CA and leaf certificate

###### Parameters

| Parameter | Type                                                                                                     | Description                     |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: `GenerateCertificateChainRequest`; `Querystring`: `TenantQueryString`; \}\> | GenerateRootCertificatesRequest |

###### Returns

`Promise`\<`Certificate`[]\>

Promise<Certificate[]> - An array of generated certificates

##### installRootCertificate()

```ts
installRootCertificate(request): Promise<IMessageConfirmation>;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:310](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L310)

###### Parameters

| Parameter | Type                                                               |
| --------- | ------------------------------------------------------------------ |
| `request` | `FastifyRequest`\<\{ `Body`: `InstallRootCertificateRequest`; \}\> |

###### Returns

`Promise`\<`IMessageConfirmation`\>

##### putTlsCertificates()

```ts
putTlsCertificates(request): Promise<void>;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L91)

Data Endpoint Methods

###### Parameters

| Parameter | Type                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: `TlsCertificatesRequest`; `Querystring`: `UpdateTlsCertificateQueryString`; \}\> |

###### Returns

`Promise`\<`void`\>

##### regenerateExistingCertificate()

```ts
regenerateExistingCertificate(request): Promise<InstalledCertificate>;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:413](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L413)

Endpoint to regenerate an existing certificate that is already installed on a given station.
Updates the InstalledCertificate record with the new certificate.

###### Parameters

| Parameter | Type                                                                                                     | Description                          |
| --------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `request` | `FastifyRequest`\<\{ `Body`: `RegenerateExistingCertificate`; `Querystring`: `IMessageQuerystring`; \}\> | RegenerateInstalledCertificateSchema |

###### Returns

`Promise`\<`InstalledCertificate`\>

Promise<InstalledCertificate> - the updated installed certificate record

##### registerSystemConfigRoutes()

```ts
protected registerSystemConfigRoutes(module): void;
```

Defined in: 00_Base/dist/interfaces/api/AbstractModuleApi.d.ts:55

###### Parameters

| Parameter | Type                                                 |
| --------- | ---------------------------------------------------- |
| `module`  | [`CertificatesModule`](module.md#certificatesmodule) |

###### Returns

`void`

###### Inherited from

```ts
AbstractModuleApi.registerSystemConfigRoutes;
```

##### uploadExistingCertificate()

```ts
uploadExistingCertificate(request): Promise<InstalledCertificate[]>;
```

Defined in: [03_Modules/Certificates/src/module/DataApi.ts:364](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/Certificates/src/module/DataApi.ts#L364)

Endpoint to upload an existing certificate that is already installed on a given station to the CSMS

###### Parameters

| Parameter | Type                                                                                                 | Description                     |
| --------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| `request` | `FastifyRequest`\<\{ `Body`: `UploadExistingCertificate`; `Querystring`: `IMessageQuerystring`; \}\> | UploadExistingCertificateSchema |

###### Returns

`Promise`\<`InstalledCertificate`[]\>

Promise<InstalledCertificate> - the installed certificate record

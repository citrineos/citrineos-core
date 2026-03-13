[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus

# 01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus

## Classes

### AsyncJobRequest

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L127)

#### Constructors

##### Constructor

```ts
new AsyncJobRequest(): AsyncJobRequest;
```

###### Returns

[`AsyncJobRequest`](#asyncjobrequest)

#### Properties

| Property                                       | Type                                    | Defined in                                                                                                                                                                                                                        |
| ---------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="paginatedparams"></a> `paginatedParams` | [`PaginatedParams`](#paginatedparams-2) | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L129) |
| <a id="tenantpartnerid"></a> `tenantPartnerId` | `number`                                | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:128](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L128) |

---

### AsyncJobStatus

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L31)

#### Extends

- `Model`

#### Constructors

##### Constructor

```ts
new AsyncJobStatus(...args): AsyncJobStatus;
```

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L89)

###### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

###### Returns

[`AsyncJobStatus`](#asyncjobstatus)

###### Overrides

```ts
Model.constructor;
```

#### Properties

| Property                                         | Modifier   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value      | Defined in                                                                                                                                                                                                                      |
| ------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="finishedat"></a> `finishedAt?`            | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L50) |
| <a id="isfailed"></a> `isFailed`                 | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L61) |
| <a id="jobid"></a> `jobId`                       | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L37) |
| <a id="jobname"></a> `jobName`                   | `public`   | `"FETCH_OCPI_TOKENS"`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L40) |
| <a id="paginationparams"></a> `paginationParams` | `public`   | [`PaginatedParams`](#paginatedparams-2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L64) |
| <a id="stoppedat"></a> `stoppedAt?`              | `public`   | `Date` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L53) |
| <a id="stopscheduled"></a> `stopScheduled`       | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L57) |
| <a id="tenant"></a> `tenant?`                    | `public`   | `object`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L79) |
| `tenant.countryCode?`                            | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:6                                                                                                                                                                                   |
| `tenant.createdAt?`                              | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:43                                                                                                                                                                                  |
| `tenant.id?`                                     | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:3                                                                                                                                                                                   |
| `tenant.isUserTenant`                            | `public`   | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:41                                                                                                                                                                                  |
| `tenant.name`                                    | `public`   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:4                                                                                                                                                                                   |
| `tenant.partyId?`                                | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:7                                                                                                                                                                                   |
| `tenant.serverProfileOCPI?`                      | `public`   | \| \{ `credentialsRole`: \{ `businessDetails`: \{ `logo?`: \{ `category`: `string`; `height?`: `number`; `type`: `string`; `url`: `string`; `width?`: `number`; \}; `name`: `string`; `website?`: `string`; \}; `role`: `"CPO"` \| `"EMSP"` \| `"HUB"` \| `"NAP"` \| `"NSP"` \| `"SCSP"`; \}; `versionDetails`: `object`[]; `versionEndpoints`: `z.ZodRecord`\<`z.ZodString`, `z.ZodArray`\<`z.ZodObject`\<\{ `identifier`: `z.ZodString`; `url`: `z.ZodString`; \}, `z.core.$strip`\>\>\>; \} \| `null` | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:8                                                                                                                                                                                   |
| `tenant.updatedAt?`                              | `public`   | `Date`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:42                                                                                                                                                                                  |
| `tenant.url?`                                    | `public`   | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `undefined`        | 00_Base/dist/interfaces/dto/tenant.dto.d.ts:5                                                                                                                                                                                   |
| <a id="tenantid"></a> `tenantId`                 | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L76) |
| <a id="tenantpartner"></a> `tenantPartner`       | `public`   | [`TenantPartner`](../TenantPartner.md#tenantpartner)                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L47) |
| <a id="tenantpartnerid-1"></a> `tenantPartnerId` | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L44) |
| <a id="totalobjects"></a> `totalObjects?`        | `public`   | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `undefined`        | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L67) |
| <a id="model_name"></a> `MODEL_NAME`             | `readonly` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `'AsyncJobStatus'` | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L32) |

#### Methods

##### toDTO()

```ts
toDTO(): AsyncJobStatusDTO;
```

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L96)

###### Returns

[`AsyncJobStatusDTO`](#asyncjobstatusdto)

##### setDefaultTenant()

```ts
static setDefaultTenant(instance): void;
```

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L83)

###### Parameters

| Parameter  | Type                                |
| ---------- | ----------------------------------- |
| `instance` | [`AsyncJobStatus`](#asyncjobstatus) |

###### Returns

`void`

---

### AsyncJobStatusDTO

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:113](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L113)

#### Constructors

##### Constructor

```ts
new AsyncJobStatusDTO(): AsyncJobStatusDTO;
```

###### Returns

[`AsyncJobStatusDTO`](#asyncjobstatusdto)

#### Properties

| Property                                         | Type                                                 | Defined in                                                                                                                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="createdat"></a> `createdAt`               | `Date`                                               | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L118) |
| <a id="finishedat-1"></a> `finishedAt?`          | `Date`                                               | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L119) |
| <a id="isfailed-1"></a> `isFailed?`              | `boolean`                                            | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L122) |
| <a id="jobid-1"></a> `jobId`                     | `string`                                             | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L114) |
| <a id="jobname-1"></a> `jobName`                 | `"FETCH_OCPI_TOKENS"`                                | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L115) |
| <a id="paginatedparams-1"></a> `paginatedParams` | [`PaginatedParams`](#paginatedparams-2)              | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L123) |
| <a id="stoppedat-1"></a> `stoppedAt?`            | `Date` \| `null`                                     | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L120) |
| <a id="stopscheduled-1"></a> `stopScheduled`     | `boolean`                                            | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L121) |
| <a id="tenantpartner-1"></a> `tenantPartner?`    | [`TenantPartner`](../TenantPartner.md#tenantpartner) | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L117) |
| <a id="tenantpartnerid-2"></a> `tenantPartnerId` | `number`                                             | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:116](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L116) |
| <a id="totalobjects-1"></a> `totalObjects?`      | `number`                                             | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:124](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L124) |

## Interfaces

### PaginatedParams

Defined in: [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L23)

#### Properties

| Property                          | Type     | Defined in                                                                                                                                                                                                                      |
| --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="datefrom"></a> `dateFrom?` | `Date`   | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L26) |
| <a id="dateto"></a> `dateTo?`     | `Date`   | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L27) |
| <a id="limit"></a> `limit?`       | `number` | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L25) |
| <a id="offset"></a> `offset?`     | `number` | [01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/layers/sequelize/model/AsyncJob/AsyncJobStatus.ts#L24) |

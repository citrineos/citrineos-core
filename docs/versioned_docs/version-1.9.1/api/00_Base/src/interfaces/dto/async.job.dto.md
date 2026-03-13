[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/async.job.dto

# 00_Base/src/interfaces/dto/async.job.dto

## Type Aliases

### AsyncJobCreate

```ts
type AsyncJobCreate = z.infer<typeof AsyncJobCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L44)

---

### AsyncJobDto

```ts
type AsyncJobDto = z.infer<typeof AsyncJobSchema>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L34)

---

### AsyncJobRequest

```ts
type AsyncJobRequest = z.infer<typeof AsyncJobRequestSchema>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L51)

---

### PaginatedParams

```ts
type PaginatedParams = z.infer<typeof PaginatedParamsSchema>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L17)

## Variables

### AsyncJobCreateSchema

```ts
const AsyncJobCreateSchema: ZodObject<
  {
    finishedAt: ZodOptional<ZodDate>;
    isFailed: ZodDefault<ZodBoolean>;
    jobName: ZodEnum<{
      FETCH_OCPI_TOKENS: 'FETCH_OCPI_TOKENS';
    }>;
    paginatedParams: ZodObject<
      {
        dateFrom: ZodOptional<ZodDate>;
        dateTo: ZodOptional<ZodDate>;
        limit: ZodOptional<ZodNumber>;
        offset: ZodOptional<ZodNumber>;
      },
      $strip
    >;
    stoppedAt: ZodOptional<ZodNullable<ZodDate>>;
    stopScheduled: ZodDefault<ZodBoolean>;
    tenantId: ZodOptional<ZodNumber>;
    tenantPartnerId: ZodNumber;
    totalObjects: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L36)

---

### AsyncJobProps

```ts
const AsyncJobProps: object;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L32)

#### Type Declaration

| Name                                                    | Type                | Defined in |
| ------------------------------------------------------- | ------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`             | `"createdAt"`       |            |
| <a id="property-finishedat"></a> `finishedAt`           | `"finishedAt"`      |            |
| <a id="property-isfailed"></a> `isFailed`               | `"isFailed"`        |            |
| <a id="property-jobid"></a> `jobId`                     | `"jobId"`           |            |
| <a id="property-jobname"></a> `jobName`                 | `"jobName"`         |            |
| <a id="property-paginatedparams"></a> `paginatedParams` | `"paginatedParams"` |            |
| <a id="property-stoppedat"></a> `stoppedAt`             | `"stoppedAt"`       |            |
| <a id="property-stopscheduled"></a> `stopScheduled`     | `"stopScheduled"`   |            |
| <a id="property-tenant"></a> `tenant`                   | `"tenant"`          |            |
| <a id="property-tenantid"></a> `tenantId`               | `"tenantId"`        |            |
| <a id="property-tenantpartner"></a> `tenantPartner`     | `"tenantPartner"`   |            |
| <a id="property-tenantpartnerid"></a> `tenantPartnerId` | `"tenantPartnerId"` |            |
| <a id="property-totalobjects"></a> `totalObjects`       | `"totalObjects"`    |            |
| <a id="property-updatedat"></a> `updatedAt`             | `"updatedAt"`       |            |

---

### AsyncJobRequestSchema

```ts
const AsyncJobRequestSchema: ZodObject<
  {
    paginatedParams: ZodObject<
      {
        dateFrom: ZodOptional<ZodDate>;
        dateTo: ZodOptional<ZodDate>;
        limit: ZodOptional<ZodNumber>;
        offset: ZodOptional<ZodNumber>;
      },
      $strip
    >;
    tenantPartnerId: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L46)

---

### AsyncJobSchema

```ts
const AsyncJobSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  finishedAt: ZodOptional<ZodDate>;
  isFailed: ZodDefault<ZodBoolean>;
  jobId: ZodString;
  jobName: ZodEnum<{
     FETCH_OCPI_TOKENS: "FETCH_OCPI_TOKENS";
  }>;
  paginatedParams: ZodObject<{
     dateFrom: ZodOptional<ZodDate>;
     dateTo: ZodOptional<ZodDate>;
     limit: ZodOptional<ZodNumber>;
     offset: ZodOptional<ZodNumber>;
  }, $strip>;
  stoppedAt: ZodOptional<ZodNullable<ZodDate>>;
  stopScheduled: ZodDefault<ZodBoolean>;
  tenant: ZodOptional<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     isUserTenant: ZodDefault<ZodBoolean>;
     name: ZodString;
     partyId: ZodOptional<ZodNullable<ZodString>>;
     serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
        credentialsRole: ZodObject<{
           businessDetails: ...;
           role: ...;
        }, $strip>;
        versionDetails: ZodArray<ZodObject<..., ...>>;
        versionEndpoints: ZodRecord<ZodString, ZodArray<...>>;
     }, $strip>>>;
     updatedAt: ZodOptional<ZodDate>;
     url: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>>;
  tenantId: ZodOptional<ZodNumber>;
  tenantPartner: ZodOptional<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     partnerProfileOCPI: ZodObject<{
        credentials: ZodOptional<ZodObject<{
           certificateRef: ZodOptional<...>;
           token: ZodOptional<...>;
           versionsUrl: ZodString;
        }, $strip>>;
        endpoints: ZodOptional<ZodArray<ZodObject<{
           identifier: ...;
           url: ...;
        }, $strip>>>;
        roles: ZodOptional<ZodArray<ZodObject<{
           businessDetails: ...;
           role: ...;
        }, $strip>>>;
        serverCredentials: ZodObject<{
           certificateRef: ZodOptional<ZodString>;
           token: ZodOptional<ZodString>;
           versionsUrl: ZodString;
        }, $strip>;
        version: ZodObject<{
           version: ZodEnum<{
              2.2.1: ...;
           }>;
           versionDetailsUrl: ZodOptional<ZodString>;
        }, $strip>;
     }, $strip>;
     partyId: ZodOptional<ZodNullable<ZodString>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<..., ...>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>;
  tenantPartnerId: ZodNumber;
  totalObjects: ZodOptional<ZodNumber>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L19)

---

### asyncJobSchemas

```ts
const asyncJobSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L53)

#### Type Declaration

| Name                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Default value           | Defined in                                                                                                                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-asyncjob"></a> `AsyncJob`               | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `finishedAt`: `ZodOptional`\<`ZodDate`\>; `isFailed`: `ZodDefault`\<`ZodBoolean`\>; `jobId`: `ZodString`; `jobName`: `ZodEnum`\<\{ `FETCH_OCPI_TOKENS`: `"FETCH_OCPI_TOKENS"`; \}\>; `paginatedParams`: `ZodObject`\<\{ `dateFrom`: `ZodOptional`\<`ZodDate`\>; `dateTo`: `ZodOptional`\<`ZodDate`\>; `limit`: `ZodOptional`\<`ZodNumber`\>; `offset`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>; `stoppedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `stopScheduled`: `ZodDefault`\<`ZodBoolean`\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartner`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `partnerProfileOCPI`: `ZodObject`\<\{ `credentials`: `ZodOptional`\<`ZodObject`\<\{ `certificateRef`: ...; `token`: ...; `versionsUrl`: ...; \}, `$strip`\>\>; `endpoints`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<..., ...\>\>\>; `roles`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<..., ...\>\>\>; `serverCredentials`: `ZodObject`\<\{ `certificateRef`: `ZodOptional`\<...\>; `token`: `ZodOptional`\<...\>; `versionsUrl`: `ZodString`; \}, `$strip`\>; `version`: `ZodObject`\<\{ `version`: `ZodEnum`\<...\>; `versionDetailsUrl`: `ZodOptional`\<...\>; \}, `$strip`\>; \}, `$strip`\>; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<...\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<...\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<...\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<...\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `tenantPartnerId`: `ZodNumber`; `totalObjects`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `AsyncJobSchema`        | [00_Base/src/interfaces/dto/async.job.dto.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L54) |
| <a id="property-asyncjobcreate"></a> `AsyncJobCreate`   | `ZodObject`\<\{ `finishedAt`: `ZodOptional`\<`ZodDate`\>; `isFailed`: `ZodDefault`\<`ZodBoolean`\>; `jobName`: `ZodEnum`\<\{ `FETCH_OCPI_TOKENS`: `"FETCH_OCPI_TOKENS"`; \}\>; `paginatedParams`: `ZodObject`\<\{ `dateFrom`: `ZodOptional`\<`ZodDate`\>; `dateTo`: `ZodOptional`\<`ZodDate`\>; `limit`: `ZodOptional`\<`ZodNumber`\>; `offset`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>; `stoppedAt`: `ZodOptional`\<`ZodNullable`\<`ZodDate`\>\>; `stopScheduled`: `ZodDefault`\<`ZodBoolean`\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartnerId`: `ZodNumber`; `totalObjects`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `AsyncJobCreateSchema`  | [00_Base/src/interfaces/dto/async.job.dto.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L55) |
| <a id="property-asyncjobrequest"></a> `AsyncJobRequest` | `ZodObject`\<\{ `paginatedParams`: `ZodObject`\<\{ `dateFrom`: `ZodOptional`\<`ZodDate`\>; `dateTo`: `ZodOptional`\<`ZodDate`\>; `limit`: `ZodOptional`\<`ZodNumber`\>; `offset`: `ZodOptional`\<`ZodNumber`\>; \}, `$strip`\>; `tenantPartnerId`: `ZodNumber`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `AsyncJobRequestSchema` | [00_Base/src/interfaces/dto/async.job.dto.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L56) |

---

### PaginatedParamsSchema

```ts
const PaginatedParamsSchema: ZodObject<
  {
    dateFrom: ZodOptional<ZodDate>;
    dateTo: ZodOptional<ZodDate>;
    limit: ZodOptional<ZodNumber>;
    offset: ZodOptional<ZodNumber>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/async.job.dto.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/async.job.dto.ts#L10)

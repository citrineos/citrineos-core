[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/stop.transaction.dto

# 00_Base/src/interfaces/dto/stop.transaction.dto

## Type Aliases

### StopTransactionCreate

```ts
type StopTransactionCreate = z.infer<typeof StopTransactionCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L34)

---

### StopTransactionDto

```ts
type StopTransactionDto = z.infer<typeof StopTransactionSchema>;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L23)

## Variables

### StopTransactionCreateSchema

```ts
const StopTransactionCreateSchema: ZodObject<
  {
    idTokenType: ZodOptional<ZodString>;
    idTokenValue: ZodOptional<ZodString>;
    meterStop: ZodNumber;
    reason: ZodOptional<ZodString>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodISODateTime;
    transactionDatabaseId: ZodNumber;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L25)

---

### StopTransactionProps

```ts
const StopTransactionProps: object;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L21)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-idtokentype"></a> `idTokenType`                     | `"idTokenType"`           |            |
| <a id="property-idtokenvalue"></a> `idTokenValue`                   | `"idTokenValue"`          |            |
| <a id="property-meterstop"></a> `meterStop`                         | `"meterStop"`             |            |
| <a id="property-metervalues"></a> `meterValues`                     | `"meterValues"`           |            |
| <a id="property-reason"></a> `reason`                               | `"reason"`                |            |
| <a id="property-stationid"></a> `stationId`                         | `"stationId"`             |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-transactiondatabaseid"></a> `transactionDatabaseId` | `"transactionDatabaseId"` |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |

---

### StopTransactionSchema

```ts
const StopTransactionSchema: ZodObject<{
  createdAt: ZodOptional<ZodDate>;
  id: ZodOptional<ZodNumber>;
  idTokenType: ZodOptional<ZodString>;
  idTokenValue: ZodOptional<ZodString>;
  meterStop: ZodNumber;
  meterValues: ZodOptional<ZodArray<ZodObject<{
     connectorId: ZodOptional<ZodNumber>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     sampledValue: ZodTuple<[ZodObject<{
        context: ZodOptional<...>;
        location: ZodOptional<...>;
        measurand: ZodOptional<...>;
        phase: ZodOptional<...>;
        signedMeterValue: ZodOptional<...>;
        unitOfMeasure: ZodOptional<...>;
        value: ZodNumber;
      }, $strip>], ZodObject<{
        context: ZodOptional<ZodNullable<...>>;
        location: ZodOptional<ZodNullable<...>>;
        measurand: ZodOptional<ZodNullable<...>>;
        phase: ZodOptional<ZodNullable<...>>;
        signedMeterValue: ZodOptional<ZodNullable<...>>;
        unitOfMeasure: ZodOptional<ZodNullable<...>>;
        value: ZodNumber;
     }, $strip>>;
     tariffId: ZodOptional<ZodNullable<ZodNumber>>;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<...>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<...>>;
        serverProfileOCPI: ZodOptional<ZodNullable<...>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<...>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     timestamp: ZodISODateTime;
     transactionDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionEventId: ZodOptional<ZodNullable<ZodNumber>>;
     transactionId: ZodOptional<ZodNullable<ZodString>>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  reason: ZodOptional<ZodString>;
  stationId: ZodString;
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
  timestamp: ZodISODateTime;
  transactionDatabaseId: ZodNumber;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L9)

---

### stopTransactionSchemas

```ts
const stopTransactionSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/stop.transaction.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L36)

#### Type Declaration

| Name                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Default value                 | Defined in                                                                                                                                                                                                |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-stoptransaction"></a> `StopTransaction`             | `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idTokenType`: `ZodOptional`\<`ZodString`\>; `idTokenValue`: `ZodOptional`\<`ZodString`\>; `meterStop`: `ZodNumber`; `meterValues`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `sampledValue`: `ZodTuple`\<\[`ZodObject`\<\{ `context`: ...; `location`: ...; `measurand`: ...; `phase`: ...; `signedMeterValue`: ...; `unitOfMeasure`: ...; `value`: ...; \}, `$strip`\>\], `ZodObject`\<\{ `context`: `ZodOptional`\<...\>; `location`: `ZodOptional`\<...\>; `measurand`: `ZodOptional`\<...\>; `phase`: `ZodOptional`\<...\>; `signedMeterValue`: `ZodOptional`\<...\>; `unitOfMeasure`: `ZodOptional`\<...\>; `value`: `ZodNumber`; \}, `$strip`\>\>; `tariffId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionEventId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `reason`: `ZodOptional`\<`ZodString`\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `StopTransactionSchema`       | [00_Base/src/interfaces/dto/stop.transaction.dto.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L37) |
| <a id="property-stoptransactioncreate"></a> `StopTransactionCreate` | `ZodObject`\<\{ `idTokenType`: `ZodOptional`\<`ZodString`\>; `idTokenValue`: `ZodOptional`\<`ZodString`\>; `meterStop`: `ZodNumber`; `reason`: `ZodOptional`\<`ZodString`\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionDatabaseId`: `ZodNumber`; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `StopTransactionCreateSchema` | [00_Base/src/interfaces/dto/stop.transaction.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/stop.transaction.dto.ts#L38) |

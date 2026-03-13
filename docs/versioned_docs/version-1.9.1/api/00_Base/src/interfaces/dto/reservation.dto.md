[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/reservation.dto

# 00_Base/src/interfaces/dto/reservation.dto

## Type Aliases

### ReservationCreate

```ts
type ReservationCreate = z.infer<typeof ReservationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L36)

---

### ReservationDto

```ts
type ReservationDto = z.infer<typeof ReservationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L26)

## Variables

### ReservationCreateSchema

```ts
const ReservationCreateSchema: ZodObject<
  {
    connectorType: ZodOptional<ZodNullable<ZodString>>;
    evseId: ZodOptional<ZodNullable<ZodNumber>>;
    expiryDateTime: ZodISODateTime;
    groupIdToken: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
    id: ZodNumber;
    idToken: ZodRecord<ZodString, ZodAny>;
    isActive: ZodDefault<ZodBoolean>;
    reserveStatus: ZodOptional<ZodNullable<ZodString>>;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    terminatedByTransaction: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L28)

---

### ReservationProps

```ts
const ReservationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L24)

#### Type Declaration

| Name                                                                    | Type                        | Defined in |
| ----------------------------------------------------------------------- | --------------------------- | ---------- |
| <a id="property-connectortype"></a> `connectorType`                     | `"connectorType"`           |            |
| <a id="property-createdat"></a> `createdAt`                             | `"createdAt"`               |            |
| <a id="property-databaseid"></a> `databaseId`                           | `"databaseId"`              |            |
| <a id="property-evse"></a> `evse`                                       | `"evse"`                    |            |
| <a id="property-evseid"></a> `evseId`                                   | `"evseId"`                  |            |
| <a id="property-expirydatetime"></a> `expiryDateTime`                   | `"expiryDateTime"`          |            |
| <a id="property-groupidtoken"></a> `groupIdToken`                       | `"groupIdToken"`            |            |
| <a id="property-id"></a> `id`                                           | `"id"`                      |            |
| <a id="property-idtoken"></a> `idToken`                                 | `"idToken"`                 |            |
| <a id="property-isactive"></a> `isActive`                               | `"isActive"`                |            |
| <a id="property-reservestatus"></a> `reserveStatus`                     | `"reserveStatus"`           |            |
| <a id="property-stationid"></a> `stationId`                             | `"stationId"`               |            |
| <a id="property-tenant"></a> `tenant`                                   | `"tenant"`                  |            |
| <a id="property-tenantid"></a> `tenantId`                               | `"tenantId"`                |            |
| <a id="property-terminatedbytransaction"></a> `terminatedByTransaction` | `"terminatedByTransaction"` |            |
| <a id="property-updatedat"></a> `updatedAt`                             | `"updatedAt"`               |            |

---

### ReservationSchema

```ts
const ReservationSchema: ZodObject<{
  connectorType: ZodOptional<ZodNullable<ZodString>>;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodNumber;
  evse: ZodOptional<ZodNullable<ZodObject<{
     connectorId: ZodOptional<ZodNullable<ZodNumber>>;
     createdAt: ZodOptional<ZodDate>;
     databaseId: ZodOptional<ZodNumber>;
     id: ZodNumber;
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
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  evseId: ZodOptional<ZodNullable<ZodNumber>>;
  expiryDateTime: ZodISODateTime;
  groupIdToken: ZodOptional<ZodNullable<ZodRecord<ZodString, ZodAny>>>;
  id: ZodNumber;
  idToken: ZodRecord<ZodString, ZodAny>;
  isActive: ZodDefault<ZodBoolean>;
  reserveStatus: ZodOptional<ZodNullable<ZodString>>;
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
  terminatedByTransaction: ZodOptional<ZodNullable<ZodString>>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L9)

---

### reservationSchemas

```ts
const reservationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/reservation.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L38)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Default value             | Defined in                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-reservation"></a> `Reservation`             | `ZodObject`\<\{ `connectorType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `evse`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `expiryDateTime`: `ZodISODateTime`; `groupIdToken`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `id`: `ZodNumber`; `idToken`: `ZodRecord`\<`ZodString`, `ZodAny`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `reserveStatus`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `terminatedByTransaction`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `ReservationSchema`       | [00_Base/src/interfaces/dto/reservation.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L39) |
| <a id="property-reservationcreate"></a> `ReservationCreate` | `ZodObject`\<\{ `connectorType`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `expiryDateTime`: `ZodISODateTime`; `groupIdToken`: `ZodOptional`\<`ZodNullable`\<`ZodRecord`\<`ZodString`, `ZodAny`\>\>\>; `id`: `ZodNumber`; `idToken`: `ZodRecord`\<`ZodString`, `ZodAny`\>; `isActive`: `ZodDefault`\<`ZodBoolean`\>; `reserveStatus`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `terminatedByTransaction`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `ReservationCreateSchema` | [00_Base/src/interfaces/dto/reservation.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/reservation.dto.ts#L40) |

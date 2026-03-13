[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/message.info.dto

# 00_Base/src/interfaces/dto/message.info.dto

## Type Aliases

### MessageInfoCreate

```ts
type MessageInfoCreate = z.infer<typeof MessageInfoCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L39)

---

### MessageInfoDto

```ts
type MessageInfoDto = z.infer<typeof MessageInfoSchema>;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L29)

## Variables

### MessageInfoCreateSchema

```ts
const MessageInfoCreateSchema: ZodObject<
  {
    active: ZodBoolean;
    displayComponentId: ZodOptional<ZodNullable<ZodNumber>>;
    endDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
    id: ZodNumber;
    message: ZodObject<
      {
        content: ZodString;
        customData: ZodOptional<ZodNullable<ZodAny>>;
        format: ZodEnum<{
          ASCII: 'ASCII';
          HTML: 'HTML';
          URI: 'URI';
          UTF8: 'UTF8';
        }>;
        language: ZodOptional<ZodNullable<ZodString>>;
      },
      $strip
    >;
    priority: ZodEnum<{
      AlwaysFront: 'AlwaysFront';
      InFront: 'InFront';
      NormalCycle: 'NormalCycle';
    }>;
    startDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
    state: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Charging: 'Charging';
          Faulted: 'Faulted';
          Idle: 'Idle';
          Unavailable: 'Unavailable';
        }>
      >
    >;
    stationId: ZodString;
    tenantId: ZodOptional<ZodNumber>;
    transactionId: ZodOptional<ZodNullable<ZodString>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L31)

---

### MessageInfoProps

```ts
const MessageInfoProps: object;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L27)

#### Type Declaration

| Name                                                          | Type                   | Defined in |
| ------------------------------------------------------------- | ---------------------- | ---------- |
| <a id="property-active"></a> `active`                         | `"active"`             |            |
| <a id="property-createdat"></a> `createdAt`                   | `"createdAt"`          |            |
| <a id="property-databaseid"></a> `databaseId`                 | `"databaseId"`         |            |
| <a id="property-display"></a> `display`                       | `"display"`            |            |
| <a id="property-displaycomponentid"></a> `displayComponentId` | `"displayComponentId"` |            |
| <a id="property-enddatetime"></a> `endDateTime`               | `"endDateTime"`        |            |
| <a id="property-id"></a> `id`                                 | `"id"`                 |            |
| <a id="property-message"></a> `message`                       | `"message"`            |            |
| <a id="property-priority"></a> `priority`                     | `"priority"`           |            |
| <a id="property-startdatetime"></a> `startDateTime`           | `"startDateTime"`      |            |
| <a id="property-state"></a> `state`                           | `"state"`              |            |
| <a id="property-stationid"></a> `stationId`                   | `"stationId"`          |            |
| <a id="property-tenant"></a> `tenant`                         | `"tenant"`             |            |
| <a id="property-tenantid"></a> `tenantId`                     | `"tenantId"`           |            |
| <a id="property-transactionid"></a> `transactionId`           | `"transactionId"`      |            |
| <a id="property-updatedat"></a> `updatedAt`                   | `"updatedAt"`          |            |

---

### MessageInfoSchema

```ts
const MessageInfoSchema: ZodObject<{
  active: ZodBoolean;
  createdAt: ZodOptional<ZodDate>;
  databaseId: ZodNumber;
  display: ZodObject<{
     createdAt: ZodOptional<ZodDate>;
     evse: ZodOptional<ZodObject<{
        connectorId: ZodOptional<ZodNullable<ZodNumber>>;
        createdAt: ZodOptional<ZodDate>;
        databaseId: ZodOptional<ZodNumber>;
        id: ZodNumber;
        tenant: ZodOptional<ZodObject<{
           countryCode: ZodOptional<...>;
           createdAt: ZodOptional<...>;
           id: ZodOptional<...>;
           isUserTenant: ZodDefault<...>;
           name: ZodString;
           partyId: ZodOptional<...>;
           serverProfileOCPI: ZodOptional<...>;
           updatedAt: ZodOptional<...>;
           url: ZodOptional<...>;
        }, $strip>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>;
     evseDatabaseId: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodOptional<ZodNumber>;
     instance: ZodOptional<ZodNullable<ZodString>>;
     name: ZodString;
     tenant: ZodOptional<ZodObject<{
        countryCode: ZodOptional<ZodNullable<ZodString>>;
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        isUserTenant: ZodDefault<ZodBoolean>;
        name: ZodString;
        partyId: ZodOptional<ZodNullable<ZodString>>;
        serverProfileOCPI: ZodOptional<ZodNullable<ZodObject<{
           credentialsRole: ...;
           versionDetails: ...;
           versionEndpoints: ...;
        }, $strip>>>;
        updatedAt: ZodOptional<ZodDate>;
        url: ZodOptional<ZodNullable<ZodString>>;
     }, $strip>>;
     tenantId: ZodOptional<ZodNumber>;
     updatedAt: ZodOptional<ZodDate>;
     variables: ZodOptional<ZodArray<ZodObject<{
        createdAt: ZodOptional<ZodDate>;
        id: ZodOptional<ZodNumber>;
        instance: ZodOptional<ZodNullable<ZodString>>;
        name: ZodString;
        tenant: ZodOptional<ZodObject<{
           countryCode: ...;
           createdAt: ...;
           id: ...;
           isUserTenant: ...;
           name: ...;
           partyId: ...;
           serverProfileOCPI: ...;
           updatedAt: ...;
           url: ...;
        }, $strip>>;
        tenantId: ZodOptional<ZodNumber>;
        updatedAt: ZodOptional<ZodDate>;
     }, $strip>>>;
  }, $strip>;
  displayComponentId: ZodOptional<ZodNullable<ZodNumber>>;
  endDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  id: ZodNumber;
  message: ZodObject<{
     content: ZodString;
     customData: ZodOptional<ZodNullable<ZodAny>>;
     format: ZodEnum<{
        ASCII: "ASCII";
        HTML: "HTML";
        URI: "URI";
        UTF8: "UTF8";
     }>;
     language: ZodOptional<ZodNullable<ZodString>>;
  }, $strip>;
  priority: ZodEnum<{
     AlwaysFront: "AlwaysFront";
     InFront: "InFront";
     NormalCycle: "NormalCycle";
  }>;
  startDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  state: ZodOptional<ZodNullable<ZodEnum<{
     Charging: "Charging";
     Faulted: "Faulted";
     Idle: "Idle";
     Unavailable: "Unavailable";
  }>>>;
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
  transactionId: ZodOptional<ZodNullable<ZodString>>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L12)

---

### messageInfoSchemas

```ts
const messageInfoSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/message.info.dto.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L41)

#### Type Declaration

| Name                                                        | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Default value             | Defined in                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-messageinfo"></a> `MessageInfo`             | `ZodObject`\<\{ `active`: `ZodBoolean`; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodNumber`; `display`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; \}, `$strip`\>; `displayComponentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `endDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `id`: `ZodNumber`; `message`: `ZodObject`\<\{ `content`: `ZodString`; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `format`: `ZodEnum`\<\{ `ASCII`: `"ASCII"`; `HTML`: `"HTML"`; `URI`: `"URI"`; `UTF8`: `"UTF8"`; \}\>; `language`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>; `priority`: `ZodEnum`\<\{ `AlwaysFront`: `"AlwaysFront"`; `InFront`: `"InFront"`; `NormalCycle`: `"NormalCycle"`; \}\>; `startDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `state`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Idle`: `"Idle"`; `Unavailable`: `"Unavailable"`; \}\>\>\>; `stationId`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `MessageInfoSchema`       | [00_Base/src/interfaces/dto/message.info.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L42) |
| <a id="property-messageinfocreate"></a> `MessageInfoCreate` | `ZodObject`\<\{ `active`: `ZodBoolean`; `displayComponentId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `endDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `id`: `ZodNumber`; `message`: `ZodObject`\<\{ `content`: `ZodString`; `customData`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `format`: `ZodEnum`\<\{ `ASCII`: `"ASCII"`; `HTML`: `"HTML"`; `URI`: `"URI"`; `UTF8`: `"UTF8"`; \}\>; `language`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>; `priority`: `ZodEnum`\<\{ `AlwaysFront`: `"AlwaysFront"`; `InFront`: `"InFront"`; `NormalCycle`: `"NormalCycle"`; \}\>; `startDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `state`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Charging`: `"Charging"`; `Faulted`: `"Faulted"`; `Idle`: `"Idle"`; `Unavailable`: `"Unavailable"`; \}\>\>\>; `stationId`: `ZodString`; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `MessageInfoCreateSchema` | [00_Base/src/interfaces/dto/message.info.dto.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/message.info.dto.ts#L43) |

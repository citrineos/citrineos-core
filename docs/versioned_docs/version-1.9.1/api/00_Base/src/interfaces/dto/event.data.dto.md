[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/event.data.dto

# 00_Base/src/interfaces/dto/event.data.dto

## Type Aliases

### EventDataCreate

```ts
type EventDataCreate = z.infer<typeof EventDataCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L44)

---

### EventDataDto

```ts
type EventDataDto = z.infer<typeof EventDataSchema>;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L33)

## Variables

### EventDataCreateSchema

```ts
const EventDataCreateSchema: ZodObject<
  {
    actualValue: ZodString;
    cause: ZodOptional<ZodNullable<ZodNumber>>;
    cleared: ZodOptional<ZodNullable<ZodBoolean>>;
    componentId: ZodOptional<ZodNumber>;
    eventId: ZodNumber;
    eventNotificationType: ZodEnum<{
      CustomMonitor: 'CustomMonitor';
      HardWiredMonitor: 'HardWiredMonitor';
      HardWiredNotification: 'HardWiredNotification';
      PreconfiguredMonitor: 'PreconfiguredMonitor';
    }>;
    stationId: ZodString;
    techCode: ZodOptional<ZodNullable<ZodString>>;
    techInfo: ZodOptional<ZodNullable<ZodString>>;
    tenantId: ZodOptional<ZodNumber>;
    timestamp: ZodISODateTime;
    transactionId: ZodOptional<ZodNullable<ZodString>>;
    trigger: ZodEnum<{
      Alerting: 'Alerting';
      Delta: 'Delta';
      Periodic: 'Periodic';
    }>;
    variableId: ZodOptional<ZodNumber>;
    variableMonitoringId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L35)

---

### EventDataProps

```ts
const EventDataProps: object;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L31)

#### Type Declaration

| Name                                                                | Type                      | Defined in |
| ------------------------------------------------------------------- | ------------------------- | ---------- |
| <a id="property-actualvalue"></a> `actualValue`                     | `"actualValue"`           |            |
| <a id="property-cause"></a> `cause`                                 | `"cause"`                 |            |
| <a id="property-cleared"></a> `cleared`                             | `"cleared"`               |            |
| <a id="property-component"></a> `component`                         | `"component"`             |            |
| <a id="property-componentid"></a> `componentId`                     | `"componentId"`           |            |
| <a id="property-createdat"></a> `createdAt`                         | `"createdAt"`             |            |
| <a id="property-eventid"></a> `eventId`                             | `"eventId"`               |            |
| <a id="property-eventnotificationtype"></a> `eventNotificationType` | `"eventNotificationType"` |            |
| <a id="property-id"></a> `id`                                       | `"id"`                    |            |
| <a id="property-stationid"></a> `stationId`                         | `"stationId"`             |            |
| <a id="property-techcode"></a> `techCode`                           | `"techCode"`              |            |
| <a id="property-techinfo"></a> `techInfo`                           | `"techInfo"`              |            |
| <a id="property-tenant"></a> `tenant`                               | `"tenant"`                |            |
| <a id="property-tenantid"></a> `tenantId`                           | `"tenantId"`              |            |
| <a id="property-timestamp"></a> `timestamp`                         | `"timestamp"`             |            |
| <a id="property-transactionid"></a> `transactionId`                 | `"transactionId"`         |            |
| <a id="property-trigger"></a> `trigger`                             | `"trigger"`               |            |
| <a id="property-updatedat"></a> `updatedAt`                         | `"updatedAt"`             |            |
| <a id="property-variable"></a> `variable`                           | `"variable"`              |            |
| <a id="property-variableid"></a> `variableId`                       | `"variableId"`            |            |
| <a id="property-variablemonitoringid"></a> `variableMonitoringId`   | `"variableMonitoringId"`  |            |

---

### EventDataSchema

```ts
const EventDataSchema: ZodObject<{
  actualValue: ZodString;
  cause: ZodOptional<ZodNullable<ZodNumber>>;
  cleared: ZodOptional<ZodNullable<ZodBoolean>>;
  component: ZodObject<{
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
  componentId: ZodOptional<ZodNumber>;
  createdAt: ZodOptional<ZodDate>;
  eventId: ZodNumber;
  eventNotificationType: ZodEnum<{
     CustomMonitor: "CustomMonitor";
     HardWiredMonitor: "HardWiredMonitor";
     HardWiredNotification: "HardWiredNotification";
     PreconfiguredMonitor: "PreconfiguredMonitor";
  }>;
  id: ZodOptional<ZodNumber>;
  stationId: ZodString;
  techCode: ZodOptional<ZodNullable<ZodString>>;
  techInfo: ZodOptional<ZodNullable<ZodString>>;
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
  transactionId: ZodOptional<ZodNullable<ZodString>>;
  trigger: ZodEnum<{
     Alerting: "Alerting";
     Delta: "Delta";
     Periodic: "Periodic";
  }>;
  updatedAt: ZodOptional<ZodDate>;
  variable: ZodObject<{
     createdAt: ZodOptional<ZodDate>;
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
  }, $strip>;
  variableId: ZodOptional<ZodNumber>;
  variableMonitoringId: ZodOptional<ZodNullable<ZodNumber>>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L11)

---

### eventDataSchemas

```ts
const eventDataSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/event.data.dto.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L46)

#### Type Declaration

| Name                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default value           | Defined in                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-eventdata"></a> `EventData`             | `ZodObject`\<\{ `actualValue`: `ZodString`; `cause`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `cleared`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `component`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `evse`: `ZodOptional`\<`ZodObject`\<\{ `connectorId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `databaseId`: `ZodOptional`\<`ZodNumber`\>; `id`: `ZodNumber`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `isUserTenant`: ...; `name`: ...; `partyId`: ...; `serverProfileOCPI`: ...; `updatedAt`: ...; `url`: ...; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>; `evseDatabaseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variables`: `ZodOptional`\<`ZodArray`\<`ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<...\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; \}, `$strip`\>; `componentId`: `ZodOptional`\<`ZodNumber`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `eventId`: `ZodNumber`; `eventNotificationType`: `ZodEnum`\<\{ `CustomMonitor`: `"CustomMonitor"`; `HardWiredMonitor`: `"HardWiredMonitor"`; `HardWiredNotification`: `"HardWiredNotification"`; `PreconfiguredMonitor`: `"PreconfiguredMonitor"`; \}\>; `id`: `ZodOptional`\<`ZodNumber`\>; `stationId`: `ZodString`; `techCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `techInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `trigger`: `ZodEnum`\<\{ `Alerting`: `"Alerting"`; `Delta`: `"Delta"`; `Periodic`: `"Periodic"`; \}\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `variable`: `ZodObject`\<\{ `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `instance`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `name`: `ZodString`; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<..., ...\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>; `variableId`: `ZodOptional`\<`ZodNumber`\>; `variableMonitoringId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\> | `EventDataSchema`       | [00_Base/src/interfaces/dto/event.data.dto.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L47) |
| <a id="property-eventdatacreate"></a> `EventDataCreate` | `ZodObject`\<\{ `actualValue`: `ZodString`; `cause`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `cleared`: `ZodOptional`\<`ZodNullable`\<`ZodBoolean`\>\>; `componentId`: `ZodOptional`\<`ZodNumber`\>; `eventId`: `ZodNumber`; `eventNotificationType`: `ZodEnum`\<\{ `CustomMonitor`: `"CustomMonitor"`; `HardWiredMonitor`: `"HardWiredMonitor"`; `HardWiredNotification`: `"HardWiredNotification"`; `PreconfiguredMonitor`: `"PreconfiguredMonitor"`; \}\>; `stationId`: `ZodString`; `techCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `techInfo`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `timestamp`: `ZodISODateTime`; `transactionId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `trigger`: `ZodEnum`\<\{ `Alerting`: `"Alerting"`; `Delta`: `"Delta"`; `Periodic`: `"Periodic"`; \}\>; `variableId`: `ZodOptional`\<`ZodNumber`\>; `variableMonitoringId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `EventDataCreateSchema` | [00_Base/src/interfaces/dto/event.data.dto.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/event.data.dto.ts#L48) |

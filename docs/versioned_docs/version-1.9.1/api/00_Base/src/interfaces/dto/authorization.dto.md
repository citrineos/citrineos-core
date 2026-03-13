[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/dto/authorization.dto

# 00_Base/src/interfaces/dto/authorization.dto

## Type Aliases

### AuthorizationCreate

```ts
type AuthorizationCreate = z.infer<typeof AuthorizationCreateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L61)

---

### AuthorizationDto

```ts
type AuthorizationDto = z.infer<typeof AuthorizationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L50)

---

### AuthorizationUpdate

```ts
type AuthorizationUpdate = z.infer<typeof AuthorizationUpdateSchema>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L73)

---

### GroupAuthorizationDto

```ts
type GroupAuthorizationDto = z.infer<typeof GroupAuthorizationSchema>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L40)

## Variables

### AuthorizationCreateSchema

```ts
const AuthorizationCreateSchema: ZodObject<
  {
    additionalInfo: ZodOptional<
      ZodNullable<
        ZodTuple<
          [
            ZodObject<
              {
                additionalIdToken: ZodString;
                id: ZodOptional<ZodNumber>;
                type: ZodString;
              },
              $strip
            >,
          ],
          ZodObject<
            {
              additionalIdToken: ZodString;
              id: ZodOptional<ZodNumber>;
              type: ZodString;
            },
            $strip
          >
        >
      >
    >;
    allowedConnectorTypes: ZodOptional<ZodArray<ZodString>>;
    cacheExpiryDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
    chargingPriority: ZodOptional<ZodNullable<ZodNumber>>;
    concurrentTransaction: ZodOptional<ZodBoolean>;
    disallowedEvseIdPrefixes: ZodOptional<ZodArray<ZodString>>;
    groupAuthorizationId: ZodOptional<ZodNullable<ZodNumber>>;
    idToken: ZodString;
    idTokenType: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Central: 'Central';
          eMAID: 'eMAID';
          ISO14443: 'ISO14443';
          ISO15693: 'ISO15693';
          KeyCode: 'KeyCode';
          Local: 'Local';
          MacAddress: 'MacAddress';
          NoAuthorization: 'NoAuthorization';
          Other: 'Other';
        }>
      >
    >;
    language1: ZodOptional<ZodNullable<ZodString>>;
    language2: ZodOptional<ZodNullable<ZodString>>;
    personalMessage: ZodOptional<ZodNullable<ZodAny>>;
    realTimeAuth: ZodOptional<
      ZodNullable<
        ZodEnum<{
          Allowed: 'Allowed';
          AllowedOffline: 'AllowedOffline';
          Never: 'Never';
        }>
      >
    >;
    realTimeAuthLastAttempt: ZodOptional<
      ZodNullable<
        ZodObject<
          {
            connectorId: ZodNumber;
            evseId: ZodOptional<ZodNullable<ZodNumber>>;
            result: ZodEnum<{
              Accepted: 'Accepted';
              Blocked: 'Blocked';
              ConcurrentTx: 'ConcurrentTx';
              Expired: 'Expired';
              Invalid: 'Invalid';
              NoCredit: 'NoCredit';
              NotAllowedTypeEVSE: 'NotAllowedTypeEVSE';
              NotAtThisLocation: 'NotAtThisLocation';
              NotAtThisTime: 'NotAtThisTime';
              Unknown: 'Unknown';
            }>;
            stationId: ZodString;
            timestamp: ZodISODateTime;
          },
          $strip
        >
      >
    >;
    realTimeAuthTimeout: ZodOptional<ZodNullable<ZodNumber>>;
    realTimeAuthUrl: ZodOptional<ZodString>;
    status: ZodEnum<{
      Accepted: 'Accepted';
      Blocked: 'Blocked';
      ConcurrentTx: 'ConcurrentTx';
      Expired: 'Expired';
      Invalid: 'Invalid';
      NoCredit: 'NoCredit';
      NotAllowedTypeEVSE: 'NotAllowedTypeEVSE';
      NotAtThisLocation: 'NotAtThisLocation';
      NotAtThisTime: 'NotAtThisTime';
      Unknown: 'Unknown';
    }>;
    tenantId: ZodOptional<ZodNumber>;
    tenantPartnerId: ZodOptional<ZodNullable<ZodNumber>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L52)

---

### AuthorizationProps

```ts
const AuthorizationProps: object;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L48)

#### Type Declaration

| Name                                                                      | Type                         | Defined in |
| ------------------------------------------------------------------------- | ---------------------------- | ---------- |
| <a id="property-additionalinfo"></a> `additionalInfo`                     | `"additionalInfo"`           |            |
| <a id="property-allowedconnectortypes"></a> `allowedConnectorTypes`       | `"allowedConnectorTypes"`    |            |
| <a id="property-cacheexpirydatetime"></a> `cacheExpiryDateTime`           | `"cacheExpiryDateTime"`      |            |
| <a id="property-chargingpriority"></a> `chargingPriority`                 | `"chargingPriority"`         |            |
| <a id="property-concurrenttransaction"></a> `concurrentTransaction`       | `"concurrentTransaction"`    |            |
| <a id="property-createdat"></a> `createdAt`                               | `"createdAt"`                |            |
| <a id="property-disallowedevseidprefixes"></a> `disallowedEvseIdPrefixes` | `"disallowedEvseIdPrefixes"` |            |
| <a id="property-groupauthorization"></a> `groupAuthorization`             | `"groupAuthorization"`       |            |
| <a id="property-groupauthorizationid"></a> `groupAuthorizationId`         | `"groupAuthorizationId"`     |            |
| <a id="property-id"></a> `id`                                             | `"id"`                       |            |
| <a id="property-idtoken"></a> `idToken`                                   | `"idToken"`                  |            |
| <a id="property-idtokentype"></a> `idTokenType`                           | `"idTokenType"`              |            |
| <a id="property-language1"></a> `language1`                               | `"language1"`                |            |
| <a id="property-language2"></a> `language2`                               | `"language2"`                |            |
| <a id="property-personalmessage"></a> `personalMessage`                   | `"personalMessage"`          |            |
| <a id="property-realtimeauth"></a> `realTimeAuth`                         | `"realTimeAuth"`             |            |
| <a id="property-realtimeauthlastattempt"></a> `realTimeAuthLastAttempt`   | `"realTimeAuthLastAttempt"`  |            |
| <a id="property-realtimeauthtimeout"></a> `realTimeAuthTimeout`           | `"realTimeAuthTimeout"`      |            |
| <a id="property-realtimeauthurl"></a> `realTimeAuthUrl`                   | `"realTimeAuthUrl"`          |            |
| <a id="property-status"></a> `status`                                     | `"status"`                   |            |
| <a id="property-tenant"></a> `tenant`                                     | `"tenant"`                   |            |
| <a id="property-tenantid"></a> `tenantId`                                 | `"tenantId"`                 |            |
| <a id="property-tenantpartner"></a> `tenantPartner`                       | `"tenantPartner"`            |            |
| <a id="property-tenantpartnerid"></a> `tenantPartnerId`                   | `"tenantPartnerId"`          |            |
| <a id="property-updatedat"></a> `updatedAt`                               | `"updatedAt"`                |            |

---

### AuthorizationSchema

```ts
const AuthorizationSchema: ZodObject<{
  additionalInfo: ZodOptional<ZodNullable<ZodTuple<[ZodObject<{
     additionalIdToken: ZodString;
     id: ZodOptional<ZodNumber>;
     type: ZodString;
   }, $strip>], ZodObject<{
     additionalIdToken: ZodString;
     id: ZodOptional<ZodNumber>;
     type: ZodString;
  }, $strip>>>>;
  allowedConnectorTypes: ZodOptional<ZodArray<ZodString>>;
  cacheExpiryDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  chargingPriority: ZodOptional<ZodNullable<ZodNumber>>;
  concurrentTransaction: ZodOptional<ZodBoolean>;
  createdAt: ZodOptional<ZodDate>;
  disallowedEvseIdPrefixes: ZodOptional<ZodArray<ZodString>>;
  groupAuthorization: ZodOptional<ZodLazy<ZodObject<{
     additionalInfo: ZodOptional<ZodNullable<ZodTuple<[ZodObject<..., ...>], ZodObject<{
        additionalIdToken: ...;
        id: ...;
        type: ...;
     }, $strip>>>>;
     allowedConnectorTypes: ZodOptional<ZodArray<ZodString>>;
     cacheExpiryDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
     chargingPriority: ZodOptional<ZodNullable<ZodNumber>>;
     concurrentTransaction: ZodOptional<ZodBoolean>;
     createdAt: ZodOptional<ZodDate>;
     disallowedEvseIdPrefixes: ZodOptional<ZodArray<ZodString>>;
     groupAuthorizationId: ZodOptional<ZodNullable<ZodNumber>>;
     id: ZodOptional<ZodNumber>;
     idToken: ZodString;
     idTokenType: ZodOptional<ZodNullable<ZodEnum<{
        Central: "Central";
        eMAID: "eMAID";
        ISO14443: "ISO14443";
        ISO15693: "ISO15693";
        KeyCode: "KeyCode";
        Local: "Local";
        MacAddress: "MacAddress";
        NoAuthorization: "NoAuthorization";
        Other: "Other";
     }>>>;
     language1: ZodOptional<ZodNullable<ZodString>>;
     language2: ZodOptional<ZodNullable<ZodString>>;
     personalMessage: ZodOptional<ZodNullable<ZodAny>>;
     realTimeAuth: ZodOptional<ZodNullable<ZodEnum<{
        Allowed: "Allowed";
        AllowedOffline: "AllowedOffline";
        Never: "Never";
     }>>>;
     realTimeAuthLastAttempt: ZodOptional<ZodNullable<ZodObject<{
        connectorId: ZodNumber;
        evseId: ZodOptional<...>;
        result: ZodEnum<...>;
        stationId: ZodString;
        timestamp: ZodISODateTime;
     }, $strip>>>;
     realTimeAuthTimeout: ZodOptional<ZodNullable<ZodNumber>>;
     realTimeAuthUrl: ZodOptional<ZodString>;
     status: ZodEnum<{
        Accepted: "Accepted";
        Blocked: "Blocked";
        ConcurrentTx: "ConcurrentTx";
        Expired: "Expired";
        Invalid: "Invalid";
        NoCredit: "NoCredit";
        NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
        NotAtThisLocation: "NotAtThisLocation";
        NotAtThisTime: "NotAtThisTime";
        Unknown: "Unknown";
     }>;
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
     tenantPartner: ZodOptional<ZodNullable<ZodObject<{
        countryCode: ZodOptional<...>;
        createdAt: ZodOptional<...>;
        id: ZodOptional<...>;
        partnerProfileOCPI: ZodObject<..., ...>;
        partyId: ZodOptional<...>;
        tenant: ZodOptional<...>;
        tenantId: ZodOptional<...>;
        updatedAt: ZodOptional<...>;
     }, $strip>>>;
     tenantPartnerId: ZodOptional<ZodNullable<ZodNumber>>;
     updatedAt: ZodOptional<ZodDate>;
  }, $strip>>>;
  groupAuthorizationId: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodOptional<ZodNumber>;
  idToken: ZodString;
  idTokenType: ZodOptional<ZodNullable<ZodEnum<{
     Central: "Central";
     eMAID: "eMAID";
     ISO14443: "ISO14443";
     ISO15693: "ISO15693";
     KeyCode: "KeyCode";
     Local: "Local";
     MacAddress: "MacAddress";
     NoAuthorization: "NoAuthorization";
     Other: "Other";
  }>>>;
  language1: ZodOptional<ZodNullable<ZodString>>;
  language2: ZodOptional<ZodNullable<ZodString>>;
  personalMessage: ZodOptional<ZodNullable<ZodAny>>;
  realTimeAuth: ZodOptional<ZodNullable<ZodEnum<{
     Allowed: "Allowed";
     AllowedOffline: "AllowedOffline";
     Never: "Never";
  }>>>;
  realTimeAuthLastAttempt: ZodOptional<ZodNullable<ZodObject<{
     connectorId: ZodNumber;
     evseId: ZodOptional<ZodNullable<ZodNumber>>;
     result: ZodEnum<{
        Accepted: "Accepted";
        Blocked: "Blocked";
        ConcurrentTx: "ConcurrentTx";
        Expired: "Expired";
        Invalid: "Invalid";
        NoCredit: "NoCredit";
        NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
        NotAtThisLocation: "NotAtThisLocation";
        NotAtThisTime: "NotAtThisTime";
        Unknown: "Unknown";
     }>;
     stationId: ZodString;
     timestamp: ZodISODateTime;
  }, $strip>>>;
  realTimeAuthTimeout: ZodOptional<ZodNullable<ZodNumber>>;
  realTimeAuthUrl: ZodOptional<ZodString>;
  status: ZodEnum<{
     Accepted: "Accepted";
     Blocked: "Blocked";
     ConcurrentTx: "ConcurrentTx";
     Expired: "Expired";
     Invalid: "Invalid";
     NoCredit: "NoCredit";
     NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
     NotAtThisLocation: "NotAtThisLocation";
     NotAtThisTime: "NotAtThisTime";
     Unknown: "Unknown";
  }>;
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
  tenantPartner: ZodOptional<ZodNullable<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     partnerProfileOCPI: ZodObject<{
        credentials: ZodOptional<ZodObject<{
           certificateRef: ...;
           token: ...;
           versionsUrl: ...;
        }, $strip>>;
        endpoints: ZodOptional<ZodArray<ZodObject<..., ...>>>;
        roles: ZodOptional<ZodArray<ZodObject<..., ...>>>;
        serverCredentials: ZodObject<{
           certificateRef: ZodOptional<...>;
           token: ZodOptional<...>;
           versionsUrl: ZodString;
        }, $strip>;
        version: ZodObject<{
           version: ZodEnum<...>;
           versionDetailsUrl: ZodOptional<...>;
        }, $strip>;
     }, $strip>;
     partyId: ZodOptional<ZodNullable<ZodString>>;
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
  tenantPartnerId: ZodOptional<ZodNullable<ZodNumber>>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L42)

---

### authorizationSchemas

```ts
const authorizationSchemas: object;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L75)

#### Type Declaration

| Name                                                            | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default value               | Defined in                                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-authorization"></a> `Authorization`             | `ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodTuple`\<\[`ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodString`; \}, `$strip`\>\], `ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodString`; \}, `$strip`\>\>\>\>; `allowedConnectorTypes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `cacheExpiryDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `chargingPriority`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `concurrentTransaction`: `ZodOptional`\<`ZodBoolean`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `groupAuthorization`: `ZodOptional`\<`ZodLazy`\<`ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodTuple`\<\[...\], `ZodObject`\<..., ...\>\>\>\>; `allowedConnectorTypes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `cacheExpiryDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `chargingPriority`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `concurrentTransaction`: `ZodOptional`\<`ZodBoolean`\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `groupAuthorizationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idToken`: `ZodString`; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Central`: ...; `eMAID`: ...; `ISO14443`: ...; `ISO15693`: ...; `KeyCode`: ...; `Local`: ...; `MacAddress`: ...; `NoAuthorization`: ...; `Other`: ...; \}\>\>\>; `language1`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `language2`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `personalMessage`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `realTimeAuth`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Allowed`: ...; `AllowedOffline`: ...; `Never`: ...; \}\>\>\>; `realTimeAuthLastAttempt`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: ...; `evseId`: ...; `result`: ...; `stationId`: ...; `timestamp`: ...; \}, `$strip`\>\>\>; `realTimeAuthTimeout`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `realTimeAuthUrl`: `ZodOptional`\<`ZodString`\>; `status`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartner`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `countryCode`: ...; `createdAt`: ...; `id`: ...; `partnerProfileOCPI`: ...; `partyId`: ...; `tenant`: ...; `tenantId`: ...; `updatedAt`: ...; \}, `$strip`\>\>\>; `tenantPartnerId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `groupAuthorizationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `id`: `ZodOptional`\<`ZodNumber`\>; `idToken`: `ZodString`; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Central`: `"Central"`; `eMAID`: `"eMAID"`; `ISO14443`: `"ISO14443"`; `ISO15693`: `"ISO15693"`; `KeyCode`: `"KeyCode"`; `Local`: `"Local"`; `MacAddress`: `"MacAddress"`; `NoAuthorization`: `"NoAuthorization"`; `Other`: `"Other"`; \}\>\>\>; `language1`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `language2`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `personalMessage`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `realTimeAuth`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Allowed`: `"Allowed"`; `AllowedOffline`: `"AllowedOffline"`; `Never`: `"Never"`; \}\>\>\>; `realTimeAuthLastAttempt`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: `ZodNumber`; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `result`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `stationId`: `ZodString`; `timestamp`: `ZodISODateTime`; \}, `$strip`\>\>\>; `realTimeAuthTimeout`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `realTimeAuthUrl`: `ZodOptional`\<`ZodString`\>; `status`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `isUserTenant`: `ZodDefault`\<`ZodBoolean`\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `serverProfileOCPI`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `credentialsRole`: `ZodObject`\<..., ...\>; `versionDetails`: `ZodArray`\<...\>; `versionEndpoints`: `ZodRecord`\<..., ...\>; \}, `$strip`\>\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; `url`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartner`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `createdAt`: `ZodOptional`\<`ZodDate`\>; `id`: `ZodOptional`\<`ZodNumber`\>; `partnerProfileOCPI`: `ZodObject`\<\{ `credentials`: `ZodOptional`\<`ZodObject`\<..., ...\>\>; `endpoints`: `ZodOptional`\<`ZodArray`\<...\>\>; `roles`: `ZodOptional`\<`ZodArray`\<...\>\>; `serverCredentials`: `ZodObject`\<\{ `certificateRef`: ...; `token`: ...; `versionsUrl`: ...; \}, `$strip`\>; `version`: `ZodObject`\<\{ `version`: ...; `versionDetailsUrl`: ...; \}, `$strip`\>; \}, `$strip`\>; `partyId`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `tenant`: `ZodOptional`\<`ZodObject`\<\{ `countryCode`: `ZodOptional`\<...\>; `createdAt`: `ZodOptional`\<...\>; `id`: `ZodOptional`\<...\>; `isUserTenant`: `ZodDefault`\<...\>; `name`: `ZodString`; `partyId`: `ZodOptional`\<...\>; `serverProfileOCPI`: `ZodOptional`\<...\>; `updatedAt`: `ZodOptional`\<...\>; `url`: `ZodOptional`\<...\>; \}, `$strip`\>\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\>\>\>; `tenantPartnerId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `updatedAt`: `ZodOptional`\<`ZodDate`\>; \}, `$strip`\> | `AuthorizationSchema`       | [00_Base/src/interfaces/dto/authorization.dto.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L76) |
| <a id="property-authorizationcreate"></a> `AuthorizationCreate` | `ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodNullable`\<`ZodTuple`\<\[`ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodString`; \}, `$strip`\>\], `ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodString`; \}, `$strip`\>\>\>\>; `allowedConnectorTypes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `cacheExpiryDateTime`: `ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>; `chargingPriority`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `concurrentTransaction`: `ZodOptional`\<`ZodBoolean`\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<`ZodArray`\<`ZodString`\>\>; `groupAuthorizationId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `idToken`: `ZodString`; `idTokenType`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Central`: `"Central"`; `eMAID`: `"eMAID"`; `ISO14443`: `"ISO14443"`; `ISO15693`: `"ISO15693"`; `KeyCode`: `"KeyCode"`; `Local`: `"Local"`; `MacAddress`: `"MacAddress"`; `NoAuthorization`: `"NoAuthorization"`; `Other`: `"Other"`; \}\>\>\>; `language1`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `language2`: `ZodOptional`\<`ZodNullable`\<`ZodString`\>\>; `personalMessage`: `ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>; `realTimeAuth`: `ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Allowed`: `"Allowed"`; `AllowedOffline`: `"AllowedOffline"`; `Never`: `"Never"`; \}\>\>\>; `realTimeAuthLastAttempt`: `ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: `ZodNumber`; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `result`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `stationId`: `ZodString`; `timestamp`: `ZodISODateTime`; \}, `$strip`\>\>\>; `realTimeAuthTimeout`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `realTimeAuthUrl`: `ZodOptional`\<`ZodString`\>; `status`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `tenantId`: `ZodOptional`\<`ZodNumber`\>; `tenantPartnerId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `AuthorizationCreateSchema` | [00_Base/src/interfaces/dto/authorization.dto.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L77) |
| <a id="property-authorizationupdate"></a> `AuthorizationUpdate` | `ZodObject`\<\{ `additionalInfo`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodTuple`\<\[`ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<...\>; `type`: `ZodString`; \}, `$strip`\>\], `ZodObject`\<\{ `additionalIdToken`: `ZodString`; `id`: `ZodOptional`\<`ZodNumber`\>; `type`: `ZodString`; \}, `$strip`\>\>\>\>\>; `allowedConnectorTypes`: `ZodOptional`\<`ZodOptional`\<`ZodArray`\<`ZodString`\>\>\>; `cacheExpiryDateTime`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodISODateTime`\>\>\>; `chargingPriority`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `concurrentTransaction`: `ZodOptional`\<`ZodOptional`\<`ZodBoolean`\>\>; `disallowedEvseIdPrefixes`: `ZodOptional`\<`ZodOptional`\<`ZodArray`\<`ZodString`\>\>\>; `groupAuthorizationId`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `id`: `ZodNonOptional`\<`ZodOptional`\<`ZodOptional`\<`ZodNumber`\>\>\>; `idToken`: `ZodOptional`\<`ZodString`\>; `idTokenType`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Central`: `"Central"`; `eMAID`: `"eMAID"`; `ISO14443`: `"ISO14443"`; `ISO15693`: `"ISO15693"`; `KeyCode`: `"KeyCode"`; `Local`: `"Local"`; `MacAddress`: `"MacAddress"`; `NoAuthorization`: `"NoAuthorization"`; `Other`: `"Other"`; \}\>\>\>\>; `language1`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `language2`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodString`\>\>\>; `personalMessage`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodAny`\>\>\>; `realTimeAuth`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodEnum`\<\{ `Allowed`: `"Allowed"`; `AllowedOffline`: `"AllowedOffline"`; `Never`: `"Never"`; \}\>\>\>\>; `realTimeAuthLastAttempt`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodObject`\<\{ `connectorId`: `ZodNumber`; `evseId`: `ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>; `result`: `ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>; `stationId`: `ZodString`; `timestamp`: `ZodISODateTime`; \}, `$strip`\>\>\>\>; `realTimeAuthTimeout`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; `realTimeAuthUrl`: `ZodOptional`\<`ZodOptional`\<`ZodString`\>\>; `status`: `ZodOptional`\<`ZodEnum`\<\{ `Accepted`: `"Accepted"`; `Blocked`: `"Blocked"`; `ConcurrentTx`: `"ConcurrentTx"`; `Expired`: `"Expired"`; `Invalid`: `"Invalid"`; `NoCredit`: `"NoCredit"`; `NotAllowedTypeEVSE`: `"NotAllowedTypeEVSE"`; `NotAtThisLocation`: `"NotAtThisLocation"`; `NotAtThisTime`: `"NotAtThisTime"`; `Unknown`: `"Unknown"`; \}\>\>; `tenantId`: `ZodNonOptional`\<`ZodOptional`\<`ZodOptional`\<`ZodNumber`\>\>\>; `tenantPartnerId`: `ZodOptional`\<`ZodOptional`\<`ZodNullable`\<`ZodNumber`\>\>\>; \}, `$strip`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `AuthorizationUpdateSchema` | [00_Base/src/interfaces/dto/authorization.dto.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L78) |

---

### AuthorizationUpdateSchema

```ts
const AuthorizationUpdateSchema: ZodObject<
  {
    additionalInfo: ZodOptional<
      ZodOptional<
        ZodNullable<
          ZodTuple<
            [
              ZodObject<
                {
                  additionalIdToken: ZodString;
                  id: ZodOptional<ZodNumber>;
                  type: ZodString;
                },
                $strip
              >,
            ],
            ZodObject<
              {
                additionalIdToken: ZodString;
                id: ZodOptional<ZodNumber>;
                type: ZodString;
              },
              $strip
            >
          >
        >
      >
    >;
    allowedConnectorTypes: ZodOptional<ZodOptional<ZodArray<ZodString>>>;
    cacheExpiryDateTime: ZodOptional<ZodOptional<ZodNullable<ZodISODateTime>>>;
    chargingPriority: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
    concurrentTransaction: ZodOptional<ZodOptional<ZodBoolean>>;
    disallowedEvseIdPrefixes: ZodOptional<ZodOptional<ZodArray<ZodString>>>;
    groupAuthorizationId: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
    id: ZodNonOptional<ZodOptional<ZodOptional<ZodNumber>>>;
    idToken: ZodOptional<ZodString>;
    idTokenType: ZodOptional<
      ZodOptional<
        ZodNullable<
          ZodEnum<{
            Central: 'Central';
            eMAID: 'eMAID';
            ISO14443: 'ISO14443';
            ISO15693: 'ISO15693';
            KeyCode: 'KeyCode';
            Local: 'Local';
            MacAddress: 'MacAddress';
            NoAuthorization: 'NoAuthorization';
            Other: 'Other';
          }>
        >
      >
    >;
    language1: ZodOptional<ZodOptional<ZodNullable<ZodString>>>;
    language2: ZodOptional<ZodOptional<ZodNullable<ZodString>>>;
    personalMessage: ZodOptional<ZodOptional<ZodNullable<ZodAny>>>;
    realTimeAuth: ZodOptional<
      ZodOptional<
        ZodNullable<
          ZodEnum<{
            Allowed: 'Allowed';
            AllowedOffline: 'AllowedOffline';
            Never: 'Never';
          }>
        >
      >
    >;
    realTimeAuthLastAttempt: ZodOptional<
      ZodOptional<
        ZodNullable<
          ZodObject<
            {
              connectorId: ZodNumber;
              evseId: ZodOptional<ZodNullable<ZodNumber>>;
              result: ZodEnum<{
                Accepted: 'Accepted';
                Blocked: 'Blocked';
                ConcurrentTx: 'ConcurrentTx';
                Expired: 'Expired';
                Invalid: 'Invalid';
                NoCredit: 'NoCredit';
                NotAllowedTypeEVSE: 'NotAllowedTypeEVSE';
                NotAtThisLocation: 'NotAtThisLocation';
                NotAtThisTime: 'NotAtThisTime';
                Unknown: 'Unknown';
              }>;
              stationId: ZodString;
              timestamp: ZodISODateTime;
            },
            $strip
          >
        >
      >
    >;
    realTimeAuthTimeout: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
    realTimeAuthUrl: ZodOptional<ZodOptional<ZodString>>;
    status: ZodOptional<
      ZodEnum<{
        Accepted: 'Accepted';
        Blocked: 'Blocked';
        ConcurrentTx: 'ConcurrentTx';
        Expired: 'Expired';
        Invalid: 'Invalid';
        NoCredit: 'NoCredit';
        NotAllowedTypeEVSE: 'NotAllowedTypeEVSE';
        NotAtThisLocation: 'NotAtThisLocation';
        NotAtThisTime: 'NotAtThisTime';
        Unknown: 'Unknown';
      }>
    >;
    tenantId: ZodNonOptional<ZodOptional<ZodOptional<ZodNumber>>>;
    tenantPartnerId: ZodOptional<ZodOptional<ZodNullable<ZodNumber>>>;
  },
  $strip
>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L63)

---

### GroupAuthorizationSchema

```ts
const GroupAuthorizationSchema: ZodObject<{
  additionalInfo: ZodOptional<ZodNullable<ZodTuple<[ZodObject<{
     additionalIdToken: ZodString;
     id: ZodOptional<ZodNumber>;
     type: ZodString;
   }, $strip>], ZodObject<{
     additionalIdToken: ZodString;
     id: ZodOptional<ZodNumber>;
     type: ZodString;
  }, $strip>>>>;
  allowedConnectorTypes: ZodOptional<ZodArray<ZodString>>;
  cacheExpiryDateTime: ZodOptional<ZodNullable<ZodISODateTime>>;
  chargingPriority: ZodOptional<ZodNullable<ZodNumber>>;
  concurrentTransaction: ZodOptional<ZodBoolean>;
  createdAt: ZodOptional<ZodDate>;
  disallowedEvseIdPrefixes: ZodOptional<ZodArray<ZodString>>;
  groupAuthorizationId: ZodOptional<ZodNullable<ZodNumber>>;
  id: ZodOptional<ZodNumber>;
  idToken: ZodString;
  idTokenType: ZodOptional<ZodNullable<ZodEnum<{
     Central: "Central";
     eMAID: "eMAID";
     ISO14443: "ISO14443";
     ISO15693: "ISO15693";
     KeyCode: "KeyCode";
     Local: "Local";
     MacAddress: "MacAddress";
     NoAuthorization: "NoAuthorization";
     Other: "Other";
  }>>>;
  language1: ZodOptional<ZodNullable<ZodString>>;
  language2: ZodOptional<ZodNullable<ZodString>>;
  personalMessage: ZodOptional<ZodNullable<ZodAny>>;
  realTimeAuth: ZodOptional<ZodNullable<ZodEnum<{
     Allowed: "Allowed";
     AllowedOffline: "AllowedOffline";
     Never: "Never";
  }>>>;
  realTimeAuthLastAttempt: ZodOptional<ZodNullable<ZodObject<{
     connectorId: ZodNumber;
     evseId: ZodOptional<ZodNullable<ZodNumber>>;
     result: ZodEnum<{
        Accepted: "Accepted";
        Blocked: "Blocked";
        ConcurrentTx: "ConcurrentTx";
        Expired: "Expired";
        Invalid: "Invalid";
        NoCredit: "NoCredit";
        NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
        NotAtThisLocation: "NotAtThisLocation";
        NotAtThisTime: "NotAtThisTime";
        Unknown: "Unknown";
     }>;
     stationId: ZodString;
     timestamp: ZodISODateTime;
  }, $strip>>>;
  realTimeAuthTimeout: ZodOptional<ZodNullable<ZodNumber>>;
  realTimeAuthUrl: ZodOptional<ZodString>;
  status: ZodEnum<{
     Accepted: "Accepted";
     Blocked: "Blocked";
     ConcurrentTx: "ConcurrentTx";
     Expired: "Expired";
     Invalid: "Invalid";
     NoCredit: "NoCredit";
     NotAllowedTypeEVSE: "NotAllowedTypeEVSE";
     NotAtThisLocation: "NotAtThisLocation";
     NotAtThisTime: "NotAtThisTime";
     Unknown: "Unknown";
  }>;
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
  tenantPartner: ZodOptional<ZodNullable<ZodObject<{
     countryCode: ZodOptional<ZodNullable<ZodString>>;
     createdAt: ZodOptional<ZodDate>;
     id: ZodOptional<ZodNumber>;
     partnerProfileOCPI: ZodObject<{
        credentials: ZodOptional<ZodObject<{
           certificateRef: ...;
           token: ...;
           versionsUrl: ...;
        }, $strip>>;
        endpoints: ZodOptional<ZodArray<ZodObject<..., ...>>>;
        roles: ZodOptional<ZodArray<ZodObject<..., ...>>>;
        serverCredentials: ZodObject<{
           certificateRef: ZodOptional<...>;
           token: ZodOptional<...>;
           versionsUrl: ZodString;
        }, $strip>;
        version: ZodObject<{
           version: ZodEnum<...>;
           versionDetailsUrl: ZodOptional<...>;
        }, $strip>;
     }, $strip>;
     partyId: ZodOptional<ZodNullable<ZodString>>;
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
  tenantPartnerId: ZodOptional<ZodNullable<ZodNumber>>;
  updatedAt: ZodOptional<ZodDate>;
}, $strip>;
```

Defined in: [00_Base/src/interfaces/dto/authorization.dto.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/dto/authorization.dto.ts#L38)

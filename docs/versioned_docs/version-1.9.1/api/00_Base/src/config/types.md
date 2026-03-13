[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/config/types

# 00_Base/src/config/types

## Type Aliases

### RbacRules

```ts
type RbacRules = z.infer<typeof RbacRulesSchema>;
```

Defined in: [00_Base/src/config/types.ts:622](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L622)

---

### SystemConfig

```ts
type SystemConfig = z.infer<typeof systemConfigSchema>;
```

Defined in: [00_Base/src/config/types.ts:625](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L625)

---

### SystemConfigInput

```ts
type SystemConfigInput = z.infer<typeof systemConfigInputSchema>;
```

Defined in: [00_Base/src/config/types.ts:300](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L300)

---

### WebsocketServerConfig

```ts
type WebsocketServerConfig = z.infer<typeof websocketServerSchema>;
```

Defined in: [00_Base/src/config/types.ts:624](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L624)

## Variables

### HttpMethodSchema

```ts
const HttpMethodSchema: ZodRecord<ZodString, ZodArray<ZodString>>;
```

Defined in: [00_Base/src/config/types.ts:605](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L605)

---

### HUBJECT_DEFAULT_AUTH_TOKEN

```ts
const HUBJECT_DEFAULT_AUTH_TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkJ3eEV0TkFGUnpSM3JlNVF2elM2QyJ9.eyJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vcm9sZSI6WyJBRE1JTiIsIk9FTSIsIkNQTyIsIk1PX0hVQkpFQ1RfUEtJIl0sImh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbS9wY2lkIjpbIkhVQiIsImh1YiJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZW1haWQiOlsiREVIVUIiLCJFTVA3NyJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vY2xpZW50X25hbWUiOlsiSHViamVjdCJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZGFzaDIwIjpbInRydWUiXSwiaHR0cHM6Ly9ldS5wbHVnbmNoYXJnZS10ZXN0Lmh1YmplY3QuY29tL2NsaWVudF9hcHAiOiJPcGVuIFRlc3QgRW52aXJvbm1lbnQiLCJpc3MiOiJodHRwczovL2F1dGguZXUucGx1Z25jaGFyZ2UuaHViamVjdC5jb20vIiwic3ViIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmdAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbSIsImlhdCI6MTc3MDcwMTgxMSwiZXhwIjoxNzcwNzg4MjExLCJzY29wZSI6InJjcHNlcnZpY2UgcGNwc2VydmljZSBjY3BzZXJ2aWNlIGNwc2VydmljZSBwa2lnYXRld2F5IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXpwIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmciLCJwZXJtaXNzaW9ucyI6WyJyY3BzZXJ2aWNlIiwicGNwc2VydmljZSIsImNjcHNlcnZpY2UiLCJjcHNlcnZpY2UiLCJwa2lnYXRld2F5Il19.qpkB0reRKznCNXnbxCs0WMPCZx2ezo3Uv7vb0FW0qtMFHLF88IjzA0TUn4azD3zwjIG0N6rnTws4kzKkzwC-_XejCF-RvTEWKM4iUisdbl3Hz8nov0QmAME9U7BYJ52BHaQxP0S6o89qWRgtkzB63XRbbI_Z1fAh9Pzz-eVJePgD2GANNb8JqCzlV0vgyZU3jvdmVvJDYMyqyGe_lLlU5E0ocUntAWaP_TyrmRqctb5VB82WEdwdsRB5Wusqc5C0rLUwsySOff5gcDg5LXtGwUZtsA7TTtVQSqhQ1HrPVYhlKl-s5TZ-v7uho8wCnaCoJt6GPvZzKqHJHydBMlWDWg' =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkJ3eEV0TkFGUnpSM3JlNVF2elM2QyJ9.eyJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vcm9sZSI6WyJBRE1JTiIsIk9FTSIsIkNQTyIsIk1PX0hVQkpFQ1RfUEtJIl0sImh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbS9wY2lkIjpbIkhVQiIsImh1YiJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZW1haWQiOlsiREVIVUIiLCJFTVA3NyJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vY2xpZW50X25hbWUiOlsiSHViamVjdCJdLCJodHRwczovL2V1LnBsdWduY2hhcmdlLXRlc3QuaHViamVjdC5jb20vZGFzaDIwIjpbInRydWUiXSwiaHR0cHM6Ly9ldS5wbHVnbmNoYXJnZS10ZXN0Lmh1YmplY3QuY29tL2NsaWVudF9hcHAiOiJPcGVuIFRlc3QgRW52aXJvbm1lbnQiLCJpc3MiOiJodHRwczovL2F1dGguZXUucGx1Z25jaGFyZ2UuaHViamVjdC5jb20vIiwic3ViIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmdAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vZXUucGx1Z25jaGFyZ2UtdGVzdC5odWJqZWN0LmNvbSIsImlhdCI6MTc3MDcwMTgxMSwiZXhwIjoxNzcwNzg4MjExLCJzY29wZSI6InJjcHNlcnZpY2UgcGNwc2VydmljZSBjY3BzZXJ2aWNlIGNwc2VydmljZSBwa2lnYXRld2F5IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXpwIjoibzU3UWF3cTFvbms3VWtacmhGbUVxalNPTXFkaDM0UmciLCJwZXJtaXNzaW9ucyI6WyJyY3BzZXJ2aWNlIiwicGNwc2VydmljZSIsImNjcHNlcnZpY2UiLCJjcHNlcnZpY2UiLCJwa2lnYXRld2F5Il19.qpkB0reRKznCNXnbxCs0WMPCZx2ezo3Uv7vb0FW0qtMFHLF88IjzA0TUn4azD3zwjIG0N6rnTws4kzKkzwC-_XejCF-RvTEWKM4iUisdbl3Hz8nov0QmAME9U7BYJ52BHaQxP0S6o89qWRgtkzB63XRbbI_Z1fAh9Pzz-eVJePgD2GANNb8JqCzlV0vgyZU3jvdmVvJDYMyqyGe_lLlU5E0ocUntAWaP_TyrmRqctb5VB82WEdwdsRB5Wusqc5C0rLUwsySOff5gcDg5LXtGwUZtsA7TTtVQSqhQ1HrPVYhlKl-s5TZ-v7uho8wCnaCoJt6GPvZzKqHJHydBMlWDWg';
```

Defined in: [00_Base/src/config/types.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L61)

---

### HUBJECT_DEFAULT_BASEURL

```ts
const HUBJECT_DEFAULT_BASEURL: 'https://open.plugncharge-test.hubject.com' =
  'https://open.plugncharge-test.hubject.com';
```

Defined in: [00_Base/src/config/types.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L56)

---

### HUBJECT_DEFAULT_CLIENTID

```ts
const HUBJECT_DEFAULT_CLIENTID: 'YOUR_CLIENT_ID' = 'YOUR_CLIENT_ID';
```

Defined in: [00_Base/src/config/types.ts:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L59)

---

### HUBJECT_DEFAULT_CLIENTSECRET

```ts
const HUBJECT_DEFAULT_CLIENTSECRET: 'YOUR_CLIENT_SECRET' = 'YOUR_CLIENT_SECRET';
```

Defined in: [00_Base/src/config/types.ts:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L60)

---

### HUBJECT_DEFAULT_TOKENURL

```ts
const HUBJECT_DEFAULT_TOKENURL: 'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token' =
  'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token';
```

Defined in: [00_Base/src/config/types.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L57)

---

### oidcClientConfigSchema

```ts
const oidcClientConfigSchema: ZodOptional<
  ZodObject<
    {
      audience: ZodString;
      clientId: ZodString;
      clientSecret: ZodString;
      tokenUrl: ZodString;
    },
    $strip
  >
>;
```

Defined in: [00_Base/src/config/types.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L15)

---

### RbacRulesSchema

```ts
const RbacRulesSchema: ZodRecord<
  ZodString,
  ZodRecord<ZodString, ZodRecord<ZodString, ZodArray<ZodString>>>
> = TenantSchema;
```

Defined in: [00_Base/src/config/types.ts:620](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L620)

---

### systemConfigInputSchema

```ts
const systemConfigInputSchema: ZodObject<{
  centralSystem: ZodObject<{
     host: ZodOptional<ZodDefault<ZodString>>;
     port: ZodOptional<ZodDefault<ZodNumber>>;
     systemApiToken: ZodOptional<ZodString>;
  }, $strip>;
  env: ZodEnum<{
     development: "development";
     production: "production";
  }>;
  logLevel: ZodOptional<ZodDefault<ZodNumber>>;
  maxCachingSeconds: ZodOptional<ZodDefault<ZodNumber>>;
  maxCallLengthSeconds: ZodOptional<ZodDefault<ZodNumber>>;
  maxReconnectDelay: ZodOptional<ZodDefault<ZodNumber>>;
  modules: ZodObject<{
     certificates: ZodOptional<ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
     }, $strip>>;
     configuration: ZodObject<{
        bootRetryInterval: ZodOptional<ZodDefault<ZodNumber>>;
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        heartbeatInterval: ZodOptional<ZodDefault<ZodNumber>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        ocpp1_6: ZodOptional<ZodObject<{
           unknownChargerStatus: ZodOptional<ZodDefault<...>>;
        }, $strip>>;
        ocpp2_0_1: ZodOptional<ZodObject<{
           autoAccept: ZodOptional<ZodDefault<...>>;
           bootWithRejectedVariables: ZodOptional<ZodDefault<...>>;
           getBaseReportOnPending: ZodOptional<ZodDefault<...>>;
           unknownChargerStatus: ZodOptional<ZodDefault<...>>;
        }, $strip>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     evdriver: ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     monitoring: ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     reporting: ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     smartcharging: ZodOptional<ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
     }, $strip>>;
     tenant: ZodOptional<ZodObject<{
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        ocppRouterBaseUrl: ZodOptional<ZodString>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
     }, $strip>>;
     transactions: ZodObject<{
        costUpdatedInterval: ZodOptional<ZodDefault<ZodNumber>>;
        endpointPrefix: ZodOptional<ZodDefault<ZodString>>;
        host: ZodOptional<ZodDefault<ZodString>>;
        port: ZodOptional<ZodDefault<ZodNumber>>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        sendCostUpdatedOnMeterValue: ZodOptional<ZodDefault<ZodBoolean>>;
        signedMeterValuesConfiguration: ZodOptional<ZodObject<{
           publicKeyFileId: ZodString;
           signingMethod: ZodEnum<{
              ECDSA: ...;
              RSASSA-PKCS1-v1_5: ...;
           }>;
        }, $strip>>;
     }, $strip>;
  }, $strip>;
  ocpiServer: ZodObject<{
     host: ZodOptional<ZodDefault<ZodString>>;
     port: ZodOptional<ZodDefault<ZodNumber>>;
  }, $strip>;
  rbacRulesDir: ZodOptional<ZodString>;
  rbacRulesFileName: ZodOptional<ZodDefault<ZodString>>;
  realTimeAuthDefaultTimeoutSeconds: ZodOptional<ZodDefault<ZodNumber>>;
  userPreferences: ZodObject<{
     telemetryConsent: ZodOptional<ZodDefault<ZodBoolean>>;
  }, $strip>;
  util: ZodObject<{
     authProvider: ZodObject<{
        localByPass: ZodOptional<ZodDefault<ZodBoolean>>;
        oidc: ZodOptional<ZodObject<{
           audience: ZodString;
           cacheTime: ZodOptional<ZodNumber>;
           issuer: ZodString;
           jwksUri: ZodString;
           rateLimit: ZodOptional<ZodDefault<...>>;
        }, $strip>>;
     }, $strip>;
     cache: ZodObject<{
        memory: ZodOptional<ZodBoolean>;
        redis: ZodOptional<ZodUnion<readonly [ZodObject<{
           host: ...;
           port: ...;
         }, $strip>, ZodObject<{
           url: ...;
        }, $strip>]>>;
     }, $strip>;
     certificateAuthority: ZodObject<{
        chargingStationCA: ZodObject<{
           acme: ZodOptional<ZodObject<{
              accountKeyFilePath: ...;
              email: ...;
              env: ...;
           }, $strip>>;
           name: ZodDefault<ZodEnum<{
              acme: ...;
           }>>;
        }, $strip>;
        v2gCA: ZodObject<{
           hubject: ZodOptional<ZodObject<{
              baseUrl: ...;
              clientId: ...;
              clientSecret: ...;
              tokenUrl: ...;
           }, $strip>>;
           name: ZodDefault<ZodEnum<{
              hubject: ...;
           }>>;
        }, $strip>;
     }, $strip>;
     messageBroker: ZodObject<{
        amqp: ZodOptional<ZodObject<{
           exchange: ZodString;
           url: ZodString;
        }, $strip>>;
     }, $strip>;
     networkConnection: ZodObject<{
        websocketServers: ZodArray<ZodOptional<ZodObject<{
           allowUnknownChargingStations: ZodOptional<...>;
           dynamicTenantResolution: ZodDefault<...>;
           host: ZodOptional<...>;
           id: ZodOptional<...>;
           ignoreAuthenticationHeaders: ZodOptional<...>;
           maxConnectionsPerTenant: ZodOptional<...>;
           mtlsCertificateAuthorityKeyFilePath: ZodOptional<...>;
           pingInterval: ZodOptional<...>;
           port: ZodOptional<...>;
           protocols: ZodOptional<...>;
           rootCACertificateFilePath: ZodOptional<...>;
           securityProfile: ZodOptional<...>;
           tenantId: ZodNumber;
           tenantPathMapping: ZodOptional<...>;
           tlsCertificateChainFilePath: ZodOptional<...>;
           tlsKeyFilePath: ZodOptional<...>;
        }, $strip>>>;
     }, $strip>;
     swagger: ZodOptional<ZodObject<{
        exposeData: ZodOptional<ZodDefault<ZodBoolean>>;
        exposeMessage: ZodOptional<ZodDefault<ZodBoolean>>;
        logoPath: ZodString;
        path: ZodOptional<ZodDefault<ZodString>>;
     }, $strip>>;
  }, $strip>;
}, $strip>;
```

Defined in: [00_Base/src/config/types.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L64)

---

### systemConfigSchema

```ts
const systemConfigSchema: ZodObject<{
  centralSystem: ZodObject<{
     host: ZodString;
     port: ZodNumber;
     systemApiToken: ZodOptional<ZodString>;
  }, $strip>;
  env: ZodEnum<{
     development: "development";
     production: "production";
  }>;
  logLevel: ZodNumber;
  maxCachingSeconds: ZodNumber;
  maxCallLengthSeconds: ZodNumber;
  maxReconnectDelay: ZodDefault<ZodNumber>;
  modules: ZodObject<{
     certificates: ZodOptional<ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
     }, $strip>>;
     configuration: ZodObject<{
        bootRetryInterval: ZodNumber;
        endpointPrefix: ZodString;
        heartbeatInterval: ZodNumber;
        host: ZodOptional<ZodString>;
        ocpp1_6: ZodOptional<ZodObject<{
           unknownChargerStatus: ZodEnum<{
              Accepted: ...;
              Pending: ...;
              Rejected: ...;
           }>;
        }, $strip>>;
        ocpp2_0_1: ZodOptional<ZodObject<{
           autoAccept: ZodBoolean;
           bootWithRejectedVariables: ZodBoolean;
           getBaseReportOnPending: ZodBoolean;
           unknownChargerStatus: ZodEnum<{
              Accepted: ...;
              Pending: ...;
              Rejected: ...;
           }>;
        }, $strip>>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     evdriver: ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     monitoring: ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     reporting: ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     smartcharging: ZodOptional<ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<...>, ZodEnum<...>]>>;
     }, $strip>>;
     tenant: ZodObject<{
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        ocppRouterBaseUrl: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
     }, $strip>;
     transactions: ZodObject<{
        costUpdatedInterval: ZodOptional<ZodNumber>;
        endpointPrefix: ZodString;
        host: ZodOptional<ZodString>;
        port: ZodOptional<ZodNumber>;
        requests: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        responses: ZodArray<ZodUnion<readonly [ZodEnum<typeof OCPP1_6_CallAction>, ZodEnum<typeof OCPP2_0_1_CallAction>]>>;
        sendCostUpdatedOnMeterValue: ZodOptional<ZodBoolean>;
        signedMeterValuesConfiguration: ZodOptional<ZodObject<{
           publicKeyFileId: ZodString;
           signingMethod: ZodEnum<{
              ECDSA: ...;
              RSASSA-PKCS1-v1_5: ...;
           }>;
        }, $strip>>;
     }, $strip>;
  }, $strip>;
  ocpiServer: ZodObject<{
     host: ZodString;
     port: ZodNumber;
  }, $strip>;
  oidcClient: ZodOptional<ZodObject<{
     audience: ZodString;
     clientId: ZodString;
     clientSecret: ZodString;
     tokenUrl: ZodString;
  }, $strip>>;
  rbacRulesDir: ZodOptional<ZodString>;
  rbacRulesFileName: ZodOptional<ZodString>;
  realTimeAuthDefaultTimeoutSeconds: ZodDefault<ZodNumber>;
  userPreferences: ZodObject<{
     telemetryConsent: ZodOptional<ZodBoolean>;
  }, $strip>;
  util: ZodObject<{
     authProvider: ZodObject<{
        localByPass: ZodOptional<ZodDefault<ZodBoolean>>;
        oidc: ZodOptional<ZodObject<{
           audience: ZodString;
           cacheTime: ZodOptional<ZodNumber>;
           issuer: ZodString;
           jwksUri: ZodString;
           rateLimit: ZodBoolean;
        }, $strip>>;
     }, $strip>;
     cache: ZodObject<{
        memory: ZodOptional<ZodBoolean>;
        redis: ZodOptional<ZodUnion<readonly [ZodObject<{
           host: ...;
           port: ...;
         }, $strip>, ZodObject<{
           url: ...;
        }, $strip>]>>;
     }, $strip>;
     certificateAuthority: ZodObject<{
        chargingStationCA: ZodObject<{
           acme: ZodOptional<ZodObject<{
              accountKeyFilePath: ...;
              email: ...;
              env: ...;
           }, $strip>>;
           name: ZodEnum<{
              acme: "acme";
           }>;
        }, $strip>;
        v2gCA: ZodObject<{
           hubject: ZodOptional<ZodObject<{
              baseUrl: ...;
              clientId: ...;
              clientSecret: ...;
              tokenUrl: ...;
           }, $strip>>;
           name: ZodEnum<{
              hubject: "hubject";
           }>;
        }, $strip>;
     }, $strip>;
     messageBroker: ZodObject<{
        amqp: ZodOptional<ZodObject<{
           exchange: ZodString;
           url: ZodString;
        }, $strip>>;
     }, $strip>;
     networkConnection: ZodObject<{
        websocketServers: ZodArray<ZodObject<{
           allowUnknownChargingStations: ZodBoolean;
           dynamicTenantResolution: ZodDefault<ZodOptional<...>>;
           host: ZodString;
           id: ZodString;
           ignoreAuthenticationHeaders: ZodOptional<ZodDefault<...>>;
           maxConnectionsPerTenant: ZodOptional<ZodNumber>;
           mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
           pingInterval: ZodNumber;
           port: ZodNumber;
           protocols: ZodArray<ZodEnum<...>>;
           rootCACertificateFilePath: ZodOptional<ZodString>;
           securityProfile: ZodNumber;
           tenantId: ZodNumber;
           tenantPathMapping: ZodOptional<ZodRecord<..., ...>>;
           tlsCertificateChainFilePath: ZodOptional<ZodString>;
           tlsKeyFilePath: ZodOptional<ZodString>;
        }, $strip>>;
     }, $strip>;
     swagger: ZodOptional<ZodObject<{
        exposeData: ZodBoolean;
        exposeMessage: ZodBoolean;
        logoPath: ZodString;
        path: ZodString;
     }, $strip>>;
  }, $strip>;
}, $strip>;
```

Defined in: [00_Base/src/config/types.ts:344](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L344)

---

### TenantSchema

```ts
const TenantSchema: ZodRecord<
  ZodString,
  ZodRecord<ZodString, ZodRecord<ZodString, ZodArray<ZodString>>>
>;
```

Defined in: [00_Base/src/config/types.ts:615](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L615)

---

### UrlPatternSchema

```ts
const UrlPatternSchema: ZodRecord<ZodString, ZodRecord<ZodString, ZodArray<ZodString>>>;
```

Defined in: [00_Base/src/config/types.ts:610](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L610)

---

### websocketServerInputSchema

```ts
const websocketServerInputSchema: ZodObject<{
  allowUnknownChargingStations: ZodOptional<ZodDefault<ZodBoolean>>;
  dynamicTenantResolution: ZodDefault<ZodOptional<ZodBoolean>>;
  host: ZodOptional<ZodDefault<ZodString>>;
  id: ZodOptional<ZodString>;
  ignoreAuthenticationHeaders: ZodOptional<ZodDefault<ZodBoolean>>;
  maxConnectionsPerTenant: ZodOptional<ZodNumber>;
  mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
  pingInterval: ZodOptional<ZodDefault<ZodNumber>>;
  port: ZodOptional<ZodDefault<ZodNumber>>;
  protocols: ZodOptional<ZodDefault<ZodArray<ZodEnum<{
     ocpp1.6: "ocpp1.6";
     ocpp2.0.1: "ocpp2.0.1";
  }>>>>;
  rootCACertificateFilePath: ZodOptional<ZodString>;
  securityProfile: ZodOptional<ZodDefault<ZodNumber>>;
  tenantId: ZodNumber;
  tenantPathMapping: ZodOptional<ZodRecord<ZodString, ZodNumber>>;
  tlsCertificateChainFilePath: ZodOptional<ZodString>;
  tlsKeyFilePath: ZodOptional<ZodString>;
}, $strip>;
```

Defined in: [00_Base/src/config/types.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L25)

---

### websocketServerSchema

```ts
const websocketServerSchema: ZodObject<{
  allowUnknownChargingStations: ZodBoolean;
  dynamicTenantResolution: ZodDefault<ZodOptional<ZodBoolean>>;
  host: ZodString;
  id: ZodString;
  ignoreAuthenticationHeaders: ZodOptional<ZodDefault<ZodBoolean>>;
  maxConnectionsPerTenant: ZodOptional<ZodNumber>;
  mtlsCertificateAuthorityKeyFilePath: ZodOptional<ZodString>;
  pingInterval: ZodNumber;
  port: ZodNumber;
  protocols: ZodArray<ZodEnum<{
     ocpp1.6: "ocpp1.6";
     ocpp2.0.1: "ocpp2.0.1";
  }>>;
  rootCACertificateFilePath: ZodOptional<ZodString>;
  securityProfile: ZodNumber;
  tenantId: ZodNumber;
  tenantPathMapping: ZodOptional<ZodRecord<ZodString, ZodNumber>>;
  tlsCertificateChainFilePath: ZodOptional<ZodString>;
  tlsKeyFilePath: ZodOptional<ZodString>;
}, $strip>;
```

Defined in: [00_Base/src/config/types.ts:302](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/types.ts#L302)

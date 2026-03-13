[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/authorization/OidcTokenProvider

# 02_Util/src/authorization/OidcTokenProvider

## Classes

### OidcTokenProvider

Defined in: [02_Util/src/authorization/OidcTokenProvider.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L20)

#### Constructors

##### Constructor

```ts
new OidcTokenProvider(config, logger?): OidcTokenProvider;
```

Defined in: [02_Util/src/authorization/OidcTokenProvider.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L24)

###### Parameters

| Parameter | Type                                                    |
| --------- | ------------------------------------------------------- |
| `config`  | [`OidcTokenProviderConfig`](#oidctokenproviderconfig-1) |
| `logger?` | `Logger`\<`ILogObj`\>                                   |

###### Returns

[`OidcTokenProvider`](#oidctokenprovider)

#### Properties

| Property                            | Modifier  | Type                                                    | Defined in                                                                                                                                                                                        |
| ----------------------------------- | --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger`      | `private` | `Logger`\<`ILogObj`\>                                   | [02_Util/src/authorization/OidcTokenProvider.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L22) |
| <a id="config"></a> `config`        | `private` | [`OidcTokenProviderConfig`](#oidctokenproviderconfig-1) | [02_Util/src/authorization/OidcTokenProvider.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L25) |
| <a id="oidctoken"></a> `oidcToken?` | `private` | `OidcToken`                                             | [02_Util/src/authorization/OidcTokenProvider.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L21) |

#### Methods

##### getToken()

```ts
getToken(): Promise<string>;
```

Defined in: [02_Util/src/authorization/OidcTokenProvider.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L33)

###### Returns

`Promise`\<`string`\>

## Interfaces

### OidcTokenProviderConfig

Defined in: [02_Util/src/authorization/OidcTokenProvider.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L8)

#### Properties

| Property                                 | Type     | Defined in                                                                                                                                                                                        |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="audience"></a> `audience`         | `string` | [02_Util/src/authorization/OidcTokenProvider.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L12) |
| <a id="clientid"></a> `clientId`         | `string` | [02_Util/src/authorization/OidcTokenProvider.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L10) |
| <a id="clientsecret"></a> `clientSecret` | `string` | [02_Util/src/authorization/OidcTokenProvider.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L11) |
| <a id="tokenurl"></a> `tokenUrl`         | `string` | [02_Util/src/authorization/OidcTokenProvider.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/OidcTokenProvider.ts#L9)   |

[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/AuthenticatorFilter

# 02_Util/src/networkconnection/authenticator/AuthenticatorFilter

## Classes

### `abstract` AuthenticatorFilter

Defined in: [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L9)

#### Extended by

- [`BasicAuthenticationFilter`](BasicAuthenticationFilter.md#basicauthenticationfilter)
- [`ConnectedStationFilter`](ConnectedStationFilter.md#connectedstationfilter)
- [`NetworkProfileFilter`](NetworkProfileFilter.md#networkprofilefilter)
- [`UnknownStationFilter`](UnknownStationFilter.md#unknownstationfilter)

#### Constructors

##### Constructor

```ts
protected new AuthenticatorFilter(logger?): AuthenticatorFilter;
```

Defined in: [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L12)

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `logger?` | `Logger`\<`ILogObj`\> |

###### Returns

[`AuthenticatorFilter`](#abstract-authenticatorfilter)

#### Properties

| Property                       | Modifier    | Type                  | Defined in                                                                                                                                                                                                                                |
| ------------------------------ | ----------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger` | `protected` | `Logger`\<`ILogObj`\> | [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L10) |

#### Methods

##### authenticate()

```ts
authenticate(
   tenantId,
   identifier,
   request,
options): Promise<void>;
```

Defined in: [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L26)

###### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `tenantId`   | `number`                |
| `identifier` | `string`                |
| `request`    | `IncomingMessage`       |
| `options`    | `AuthenticationOptions` |

###### Returns

`Promise`\<`void`\>

##### filter()

```ts
abstract protected filter(
   tenantId,
   identifier,
   request,
options?): Promise<void>;
```

Defined in: [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L19)

###### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `tenantId`   | `number`                |
| `identifier` | `string`                |
| `request`    | `IncomingMessage`       |
| `options?`   | `AuthenticationOptions` |

###### Returns

`Promise`\<`void`\>

##### shouldFilter()

```ts
abstract protected shouldFilter(options): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L18)

###### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `options` | `AuthenticationOptions` |

###### Returns

`boolean`

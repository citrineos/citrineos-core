[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter

# 02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter

## Classes

### BasicAuthenticationFilter

Defined in: [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L19)

Filter used to authenticate incoming HTTP requests based on basic authorization header.
It only applies when the security profile is set to 1 or 2.

#### Extends

- [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter)

#### Constructors

##### Constructor

```ts
new BasicAuthenticationFilter(deviceModelRepository, logger?): BasicAuthenticationFilter;
```

Defined in: [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L22)

###### Parameters

| Parameter               | Type                     |
| ----------------------- | ------------------------ |
| `deviceModelRepository` | `IDeviceModelRepository` |
| `logger?`               | `Logger`\<`ILogObj`\>    |

###### Returns

[`BasicAuthenticationFilter`](#basicauthenticationfilter)

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`constructor`](AuthenticatorFilter.md#constructor)

#### Properties

| Property                                                     | Modifier    | Type                     | Inherited from                                                                                                           | Defined in                                                                                                                                                                                                                                            |
| ------------------------------------------------------------ | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository` | `private`   | `IDeviceModelRepository` | -                                                                                                                        | [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L20) |
| <a id="_logger"></a> `_logger`                               | `protected` | `Logger`\<`ILogObj`\>    | [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`_logger`](AuthenticatorFilter.md#_logger) | [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L10)             |

#### Methods

##### \_isPasswordValid()

```ts
private _isPasswordValid(
   tenantId,
   username,
password): Promise<boolean>;
```

Defined in: [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L49)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |
| `username` | `string` |
| `password` | `string` |

###### Returns

`Promise`\<`boolean`\>

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

###### Inherited from

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`authenticate`](AuthenticatorFilter.md#authenticate)

##### filter()

```ts
protected filter(
   tenantId,
   identifier,
request): Promise<void>;
```

Defined in: [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L34)

###### Parameters

| Parameter    | Type              |
| ------------ | ----------------- |
| `tenantId`   | `number`          |
| `identifier` | `string`          |
| `request`    | `IncomingMessage` |

###### Returns

`Promise`\<`void`\>

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`filter`](AuthenticatorFilter.md#filter)

##### shouldFilter()

```ts
protected shouldFilter(options): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/BasicAuthenticationFilter.ts#L27)

###### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `options` | `AuthenticationOptions` |

###### Returns

`boolean`

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`shouldFilter`](AuthenticatorFilter.md#shouldfilter)

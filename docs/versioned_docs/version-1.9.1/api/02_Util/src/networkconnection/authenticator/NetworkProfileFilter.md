[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/NetworkProfileFilter

# 02_Util/src/networkconnection/authenticator/NetworkProfileFilter

## Classes

### NetworkProfileFilter

Defined in: [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L17)

Filter used to block connections when charging stations attempt to connect to disallowed security profiles

#### Extends

- [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter)

#### Constructors

##### Constructor

```ts
new NetworkProfileFilter(deviceModelRepository, logger?): NetworkProfileFilter;
```

Defined in: [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L20)

###### Parameters

| Parameter               | Type                     |
| ----------------------- | ------------------------ |
| `deviceModelRepository` | `IDeviceModelRepository` |
| `logger?`               | `Logger`\<`ILogObj`\>    |

###### Returns

[`NetworkProfileFilter`](#networkprofilefilter)

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`constructor`](AuthenticatorFilter.md#constructor)

#### Properties

| Property                                                     | Modifier    | Type                     | Inherited from                                                                                                           | Defined in                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_devicemodelrepository"></a> `_deviceModelRepository` | `private`   | `IDeviceModelRepository` | -                                                                                                                        | [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L18) |
| <a id="_logger"></a> `_logger`                               | `protected` | `Logger`\<`ILogObj`\>    | [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`_logger`](AuthenticatorFilter.md#_logger) | [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L10)   |

#### Methods

##### \_isConfigurationSlotAllowed()

```ts
private _isConfigurationSlotAllowed(
   tenantId,
   identifier,
securityProfile): Promise<boolean>;
```

Defined in: [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L47)

###### Parameters

| Parameter         | Type     |
| ----------------- | -------- |
| `tenantId`        | `number` |
| `identifier`      | `string` |
| `securityProfile` | `number` |

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
   request,
options): Promise<void>;
```

Defined in: [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L29)

###### Parameters

| Parameter    | Type                    |
| ------------ | ----------------------- |
| `tenantId`   | `number`                |
| `identifier` | `string`                |
| `request`    | `IncomingMessage`       |
| `options`    | `AuthenticationOptions` |

###### Returns

`Promise`\<`void`\>

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`filter`](AuthenticatorFilter.md#filter)

##### shouldFilter()

```ts
protected shouldFilter(_options): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/NetworkProfileFilter.ts#L25)

###### Parameters

| Parameter  | Type                    |
| ---------- | ----------------------- |
| `_options` | `AuthenticationOptions` |

###### Returns

`boolean`

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`shouldFilter`](AuthenticatorFilter.md#shouldfilter)

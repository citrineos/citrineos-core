[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/ConnectedStationFilter

# 02_Util/src/networkconnection/authenticator/ConnectedStationFilter

## Classes

### ConnectedStationFilter

Defined in: [02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts#L15)

Filter used to prevent multiple simultaneous connections for the same charging station.

#### Extends

- [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter)

#### Constructors

##### Constructor

```ts
new ConnectedStationFilter(cache, logger?): ConnectedStationFilter;
```

Defined in: [02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts#L18)

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `cache`   | `ICache`              |
| `logger?` | `Logger`\<`ILogObj`\> |

###### Returns

[`ConnectedStationFilter`](#connectedstationfilter)

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`constructor`](AuthenticatorFilter.md#constructor)

#### Properties

| Property                       | Modifier    | Type                  | Inherited from                                                                                                           | Defined in                                                                                                                                                                                                                                      |
| ------------------------------ | ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_cache"></a> `_cache`   | `private`   | `ICache`              | -                                                                                                                        | [02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts#L16) |
| <a id="_logger"></a> `_logger` | `protected` | `Logger`\<`ILogObj`\> | [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`_logger`](AuthenticatorFilter.md#_logger) | [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L10)       |

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

###### Inherited from

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`authenticate`](AuthenticatorFilter.md#authenticate)

##### filter()

```ts
protected filter(
   tenantId,
   identifier,
_request): Promise<void>;
```

Defined in: [02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts#L27)

###### Parameters

| Parameter    | Type              |
| ------------ | ----------------- |
| `tenantId`   | `number`          |
| `identifier` | `string`          |
| `_request`   | `IncomingMessage` |

###### Returns

`Promise`\<`void`\>

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`filter`](AuthenticatorFilter.md#filter)

##### shouldFilter()

```ts
protected shouldFilter(_options): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/ConnectedStationFilter.ts#L23)

###### Parameters

| Parameter  | Type                    |
| ---------- | ----------------------- |
| `_options` | `AuthenticationOptions` |

###### Returns

`boolean`

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`shouldFilter`](AuthenticatorFilter.md#shouldfilter)

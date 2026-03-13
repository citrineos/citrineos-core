[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/UnknownStationFilter

# 02_Util/src/networkconnection/authenticator/UnknownStationFilter

## Classes

### UnknownStationFilter

Defined in: [02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts#L16)

Filter used to block connections from charging stations that are not recognized in the system.
It only applies when unknown charging stations are not allowed.

#### Extends

- [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter)

#### Constructors

##### Constructor

```ts
new UnknownStationFilter(locationRepository, logger?): UnknownStationFilter;
```

Defined in: [02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts#L19)

###### Parameters

| Parameter            | Type                  |
| -------------------- | --------------------- |
| `locationRepository` | `ILocationRepository` |
| `logger?`            | `Logger`\<`ILogObj`\> |

###### Returns

[`UnknownStationFilter`](#unknownstationfilter)

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`constructor`](AuthenticatorFilter.md#constructor)

#### Properties

| Property                                               | Modifier    | Type                  | Inherited from                                                                                                           | Defined in                                                                                                                                                                                                                                  |
| ------------------------------------------------------ | ----------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_locationrepository"></a> `_locationRepository` | `private`   | `ILocationRepository` | -                                                                                                                        | [02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts#L17) |
| <a id="_logger"></a> `_logger`                         | `protected` | `Logger`\<`ILogObj`\> | [`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`_logger`](AuthenticatorFilter.md#_logger) | [02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/AuthenticatorFilter.ts#L10)   |

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

Defined in: [02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts#L28)

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
protected shouldFilter(options): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/UnknownStationFilter.ts#L24)

###### Parameters

| Parameter | Type                    |
| --------- | ----------------------- |
| `options` | `AuthenticationOptions` |

###### Returns

`boolean`

###### Overrides

[`AuthenticatorFilter`](AuthenticatorFilter.md#abstract-authenticatorfilter).[`shouldFilter`](AuthenticatorFilter.md#shouldfilter)

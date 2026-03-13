[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/networkconnection/authenticator/Authenticator

# 02_Util/src/networkconnection/authenticator/Authenticator

## Classes

### Authenticator

Defined in: [02_Util/src/networkconnection/authenticator/Authenticator.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L14)

#### Implements

- `IAuthenticator`

#### Constructors

##### Constructor

```ts
new Authenticator(
   unknownStationFilter,
   connectedStationFilter,
   networkProfileFilter,
   basicAuthenticationFilter,
   logger?): Authenticator;
```

Defined in: [02_Util/src/networkconnection/authenticator/Authenticator.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L21)

###### Parameters

| Parameter                   | Type                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `unknownStationFilter`      | [`UnknownStationFilter`](UnknownStationFilter.md#unknownstationfilter)                |
| `connectedStationFilter`    | [`ConnectedStationFilter`](ConnectedStationFilter.md#connectedstationfilter)          |
| `networkProfileFilter`      | [`NetworkProfileFilter`](NetworkProfileFilter.md#networkprofilefilter)                |
| `basicAuthenticationFilter` | [`BasicAuthenticationFilter`](BasicAuthenticationFilter.md#basicauthenticationfilter) |
| `logger?`                   | `Logger`\<`ILogObj`\>                                                                 |

###### Returns

[`Authenticator`](#authenticator)

#### Properties

| Property                                                             | Modifier    | Type                                                                                  | Defined in                                                                                                                                                                                                                    |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_basicauthenticationfilter"></a> `_basicAuthenticationFilter` | `private`   | [`BasicAuthenticationFilter`](BasicAuthenticationFilter.md#basicauthenticationfilter) | [02_Util/src/networkconnection/authenticator/Authenticator.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L19) |
| <a id="_connectedstationfilter"></a> `_connectedStationFilter`       | `private`   | [`ConnectedStationFilter`](ConnectedStationFilter.md#connectedstationfilter)          | [02_Util/src/networkconnection/authenticator/Authenticator.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L17) |
| <a id="_logger"></a> `_logger`                                       | `protected` | `Logger`\<`ILogObj`\>                                                                 | [02_Util/src/networkconnection/authenticator/Authenticator.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L15) |
| <a id="_networkprofilefilter"></a> `_networkProfileFilter`           | `private`   | [`NetworkProfileFilter`](NetworkProfileFilter.md#networkprofilefilter)                | [02_Util/src/networkconnection/authenticator/Authenticator.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L18) |
| <a id="_unknownstationfilter"></a> `_unknownStationFilter`           | `private`   | [`UnknownStationFilter`](UnknownStationFilter.md#unknownstationfilter)                | [02_Util/src/networkconnection/authenticator/Authenticator.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L16) |

#### Methods

##### \_getClientIdFromUrl()

```ts
private _getClientIdFromUrl(url): string;
```

Defined in: [02_Util/src/networkconnection/authenticator/Authenticator.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L54)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `url`     | `string` |

###### Returns

`string`

##### authenticate()

```ts
authenticate(
   request,
   tenantId,
   options): Promise<{
  identifier: string;
}>;
```

Defined in: [02_Util/src/networkconnection/authenticator/Authenticator.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/Authenticator.ts#L37)

###### Parameters

| Parameter  | Type                    |
| ---------- | ----------------------- |
| `request`  | `IncomingMessage`       |
| `tenantId` | `number`                |
| `options`  | `AuthenticationOptions` |

###### Returns

`Promise`\<\{
`identifier`: `string`;
\}\>

###### Implementation of

```ts
IAuthenticator.authenticate;
```

[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/authorization/provider/LocalByPassAuthProvider

# 02_Util/src/authorization/provider/LocalByPassAuthProvider

## Classes

### LocalBypassAuthProvider

Defined in: [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L15)

A local bypass authentication provider that doesn't perform actual authentication
Only for development and testing environments

#### Implements

- `IApiAuthProvider`

#### Constructors

##### Constructor

```ts
new LocalBypassAuthProvider(logger?): LocalBypassAuthProvider;
```

Defined in: [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L23)

Creates a new local bypass authentication provider

###### Parameters

| Parameter | Type                  | Description              |
| --------- | --------------------- | ------------------------ |
| `logger?` | `Logger`\<`ILogObj`\> | Optional logger instance |

###### Returns

[`LocalBypassAuthProvider`](#localbypassauthprovider)

#### Properties

| Property                       | Modifier  | Type                  | Defined in                                                                                                                                                                                                                      |
| ------------------------------ | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger` | `private` | `Logger`\<`ILogObj`\> | [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L16) |

#### Methods

##### authenticateToken()

```ts
authenticateToken(_token): Promise<ApiAuthenticationResult>;
```

Defined in: [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L45)

Always returns a successful authentication with admin user

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `_token`  | `string` |

###### Returns

`Promise`\<`ApiAuthenticationResult`\>

Authentication result with admin user info

###### Implementation of

```ts
IApiAuthProvider.authenticateToken;
```

##### authorizeUser()

```ts
authorizeUser(user, request): Promise<ApiAuthorizationResult>;
```

Defined in: [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L73)

Always returns a successful authorization

###### Parameters

| Parameter | Type             | Description                 |
| --------- | ---------------- | --------------------------- |
| `user`    | `UserInfo`       | Ignored, can be any user    |
| `request` | `FastifyRequest` | Ignored, can be any request |

###### Returns

`Promise`\<`ApiAuthorizationResult`\>

Always successful authorization

###### Implementation of

```ts
IApiAuthProvider.authorizeUser;
```

##### extractToken()

```ts
extractToken(_request): Promise<string>;
```

Defined in: [02_Util/src/authorization/provider/LocalByPassAuthProvider.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/LocalByPassAuthProvider.ts#L33)

Extracts the authentication token from the request

###### Parameters

| Parameter  | Type             |
| ---------- | ---------------- |
| `_request` | `FastifyRequest` |

###### Returns

`Promise`\<`string`\>

###### Implementation of

```ts
IApiAuthProvider.extractToken;
```

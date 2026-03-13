[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/authorization/provider/OIDCAuthProvider

# 02_Util/src/authorization/provider/OIDCAuthProvider

## Classes

### OIDCAuthProvider

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L37)

OIDC authentication provider implementation

#### Implements

- `IApiAuthProvider`

#### Constructors

##### Constructor

```ts
new OIDCAuthProvider(config, logger?): OIDCAuthProvider;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L50)

Creates a new Keycloak authentication provider

###### Parameters

| Parameter | Type                        | Description              |
| --------- | --------------------------- | ------------------------ |
| `config`  | [`OIDCConfig`](#oidcconfig) | OIDC configuration       |
| `logger?` | `Logger`\<`ILogObj`\>       | Optional logger instance |

###### Returns

[`OIDCAuthProvider`](#oidcauthprovider)

#### Properties

| Property                                         | Modifier  | Type                                                            | Default value | Defined in                                                                                                                                                                                                        |
| ------------------------------------------------ | --------- | --------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_config"></a> `_config`                   | `private` | [`OIDCConfig`](#oidcconfig)                                     | `undefined`   | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L38) |
| <a id="_defaulttenantid"></a> `_defaultTenantId` | `private` | `string`                                                        | `'1'`         | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L42) |
| <a id="_jkwsclient"></a> `_jkwsClient`           | `private` | `JwksClient`                                                    | `undefined`   | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L40) |
| <a id="_logger"></a> `_logger`                   | `private` | `Logger`\<`ILogObj`\>                                           | `undefined`   | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L39) |
| <a id="_rulesloader"></a> `_rulesLoader`         | `private` | [`RbacRulesLoader`](../rbac/RbacRulesLoader.md#rbacrulesloader) | `undefined`   | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L41) |

#### Methods

##### authenticateToken()

```ts
authenticateToken(token): Promise<ApiAuthenticationResult>;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L96)

Authenticates a JWT token from and OIDC provider

###### Parameters

| Parameter | Type     | Description               |
| --------- | -------- | ------------------------- |
| `token`   | `string` | JWT token to authenticate |

###### Returns

`Promise`\<`ApiAuthenticationResult`\>

Authentication result with user info if successful

###### Implementation of

```ts
IApiAuthProvider.authenticateToken;
```

##### authorizeUser()

```ts
authorizeUser(user, request): Promise<ApiAuthorizationResult>;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L141)

Authorizes a user for a specific request
This implementation checks if the user has the required permissions
for the requested URL and method

###### Parameters

| Parameter | Type             | Description      |
| --------- | ---------------- | ---------------- |
| `user`    | `UserInfo`       | User information |
| `request` | `FastifyRequest` | Fastify request  |

###### Returns

`Promise`\<`ApiAuthorizationResult`\>

Authorization result

###### Implementation of

```ts
IApiAuthProvider.authorizeUser;
```

##### extractRoles()

```ts
private extractRoles(decoded): string[];
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:215](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L215)

Extracts roles from a decoded JWT token

###### Parameters

| Parameter | Type  | Description           |
| --------- | ----- | --------------------- |
| `decoded` | `any` | The decoded JWT token |

###### Returns

`string`[]

Array of role strings

##### extractToken()

```ts
extractToken(request): Promise<string | null>;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L76)

Extracts the authentication token from the request

###### Parameters

| Parameter | Type             | Description |
| --------- | ---------------- | ----------- |
| `request` | `FastifyRequest` | -           |

###### Returns

`Promise`\<`string` \| `null`\>

###### Implementation of

```ts
IApiAuthProvider.extractToken;
```

##### fetchPublicKey()

```ts
private fetchPublicKey(kid): Promise<string>;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:177](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L177)

Fetches the public key from OIDC provider

###### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `kid`     | `string` | Key ID from the JWT header |

###### Returns

`Promise`\<`string`\>

Public key as a string

##### userHasRequiredRole()

```ts
private userHasRequiredRole(user, requiredRoles): boolean;
```

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:227](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L227)

Check if a user has any of the required roles for a specific tenant

###### Parameters

| Parameter       | Type       | Description                                 |
| --------------- | ---------- | ------------------------------------------- |
| `user`          | `UserInfo` | User with roles                             |
| `requiredRoles` | `string`[] | Array of role names (without tenant prefix) |

###### Returns

`boolean`

True if user has any of the required roles

## Interfaces

### OIDCConfig

Defined in: [02_Util/src/authorization/provider/OIDCAuthProvider.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L17)

#### Properties

| Property                            | Type      | Defined in                                                                                                                                                                                                        |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="audience"></a> `audience?`   | `string`  | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L25) |
| <a id="cachetime"></a> `cacheTime?` | `number`  | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L28) |
| <a id="issuer"></a> `issuer`        | `string`  | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L22) |
| <a id="jwksuri"></a> `jwksUri`      | `string`  | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L19) |
| <a id="ratelimit"></a> `rateLimit?` | `boolean` | [02_Util/src/authorization/provider/OIDCAuthProvider.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/provider/OIDCAuthProvider.ts#L31) |

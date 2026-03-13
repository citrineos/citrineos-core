[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/auth/IApiAuthProvider

# 00_Base/src/interfaces/api/auth/IApiAuthProvider

## Interfaces

### IApiAuthProvider

Defined in: [00_Base/src/interfaces/api/auth/IApiAuthProvider.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/IApiAuthProvider.ts#L12)

Interface for authentication providers

#### Methods

##### authenticateToken()

```ts
authenticateToken(token): Promise<ApiAuthenticationResult>;
```

Defined in: [00_Base/src/interfaces/api/auth/IApiAuthProvider.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/IApiAuthProvider.ts#L25)

Authenticates a token and extracts user information

###### Parameters

| Parameter | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| `token`   | `string` | JWT or other token to authenticate |

###### Returns

`Promise`\<[`ApiAuthenticationResult`](ApiAuthenticationResult.md#apiauthenticationresult)\>

Authentication result with user info if successful

##### authorizeUser()

```ts
authorizeUser(user, request): Promise<ApiAuthorizationResult>;
```

Defined in: [00_Base/src/interfaces/api/auth/IApiAuthProvider.ts:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/IApiAuthProvider.ts#L34)

Authorizes a user for a specific request

###### Parameters

| Parameter | Type                               | Description      |
| --------- | ---------------------------------- | ---------------- |
| `user`    | [`UserInfo`](UserInfo.md#userinfo) | User information |
| `request` | `FastifyRequest`                   | Fastify request  |

###### Returns

`Promise`\<[`ApiAuthorizationResult`](ApiAuthorizationResult.md#apiauthorizationresult)\>

Authorization result

##### extractToken()

```ts
extractToken(request): Promise<string | null>;
```

Defined in: [00_Base/src/interfaces/api/auth/IApiAuthProvider.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/IApiAuthProvider.ts#L17)

Extracts the authentication token from the request

###### Parameters

| Parameter | Type             | Description |
| --------- | ---------------- | ----------- |
| `request` | `FastifyRequest` | -           |

###### Returns

`Promise`\<`string` \| `null`\>

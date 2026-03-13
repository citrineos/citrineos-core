[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/auth/ApiAuthenticationResult

# 00_Base/src/interfaces/api/auth/ApiAuthenticationResult

## Classes

### ApiAuthenticationResult

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L10)

Result of authentication process

#### Constructors

##### Constructor

```ts
new ApiAuthenticationResult(): ApiAuthenticationResult;
```

###### Returns

[`ApiAuthenticationResult`](#apiauthenticationresult)

#### Properties

| Property                                       | Type                               | Default value | Description                                       | Defined in                                                                                                                                                                                                                |
| ---------------------------------------------- | ---------------------------------- | ------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="error"></a> `error?`                    | `string`                           | `undefined`   | Error message if authentication failed            | [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L24) |
| <a id="isauthenticated"></a> `isAuthenticated` | `boolean`                          | `false`       | Whether authentication was successful             | [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L14) |
| <a id="user"></a> `user?`                      | [`UserInfo`](UserInfo.md#userinfo) | `undefined`   | User information if authentication was successful | [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L19) |

#### Methods

##### failure()

```ts
static failure(error): ApiAuthenticationResult;
```

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L45)

Creates a new failed authentication result

###### Parameters

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| `error`   | `string` | Error message |

###### Returns

[`ApiAuthenticationResult`](#apiauthenticationresult)

Authentication result

##### success()

```ts
static success(user): ApiAuthenticationResult;
```

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthenticationResult.ts#L32)

Creates a new successful authentication result

###### Parameters

| Parameter | Type                               | Description                    |
| --------- | ---------------------------------- | ------------------------------ |
| `user`    | [`UserInfo`](UserInfo.md#userinfo) | Authenticated user information |

###### Returns

[`ApiAuthenticationResult`](#apiauthenticationresult)

Authentication result

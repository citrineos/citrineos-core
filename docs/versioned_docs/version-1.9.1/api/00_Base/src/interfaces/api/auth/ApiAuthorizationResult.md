[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/auth/ApiAuthorizationResult

# 00_Base/src/interfaces/api/auth/ApiAuthorizationResult

## Classes

### ApiAuthorizationResult

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts#L8)

Result of authorization process

#### Constructors

##### Constructor

```ts
new ApiAuthorizationResult(): ApiAuthorizationResult;
```

###### Returns

[`ApiAuthorizationResult`](#apiauthorizationresult)

#### Properties

| Property                                 | Type      | Default value | Description                           | Defined in                                                                                                                                                                                                              |
| ---------------------------------------- | --------- | ------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="error"></a> `error?`              | `string`  | `undefined`   | Error message if authorization failed | [00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts#L17) |
| <a id="isauthorized"></a> `isAuthorized` | `boolean` | `false`       | Whether authorization was successful  | [00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts#L12) |

#### Methods

##### failure()

```ts
static failure(error): ApiAuthorizationResult;
```

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts#L36)

Creates a new failed authorization result

###### Parameters

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| `error`   | `string` | Error message |

###### Returns

[`ApiAuthorizationResult`](#apiauthorizationresult)

Authorization result

##### success()

```ts
static success(): ApiAuthorizationResult;
```

Defined in: [00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/ApiAuthorizationResult.ts#L24)

Creates a new successful authorization result

###### Returns

[`ApiAuthorizationResult`](#apiauthorizationresult)

Authorization result

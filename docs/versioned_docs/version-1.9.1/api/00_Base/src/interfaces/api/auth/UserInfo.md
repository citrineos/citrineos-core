[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/auth/UserInfo

# 00_Base/src/interfaces/api/auth/UserInfo

## Interfaces

### UserInfo

Defined in: [00_Base/src/interfaces/api/auth/UserInfo.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L8)

Interface for user information extracted from authentication tokens

#### Indexable

```ts
[key: string]: any
```

Additional fields associated with the user

#### Properties

| Property                         | Type       | Description                         | Defined in                                                                                                                                                                                  |
| -------------------------------- | ---------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="email"></a> `email`       | `string`   | The user email.                     | [00_Base/src/interfaces/api/auth/UserInfo.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L22) |
| <a id="id"></a> `id`             | `string`   | The user ID.                        | [00_Base/src/interfaces/api/auth/UserInfo.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L12) |
| <a id="name"></a> `name`         | `string`   | The username.                       | [00_Base/src/interfaces/api/auth/UserInfo.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L17) |
| <a id="roles"></a> `roles`       | `string`[] | The user roles.                     | [00_Base/src/interfaces/api/auth/UserInfo.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L27) |
| <a id="tenantid"></a> `tenantId` | `string`   | Tenant ID associated with the user. | [00_Base/src/interfaces/api/auth/UserInfo.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/auth/UserInfo.ts#L32) |

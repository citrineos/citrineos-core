[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/interfaces/tenant

# 00_Base/src/interfaces/tenant

## Classes

### TenantContextManager

Defined in: [00_Base/src/interfaces/tenant.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/tenant.ts#L4)

#### Constructors

##### Constructor

```ts
new TenantContextManager(): TenantContextManager;
```

###### Returns

[`TenantContextManager`](#tenantcontextmanager)

#### Properties

| Property                                 | Modifier  | Type        | Default value | Defined in                                                                                                                                                          |
| ---------------------------------------- | --------- | ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="schemaprefix"></a> `schemaPrefix` | `private` | `"tenant_"` | `'tenant_'`   | [00_Base/src/interfaces/tenant.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/tenant.ts#L5) |

#### Methods

##### getSchemaForTenant()

```ts
static getSchemaForTenant(tenantId): string;
```

Defined in: [00_Base/src/interfaces/tenant.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/tenant.ts#L7)

###### Parameters

| Parameter  | Type     |
| ---------- | -------- |
| `tenantId` | `number` |

###### Returns

`string`

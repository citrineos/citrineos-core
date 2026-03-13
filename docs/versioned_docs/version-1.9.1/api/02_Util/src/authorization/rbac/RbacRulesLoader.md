[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/authorization/rbac/RbacRulesLoader

# 02_Util/src/authorization/rbac/RbacRulesLoader

## Classes

### RbacRulesLoader

Defined in: [02_Util/src/authorization/rbac/RbacRulesLoader.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L15)

Class to load and validate RBAC rules

#### Constructors

##### Constructor

```ts
new RbacRulesLoader(rulesFilePath, logger): RbacRulesLoader;
```

Defined in: [02_Util/src/authorization/rbac/RbacRulesLoader.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L25)

Creates a new RBAC rules loader

###### Parameters

| Parameter       | Type                  | Description                 |
| --------------- | --------------------- | --------------------------- |
| `rulesFilePath` | `string`              | Path to the JSON rules file |
| `logger`        | `Logger`\<`ILogObj`\> | Logger instance             |

###### Returns

[`RbacRulesLoader`](#rbacrulesloader)

#### Properties

| Property                       | Modifier  | Type                  | Default value | Defined in                                                                                                                                                                                              |
| ------------------------------ | --------- | --------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_logger"></a> `_logger` | `private` | `Logger`\<`ILogObj`\> | `undefined`   | [02_Util/src/authorization/rbac/RbacRulesLoader.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L17) |
| <a id="_rules"></a> `_rules`   | `private` | `RbacRules`           | `{}`          | [02_Util/src/authorization/rbac/RbacRulesLoader.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L16) |

#### Methods

##### getRequiredRoles()

```ts
getRequiredRoles(
   tenantId,
   url,
   method): string[] | null;
```

Defined in: [02_Util/src/authorization/rbac/RbacRulesLoader.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L78)

Get the required roles for a specific tenant, URL, and HTTP method

###### Parameters

| Parameter  | Type     | Description       |
| ---------- | -------- | ----------------- |
| `tenantId` | `string` | Tenant identifier |
| `url`      | `string` | URL path          |
| `method`   | `string` | HTTP method       |

###### Returns

`string`[] \| `null`

Array of required roles or null if no matching rule

##### loadRules()

```ts
private loadRules(filePath): void;
```

Defined in: [02_Util/src/authorization/rbac/RbacRulesLoader.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L35)

Load and validate rules from a JSON file

###### Parameters

| Parameter  | Type     | Description                 |
| ---------- | -------- | --------------------------- |
| `filePath` | `string` | Path to the JSON rules file |

###### Returns

`void`

##### normalizeUrl()

```ts
private normalizeUrl(url): string;
```

Defined in: [02_Util/src/authorization/rbac/RbacRulesLoader.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/RbacRulesLoader.ts#L107)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `url`     | `string` |

###### Returns

`string`

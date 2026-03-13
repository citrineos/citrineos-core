[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/authorization/rbac/UrlMatcher

# 02_Util/src/authorization/rbac/UrlMatcher

## Classes

### UrlMatcher

Defined in: [02_Util/src/authorization/rbac/UrlMatcher.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/UrlMatcher.ts#L7)

Utility for matching URLs against patterns

#### Constructors

##### Constructor

```ts
new UrlMatcher(): UrlMatcher;
```

###### Returns

[`UrlMatcher`](#urlmatcher)

#### Methods

##### match()

```ts
static match(url, pattern): boolean;
```

Defined in: [02_Util/src/authorization/rbac/UrlMatcher.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/authorization/rbac/UrlMatcher.ts#L16)

Check if a URL matches a pattern
Supports exact matches, wildcards, and path parameters

###### Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| `url`     | `string` | URL to check             |
| `pattern` | `string` | Pattern to match against |

###### Returns

`boolean`

True if URL matches pattern

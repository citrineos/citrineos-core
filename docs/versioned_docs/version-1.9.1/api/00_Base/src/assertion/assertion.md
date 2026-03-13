[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/assertion/assertion

# 00_Base/src/assertion/assertion

## Functions

### assert()

```ts
function assert(predicate, message?): asserts predicate;
```

Defined in: [00_Base/src/assertion/assertion.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/assertion/assertion.ts#L4)

#### Parameters

| Parameter   | Type                         |
| ----------- | ---------------------------- |
| `predicate` | `boolean` \| () => `boolean` |
| `message?`  | `string`                     |

#### Returns

`asserts predicate`

---

### deepDirectionalEqual()

```ts
function deepDirectionalEqual(obj1, obj2, seenObjects?): boolean;
```

Defined in: [00_Base/src/assertion/assertion.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/assertion/assertion.ts#L36)

Ensures that obj2 contains all keys from obj1.

#### Parameters

| Parameter     | Type                  | Description |
| ------------- | --------------------- | ----------- |
| `obj1`        | `any`                 | -           |
| `obj2`        | `any`                 | -           |
| `seenObjects` | `WeakSet`\<`object`\> | -           |

#### Returns

`boolean`

---

### notNull()

```ts
function notNull(object): boolean;
```

Defined in: [00_Base/src/assertion/assertion.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/assertion/assertion.ts#L25)

#### Parameters

| Parameter | Type  |
| --------- | ----- |
| `object`  | `any` |

#### Returns

`boolean`

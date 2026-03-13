[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/AsMessageEndpoint

# 00_Base/src/interfaces/api/AsMessageEndpoint

## Functions

### AsMessageEndpoint()

```ts
function AsMessageEndpoint(
  action,
  bodySchema,
  optionalQuerystrings?,
): (target, propertyKey, descriptor) => void;
```

Defined in: [00_Base/src/interfaces/api/AsMessageEndpoint.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AsMessageEndpoint.ts#L17)

Decorator for use in module API class to expose methods as REST OCPP message endpoints.

#### Parameters

| Parameter               | Type                                                 | Description                |
| ----------------------- | ---------------------------------------------------- | -------------------------- |
| `action`                | [`CallAction`](../../ocpp/rpc/message.md#callaction) | The call action.           |
| `bodySchema`            | `object`                                             | The body schema.           |
| `optionalQuerystrings?` | `Record`\<`string`, `any`\>                          | The optional querystrings. |

#### Returns

This function does not return anything.

```ts
(
   target,
   propertyKey,
   descriptor): void;
```

##### Parameters

| Parameter     | Type                 |
| ------------- | -------------------- |
| `target`      | `any`                |
| `propertyKey` | `string`             |
| `descriptor`  | `PropertyDescriptor` |

##### Returns

`void`

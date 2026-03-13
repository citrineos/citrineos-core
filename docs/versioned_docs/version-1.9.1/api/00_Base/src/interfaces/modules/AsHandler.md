[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/modules/AsHandler

# 00_Base/src/interfaces/modules/AsHandler

## Variables

### AS_HANDLER_METADATA

```ts
const AS_HANDLER_METADATA: 'AS_HANDLER_METADATA' = 'AS_HANDLER_METADATA';
```

Defined in: [00_Base/src/interfaces/modules/AsHandler.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/AsHandler.ts#L13)

Decorators for module components.

## Functions

### AsHandler()

```ts
function AsHandler(protocol, action): (target, propertyKey, descriptor) => PropertyDescriptor;
```

Defined in: [00_Base/src/interfaces/modules/AsHandler.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/AsHandler.ts#L21)

Decorator function for OCPP modules to expose methods within module classes as handlers for given call action.

#### Parameters

| Parameter  | Type                                                   | Description               |
| ---------- | ------------------------------------------------------ | ------------------------- |
| `protocol` | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion) | -                         |
| `action`   | [`CallAction`](../../ocpp/rpc/message.md#callaction)   | the call action parameter |

#### Returns

- the property descriptor

```ts
(
   target,
   propertyKey,
   descriptor): PropertyDescriptor;
```

##### Parameters

| Parameter     | Type                 |
| ------------- | -------------------- |
| `target`      | `any`                |
| `propertyKey` | `string`             |
| `descriptor`  | `PropertyDescriptor` |

##### Returns

`PropertyDescriptor`

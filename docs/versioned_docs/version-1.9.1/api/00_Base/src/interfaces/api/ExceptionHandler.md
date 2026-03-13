[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/ExceptionHandler

# 00_Base/src/interfaces/api/ExceptionHandler

## Interfaces

### ExceptionHandler

Defined in: [00_Base/src/interfaces/api/ExceptionHandler.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/ExceptionHandler.ts#L6)

#### Methods

##### handle()

```ts
handle(
   error,
   request,
   reply): void;
```

Defined in: [00_Base/src/interfaces/api/ExceptionHandler.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/ExceptionHandler.ts#L7)

###### Parameters

| Parameter | Type             |
| --------- | ---------------- |
| `error`   | `FastifyError`   |
| `request` | `FastifyRequest` |
| `reply`   | `FastifyReply`   |

###### Returns

`void`

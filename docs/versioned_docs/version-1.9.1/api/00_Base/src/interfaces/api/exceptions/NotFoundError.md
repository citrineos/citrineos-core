[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/exceptions/NotFoundError

# 00_Base/src/interfaces/api/exceptions/NotFoundError

## Classes

### NotFoundError

Defined in: [00_Base/src/interfaces/api/exceptions/NotFoundError.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/NotFoundError.ts#L4)

#### Extends

- `Error`

#### Constructors

##### Constructor

```ts
new NotFoundError(message): NotFoundError;
```

Defined in: [00_Base/src/interfaces/api/exceptions/NotFoundError.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/NotFoundError.ts#L6)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `message` | `string` |

###### Returns

[`NotFoundError`](#notfounderror)

###### Overrides

```ts
Error.constructor;
```

#### Properties

| Property                             | Type     | Default value | Defined in                                                                                                                                                                                                      |
| ------------------------------------ | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="statuscode"></a> `statusCode` | `number` | `404`         | [00_Base/src/interfaces/api/exceptions/NotFoundError.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/NotFoundError.ts#L5) |

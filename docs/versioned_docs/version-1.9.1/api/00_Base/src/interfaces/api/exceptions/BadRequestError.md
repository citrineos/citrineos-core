[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 00_Base/src/interfaces/api/exceptions/BadRequestError

# 00_Base/src/interfaces/api/exceptions/BadRequestError

## Classes

### BadRequestError

Defined in: [00_Base/src/interfaces/api/exceptions/BadRequestError.ts:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/BadRequestError.ts#L4)

#### Extends

- `Error`

#### Constructors

##### Constructor

```ts
new BadRequestError(message): BadRequestError;
```

Defined in: [00_Base/src/interfaces/api/exceptions/BadRequestError.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/BadRequestError.ts#L6)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `message` | `string` |

###### Returns

[`BadRequestError`](#badrequesterror)

###### Overrides

```ts
Error.constructor;
```

#### Properties

| Property                             | Type     | Default value | Defined in                                                                                                                                                                                                          |
| ------------------------------------ | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="statuscode"></a> `statusCode` | `number` | `400`         | [00_Base/src/interfaces/api/exceptions/BadRequestError.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/exceptions/BadRequestError.ts#L5) |

[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/util/RequestOperations

# 02_Util/src/util/RequestOperations

## Functions

### extractBasicCredentials()

```ts
function extractBasicCredentials(req): object;
```

Defined in: [02_Util/src/util/RequestOperations.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/RequestOperations.ts#L16)

Extracts credentials from the Authorization header.

The Authorization header is formatted as follows:
AUTHORIZATION: Basic <Base64 encoded(<Configured ChargingStationId>:<Configured BasicAuthPassword>)>

#### Parameters

| Parameter | Type              | Description         |
| --------- | ----------------- | ------------------- |
| `req`     | `IncomingMessage` | The request object. |

#### Returns

`object`

Extracted credentials.

| Name        | Type     | Defined in                                                                                                                                                                      |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `password?` | `string` | [02_Util/src/util/RequestOperations.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/RequestOperations.ts#L18) |
| `username?` | `string` | [02_Util/src/util/RequestOperations.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/RequestOperations.ts#L17) |

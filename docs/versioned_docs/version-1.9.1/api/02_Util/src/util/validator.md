[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 02_Util/src/util/validator

# 02_Util/src/util/validator

## Interfaces

### ValidationResult

Defined in: [02_Util/src/util/validator.ts:307](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L307)

Generic validation result for all validators

#### Properties

| Property                                  | Type      | Defined in                                                                                                                                                        |
| ----------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="errormessage"></a> `errorMessage?` | `string`  | [02_Util/src/util/validator.ts:309](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L309) |
| <a id="isvalid"></a> `isValid`            | `boolean` | [02_Util/src/util/validator.ts:308](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L308) |

## Functions

### validateASCIIContent()

```ts
function validateASCIIContent(content): boolean;
```

Defined in: [02_Util/src/util/validator.ts:410](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L410)

Validate ASCII content - only printable ASCII allowed (characters 32-126)

#### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `content` | `string` | Content string to validate |

#### Returns

`boolean`

true if content contains only printable ASCII characters

---

### validateChargingProfileType()

```ts
function validateChargingProfileType(
  chargingProfileType,
  tenantId,
  stationId,
  deviceModelRepository,
  chargingProfileRepository,
  transactionEventRepository,
  logger,
  evseId?,
): Promise<void>;
```

Defined in: [02_Util/src/util/validator.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L46)

Validate constraints of ChargingProfileType defined in OCPP 2.0.1

#### Parameters

| Parameter                    | Type                          | Description                          |
| ---------------------------- | ----------------------------- | ------------------------------------ |
| `chargingProfileType`        | `ChargingProfileType`         | ChargingProfileType from the request |
| `tenantId`                   | `number`                      | tenant id the profile belongs to     |
| `stationId`                  | `string`                      | station id                           |
| `deviceModelRepository`      | `IDeviceModelRepository`      | deviceModelRepository                |
| `chargingProfileRepository`  | `IChargingProfileRepository`  | chargingProfileRepository            |
| `transactionEventRepository` | `ITransactionEventRepository` | transactionEventRepository           |
| `logger`                     | `Logger`\<`ILogObj`\>         | logger                               |
| `evseId?`                    | `number` \| `null`            | evse id                              |

#### Returns

`Promise`\<`void`\>

---

### validateEMAIDIdToken()

```ts
function validateEMAIDIdToken(emaid): string[];
```

Defined in: [02_Util/src/util/validator.ts:220](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L220)

Validates an eMAID string according to eMI³ specifications

#### Parameters

| Parameter | Type     | Description                  |
| --------- | -------- | ---------------------------- |
| `emaid`   | `string` | The eMAID string to validate |

#### Returns

`string`[]

errors - String array with errors, empty if valid

---

### validateHTMLContent()

```ts
function validateHTMLContent(content): boolean;
```

Defined in: [02_Util/src/util/validator.ts:421](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L421)

Validate HTML content - checks for basic HTML structure validity

#### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `content` | `string` | Content string to validate |

#### Returns

`boolean`

true if content appears to be valid HTML

---

### validateIdentifierStringIdToken()

```ts
function validateIdentifierStringIdToken(idToken): boolean;
```

Defined in: [02_Util/src/util/validator.ts:211](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L211)

Validate identifier string format per OCPP 2.0.1. We expect this validation already from the JSON schema,
but we add this extra validation to be sure.
Only allows: a-z, A-Z, 0-9, \*, -, \_, =, :, +, |, @, .

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `idToken` | `string` |

#### Returns

`boolean`

---

### validateIdToken()

```ts
function validateIdToken(idTokenType, idToken): ValidationResult;
```

Defined in: [02_Util/src/util/validator.ts:316](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L316)

ID token validator - routes to appropriate validator based on type
Returns validation result with detailed error message if invalid

#### Parameters

| Parameter     | Type              |
| ------------- | ----------------- |
| `idTokenType` | `IdTokenEnumType` |
| `idToken`     | `string`          |

#### Returns

[`ValidationResult`](#validationresult)

---

### validateISO14443IdToken()

```ts
function validateISO14443IdToken(idToken): boolean;
```

Defined in: [02_Util/src/util/validator.ts:200](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L200)

Validate ISO14443 ID token format
ISO 14443 UID should be 4 or 7 bytes (8 or 14 hex characters)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `idToken` | `string` |

#### Returns

`boolean`

---

### validateISO15693IdToken()

```ts
function validateISO15693IdToken(idToken): boolean;
```

Defined in: [02_Util/src/util/validator.ts:192](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L192)

Validate ISO15693 ID token format
ISO 15693 UID should be exactly 8 bytes (16 hex characters)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `idToken` | `string` |

#### Returns

`boolean`

---

### validateLanguageTag()

```ts
function validateLanguageTag(languageTag): boolean;
```

Defined in: [02_Util/src/util/validator.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L24)

Validate a language tag is an RFC-5646 tag, see: [https://tools.ietf.org/html/rfc5646](https://tools.ietf.org/html/rfc5646),
example: US English is: "en-US"

#### Parameters

| Parameter     | Type     | Description |
| ------------- | -------- | ----------- |
| `languageTag` | `string` | -           |

#### Returns

`boolean`

true if the languageTag is an RFC-5646 tag

---

### validateMessageContent()

```ts
function validateMessageContent(format, content): ValidationResult;
```

Defined in: [02_Util/src/util/validator.ts:535](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L535)

Message content validator - routes to appropriate validator based on format
Returns validation result with detailed error message if invalid

#### Parameters

| Parameter | Type                    | Description                                  |
| --------- | ----------------------- | -------------------------------------------- |
| `format`  | `MessageFormatEnumType` | Message format type (ASCII, HTML, URI, UTF8) |
| `content` | `string`                | Message content to validate                  |

#### Returns

[`ValidationResult`](#validationresult)

Validation result with error message if invalid

---

### validateMessageContentType()

```ts
function validateMessageContentType(messageContent): ValidationResult;
```

Defined in: [02_Util/src/util/validator.ts:592](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L592)

Validate a complete MessageContentType object
Convenience function that validates both language tag (if present) and content against format

#### Parameters

| Parameter        | Type                 | Description                           |
| ---------------- | -------------------- | ------------------------------------- |
| `messageContent` | `MessageContentType` | MessageContentType object to validate |

#### Returns

[`ValidationResult`](#validationresult)

Validation result with error message if invalid

---

### validateNoAuthorizationIdToken()

```ts
function validateNoAuthorizationIdToken(idToken): boolean;
```

Defined in: [02_Util/src/util/validator.ts:300](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L300)

Validate NoAuthorization ID token (should be empty)

#### Parameters

| Parameter | Type     |
| --------- | -------- |
| `idToken` | `string` |

#### Returns

`boolean`

---

### validatePEMEncodedCSR()

```ts
function validatePEMEncodedCSR(csr): ValidationResult;
```

Defined in: [02_Util/src/util/validator.ts:613](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L613)

Validate PEM-encoded Certificate Signing Request (CSR)
According to RFC 2986, CSR must be PEM-encoded with proper headers and valid base64 content

#### Parameters

| Parameter | Type     | Description            |
| --------- | -------- | ---------------------- |
| `csr`     | `string` | CSR string to validate |

#### Returns

[`ValidationResult`](#validationresult)

Validation result with error message if invalid

---

### validateURIContent()

```ts
function validateURIContent(content): boolean;
```

Defined in: [02_Util/src/util/validator.ts:479](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L479)

Validate URI content - checks if content is a valid URI

#### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `content` | `string` | Content string to validate |

#### Returns

`boolean`

true if content is a valid URI

---

### validateUTF8Content()

```ts
function validateUTF8Content(content): boolean;
```

Defined in: [02_Util/src/util/validator.ts:501](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/util/validator.ts#L501)

Validate UTF-8 content - in JavaScript, strings are already UTF-16 encoded
This function checks for invalid surrogate pairs and control characters

#### Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `content` | `string` | Content string to validate |

#### Returns

`boolean`

true if content is valid UTF-8

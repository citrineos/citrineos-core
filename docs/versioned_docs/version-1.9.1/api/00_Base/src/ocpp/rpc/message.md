[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/ocpp/rpc/message

# 00_Base/src/ocpp/rpc/message

## Enumerations

### ErrorCode

Defined in: [00_Base/src/ocpp/rpc/message.ts:168](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L168)

Error codes for CallError message (4.3 RPC Framework Error Codes)

#### Enumeration Members

##### FormationViolation

```ts
FormationViolation: 'FormationViolation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:176](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L176)

Payload for Action is syntactically incorrect (OCPP 1.6 only, see FormatViolation for OCPP 2.0.1)

##### FormatViolation

```ts
FormatViolation: 'FormatViolation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:172](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L172)

Payload for Action is syntactically incorrect (OCPP 2.0.1 only, see FormationViolation for OCPP 1.6)

##### GenericError

```ts
GenericError: 'GenericError';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:188](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L188)

Any other error not covered by the more specific error codes in this table

##### InternalError

```ts
InternalError: 'InternalError';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:192](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L192)

An internal error occurred and the receiver was not able to process the requested Action successfully

##### MessageTypeNotSupported

```ts
MessageTypeNotSupported: 'MessageTypeNotSupported';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:196](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L196)

A message with a Message Type Number received that is not supported by this implementation.

##### NotImplemented

```ts
NotImplemented: 'NotImplemented';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:180](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L180)

Requested Action is not known by receiver

##### NotSupported

```ts
NotSupported: 'NotSupported';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:200](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L200)

Requested Action is recognized but not supported by the receiver

##### OccurrenceConstraintViolation

```ts
OccurrenceConstraintViolation: 'OccurrenceConstraintViolation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:204](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L204)

Payload for Action is syntactically correct but at least one of the fields violates occurrence constraints

##### PropertyConstraintViolation

```ts
PropertyConstraintViolation: 'PropertyConstraintViolation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:208](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L208)

Payload is syntactically correct but at least one field contains an invalid value

##### ProtocolError

```ts
ProtocolError: 'ProtocolError';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:184](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L184)

Payload for Action is not conform the PDU structure

##### RpcFrameworkError

```ts
RpcFrameworkError: 'RpcFrameworkError';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:212](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L212)

Content of the call is not a valid RPC Request, for example: MessageId could not be read.

##### SecurityError

```ts
SecurityError: 'SecurityError';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:216](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L216)

During the processing of Action a security issue occurred preventing receiver from completing the Action successfully

##### TypeConstraintViolation

```ts
TypeConstraintViolation: 'TypeConstraintViolation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:220](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L220)

Payload for Action is syntactically correct but at least one of the fields violates data type constraints (e.g. 'somestring': 12)

---

### MessageTypeId

Defined in: [00_Base/src/ocpp/rpc/message.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L37)

Number identifying the different types of OCPP messages.

#### Enumeration Members

##### Call

```ts
Call: 2;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L39)

##### CallError

```ts
CallError: 4;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L43)

##### CallResult

```ts
CallResult: 3;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L41)

---

### OCPP1_6_CallAction

Defined in: [00_Base/src/ocpp/rpc/message.ts:66](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L66)

#### Enumeration Members

##### Authorize

```ts
Authorize: 'Authorize';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L67)

##### BootNotification

```ts
BootNotification: 'BootNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L68)

##### CancelReservation

```ts
CancelReservation: 'CancelReservation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L69)

##### ChangeAvailability

```ts
ChangeAvailability: 'ChangeAvailability';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L70)

##### ChangeConfiguration

```ts
ChangeConfiguration: 'ChangeConfiguration';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L71)

##### ClearCache

```ts
ClearCache: 'ClearCache';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L72)

##### ClearChargingProfile

```ts
ClearChargingProfile: 'ClearChargingProfile';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L73)

##### DataTransfer

```ts
DataTransfer: 'DataTransfer';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L74)

##### DiagnosticsStatusNotification

```ts
DiagnosticsStatusNotification: 'DiagnosticsStatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L75)

##### FirmwareStatusNotification

```ts
FirmwareStatusNotification: 'FirmwareStatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L76)

##### GetCompositeSchedule

```ts
GetCompositeSchedule: 'GetCompositeSchedule';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L77)

##### GetConfiguration

```ts
GetConfiguration: 'GetConfiguration';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L78)

##### GetDiagnostics

```ts
GetDiagnostics: 'GetDiagnostics';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L79)

##### GetLocalListVersion

```ts
GetLocalListVersion: 'GetLocalListVersion';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L80)

##### Heartbeat

```ts
Heartbeat: 'Heartbeat';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L81)

##### MeterValues

```ts
MeterValues: 'MeterValues';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L82)

##### RemoteStartTransaction

```ts
RemoteStartTransaction: 'RemoteStartTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L83)

##### RemoteStopTransaction

```ts
RemoteStopTransaction: 'RemoteStopTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L84)

##### ReserveNow

```ts
ReserveNow: 'ReserveNow';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L85)

##### Reset

```ts
Reset: 'Reset';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L86)

##### SendLocalList

```ts
SendLocalList: 'SendLocalList';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:87](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L87)

##### SetChargingProfile

```ts
SetChargingProfile: 'SetChargingProfile';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L88)

##### StartTransaction

```ts
StartTransaction: 'StartTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L89)

##### StatusNotification

```ts
StatusNotification: 'StatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L90)

##### StopTransaction

```ts
StopTransaction: 'StopTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L91)

##### TriggerMessage

```ts
TriggerMessage: 'TriggerMessage';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L92)

##### UnlockConnector

```ts
UnlockConnector: 'UnlockConnector';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L93)

##### UpdateFirmware

```ts
UpdateFirmware: 'UpdateFirmware';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:94](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L94)

---

### OCPP2_0_1_CallAction

Defined in: [00_Base/src/ocpp/rpc/message.ts:97](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L97)

#### Enumeration Members

##### Authorize

```ts
Authorize: 'Authorize';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L98)

##### BootNotification

```ts
BootNotification: 'BootNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L99)

##### CancelReservation

```ts
CancelReservation: 'CancelReservation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L100)

##### CertificateSigned

```ts
CertificateSigned: 'CertificateSigned';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L101)

##### ChangeAvailability

```ts
ChangeAvailability: 'ChangeAvailability';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L102)

##### ClearCache

```ts
ClearCache: 'ClearCache';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L103)

##### ClearChargingProfile

```ts
ClearChargingProfile: 'ClearChargingProfile';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L104)

##### ClearDisplayMessage

```ts
ClearDisplayMessage: 'ClearDisplayMessage';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L105)

##### ClearedChargingLimit

```ts
ClearedChargingLimit: 'ClearedChargingLimit';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L106)

##### ClearVariableMonitoring

```ts
ClearVariableMonitoring: 'ClearVariableMonitoring';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L107)

##### CostUpdated

```ts
CostUpdated: 'CostUpdated';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L108)

##### CustomerInformation

```ts
CustomerInformation: 'CustomerInformation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L109)

##### DataTransfer

```ts
DataTransfer: 'DataTransfer';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L110)

##### DeleteCertificate

```ts
DeleteCertificate: 'DeleteCertificate';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L111)

##### FirmwareStatusNotification

```ts
FirmwareStatusNotification: 'FirmwareStatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L112)

##### Get15118EVCertificate

```ts
Get15118EVCertificate: 'Get15118EVCertificate';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:113](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L113)

##### GetBaseReport

```ts
GetBaseReport: 'GetBaseReport';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L114)

##### GetCertificateStatus

```ts
GetCertificateStatus: 'GetCertificateStatus';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L115)

##### GetChargingProfiles

```ts
GetChargingProfiles: 'GetChargingProfiles';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:116](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L116)

##### GetCompositeSchedule

```ts
GetCompositeSchedule: 'GetCompositeSchedule';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L117)

##### GetDisplayMessages

```ts
GetDisplayMessages: 'GetDisplayMessages';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L118)

##### GetInstalledCertificateIds

```ts
GetInstalledCertificateIds: 'GetInstalledCertificateIds';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L119)

##### GetLocalListVersion

```ts
GetLocalListVersion: 'GetLocalListVersion';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L120)

##### GetLog

```ts
GetLog: 'GetLog';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L121)

##### GetMonitoringReport

```ts
GetMonitoringReport: 'GetMonitoringReport';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L122)

##### GetReport

```ts
GetReport: 'GetReport';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L123)

##### GetTransactionStatus

```ts
GetTransactionStatus: 'GetTransactionStatus';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:124](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L124)

##### GetVariables

```ts
GetVariables: 'GetVariables';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:125](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L125)

##### Heartbeat

```ts
Heartbeat: 'Heartbeat';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L126)

##### InstallCertificate

```ts
InstallCertificate: 'InstallCertificate';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L127)

##### LogStatusNotification

```ts
LogStatusNotification: 'LogStatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:128](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L128)

##### MeterValues

```ts
MeterValues: 'MeterValues';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L129)

##### NotifyChargingLimit

```ts
NotifyChargingLimit: 'NotifyChargingLimit';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L130)

##### NotifyCustomerInformation

```ts
NotifyCustomerInformation: 'NotifyCustomerInformation';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L131)

##### NotifyDisplayMessages

```ts
NotifyDisplayMessages: 'NotifyDisplayMessages';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L132)

##### NotifyEVChargingNeeds

```ts
NotifyEVChargingNeeds: 'NotifyEVChargingNeeds';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L133)

##### NotifyEVChargingSchedule

```ts
NotifyEVChargingSchedule: 'NotifyEVChargingSchedule';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L134)

##### NotifyEvent

```ts
NotifyEvent: 'NotifyEvent';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:135](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L135)

##### NotifyMonitoringReport

```ts
NotifyMonitoringReport: 'NotifyMonitoringReport';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:136](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L136)

##### NotifyReport

```ts
NotifyReport: 'NotifyReport';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:137](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L137)

##### PublishFirmware

```ts
PublishFirmware: 'PublishFirmware';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L138)

##### PublishFirmwareStatusNotification

```ts
PublishFirmwareStatusNotification: 'PublishFirmwareStatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L139)

##### ReportChargingProfiles

```ts
ReportChargingProfiles: 'ReportChargingProfiles';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:140](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L140)

##### RequestStartTransaction

```ts
RequestStartTransaction: 'RequestStartTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L141)

##### RequestStopTransaction

```ts
RequestStopTransaction: 'RequestStopTransaction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:142](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L142)

##### ReservationStatusUpdate

```ts
ReservationStatusUpdate: 'ReservationStatusUpdate';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L143)

##### ReserveNow

```ts
ReserveNow: 'ReserveNow';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L144)

##### Reset

```ts
Reset: 'Reset';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:145](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L145)

##### SecurityEventNotification

```ts
SecurityEventNotification: 'SecurityEventNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:146](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L146)

##### SendLocalList

```ts
SendLocalList: 'SendLocalList';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L147)

##### SetChargingProfile

```ts
SetChargingProfile: 'SetChargingProfile';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:148](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L148)

##### SetDisplayMessage

```ts
SetDisplayMessage: 'SetDisplayMessage';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:149](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L149)

##### SetMonitoringBase

```ts
SetMonitoringBase: 'SetMonitoringBase';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L150)

##### SetMonitoringLevel

```ts
SetMonitoringLevel: 'SetMonitoringLevel';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:151](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L151)

##### SetNetworkProfile

```ts
SetNetworkProfile: 'SetNetworkProfile';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:152](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L152)

##### SetVariableMonitoring

```ts
SetVariableMonitoring: 'SetVariableMonitoring';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:153](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L153)

##### SetVariables

```ts
SetVariables: 'SetVariables';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:154](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L154)

##### SignCertificate

```ts
SignCertificate: 'SignCertificate';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L155)

##### StatusNotification

```ts
StatusNotification: 'StatusNotification';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:156](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L156)

##### TransactionEvent

```ts
TransactionEvent: 'TransactionEvent';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:157](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L157)

##### TriggerMessage

```ts
TriggerMessage: 'TriggerMessage';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:158](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L158)

##### UnlockConnector

```ts
UnlockConnector: 'UnlockConnector';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:159](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L159)

##### UnpublishFirmware

```ts
UnpublishFirmware: 'UnpublishFirmware';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:160](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L160)

##### UpdateFirmware

```ts
UpdateFirmware: 'UpdateFirmware';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:161](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L161)

---

### OCPPVersion

Defined in: [00_Base/src/ocpp/rpc/message.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L49)

Supported OCPP versions

#### Enumeration Members

##### OCPP1_6

```ts
OCPP1_6: 'ocpp1.6';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L50)

##### OCPP2_0_1

```ts
OCPP2_0_1: 'ocpp2.0.1';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L51)

## Classes

### OcppError

Defined in: [00_Base/src/ocpp/rpc/message.ts:226](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L226)

Custom error to handle OCPP errors better.

#### Extends

- `Error`

#### Constructors

##### Constructor

```ts
new OcppError(
   messageId,
   errorCode,
   errorDescription,
   errorDetails?): OcppError;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:236](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L236)

###### Parameters

| Parameter          | Type                      |
| ------------------ | ------------------------- |
| `messageId`        | `string`                  |
| `errorCode`        | [`ErrorCode`](#errorcode) |
| `errorDescription` | `string`                  |
| `errorDetails`     | `object`                  |

###### Returns

[`OcppError`](#ocpperror)

###### Overrides

```ts
Error.constructor;
```

#### Properties

| Property                                   | Modifier  | Type                      | Defined in                                                                                                                                                            |
| ------------------------------------------ | --------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_errorcode"></a> `_errorCode`       | `private` | [`ErrorCode`](#errorcode) | [00_Base/src/ocpp/rpc/message.ts:228](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L228) |
| <a id="_errordetails"></a> `_errorDetails` | `private` | `object`                  | [00_Base/src/ocpp/rpc/message.ts:229](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L229) |
| <a id="_messageid"></a> `_messageId`       | `private` | `string`                  | [00_Base/src/ocpp/rpc/message.ts:227](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L227) |

#### Accessors

##### message

###### Get Signature

```ts
get message(): string;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:232](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L232)

###### Returns

`string`

###### Overrides

```ts
Error.message;
```

#### Methods

##### asCallError()

```ts
asCallError(): CallError;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:249](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L249)

###### Returns

[`CallError`](#callerror-1)

## Type Aliases

### Call

```ts
type Call = [MessageTypeId, string, CallAction, OcppRequest];
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L11)

Definition of Call Message (4.2.1 CALL)

---

### CallAction

```ts
type CallAction = OCPP1_6_CallAction | OCPP2_0_1_CallAction;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L64)

---

### CallError

```ts
type CallError = [MessageTypeId, string, ErrorCode, string, object];
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L26)

Definition of CallError Message (4.2.1 CALLERROR)

---

### CallResult

```ts
type CallResult = [MessageTypeId, string, OcppResponse];
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L21)

Definition of CallResult Message (4.2.2 CALLRESULT)

---

### OCPPVersionType

```ts
type OCPPVersionType = 'ocpp1.6' | 'ocpp2.0.1';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L54)

## Variables

### NO_ACTION

```ts
const NO_ACTION: 'NoAction' = 'NoAction';
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L62)

The different OCPP action types.

## Functions

### mapToCallAction()

```ts
function mapToCallAction(version, action): CallAction;
```

Defined in: [00_Base/src/ocpp/rpc/message.ts:267](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/rpc/message.ts#L267)

Maps a string to the corresponding OCPP CallAction enum value based on protocol version

#### Parameters

| Parameter | Type                                  | Description                         |
| --------- | ------------------------------------- | ----------------------------------- |
| `version` | [`OCPPVersionType`](#ocppversiontype) | OCPP protocol version               |
| `action`  | `string`                              | String representation of the action |

#### Returns

[`CallAction`](#callaction)

The corresponding enum value

#### Throws

Error if the action is invalid for the specified version

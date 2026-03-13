[**CitrineOS Core**](../index.md)

---

[CitrineOS Core](../index.md) / 00_Base/src

# 00_Base/src

## Interfaces

### OcppRequest

Defined in: [00_Base/src/index.ts:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L119)

#### Extended by

- [`AuthorizeRequest`](src/ocpp/model/1.6/types/AuthorizeRequest.md#authorizerequest)
- [`BootNotificationRequest`](src/ocpp/model/1.6/types/BootNotificationRequest.md#bootnotificationrequest)
- [`CancelReservationRequest`](src/ocpp/model/1.6/types/CancelReservationRequest.md#cancelreservationrequest)
- [`ChangeAvailabilityRequest`](src/ocpp/model/1.6/types/ChangeAvailabilityRequest.md#changeavailabilityrequest)
- [`ChangeConfigurationRequest`](src/ocpp/model/1.6/types/ChangeConfigurationRequest.md#changeconfigurationrequest)
- [`ClearCacheRequest`](src/ocpp/model/1.6/types/ClearCacheRequest.md#clearcacherequest)
- [`ClearChargingProfileRequest`](src/ocpp/model/1.6/types/ClearChargingProfileRequest.md#clearchargingprofilerequest)
- [`DataTransferRequest`](src/ocpp/model/1.6/types/DataTransferRequest.md#datatransferrequest)
- [`DiagnosticsStatusNotificationRequest`](src/ocpp/model/1.6/types/DiagnosticsStatusNotificationRequest.md#diagnosticsstatusnotificationrequest)
- [`FirmwareStatusNotificationRequest`](src/ocpp/model/1.6/types/FirmwareStatusNotificationRequest.md#firmwarestatusnotificationrequest)
- [`GetCompositeScheduleRequest`](src/ocpp/model/1.6/types/GetCompositeScheduleRequest.md#getcompositeschedulerequest)
- [`GetConfigurationRequest`](src/ocpp/model/1.6/types/GetConfigurationRequest.md#getconfigurationrequest)
- [`GetDiagnosticsRequest`](src/ocpp/model/1.6/types/GetDiagnosticsRequest.md#getdiagnosticsrequest)
- [`GetLocalListVersionRequest`](src/ocpp/model/1.6/types/GetLocalListVersionRequest.md#getlocallistversionrequest)
- [`HeartbeatRequest`](src/ocpp/model/1.6/types/HeartbeatRequest.md#heartbeatrequest)
- [`MeterValuesRequest`](src/ocpp/model/1.6/types/MeterValuesRequest.md#metervaluesrequest)
- [`RemoteStartTransactionRequest`](src/ocpp/model/1.6/types/RemoteStartTransactionRequest.md#remotestarttransactionrequest)
- [`RemoteStopTransactionRequest`](src/ocpp/model/1.6/types/RemoteStopTransactionRequest.md#remotestoptransactionrequest)
- [`ReserveNowRequest`](src/ocpp/model/1.6/types/ReserveNowRequest.md#reservenowrequest)
- [`ResetRequest`](src/ocpp/model/1.6/types/ResetRequest.md#resetrequest)
- [`SendLocalListRequest`](src/ocpp/model/1.6/types/SendLocalListRequest.md#sendlocallistrequest)
- [`SetChargingProfileRequest`](src/ocpp/model/1.6/types/SetChargingProfileRequest.md#setchargingprofilerequest)
- [`StartTransactionRequest`](src/ocpp/model/1.6/types/StartTransactionRequest.md#starttransactionrequest)
- [`StatusNotificationRequest`](src/ocpp/model/1.6/types/StatusNotificationRequest.md#statusnotificationrequest)
- [`StopTransactionRequest`](src/ocpp/model/1.6/types/StopTransactionRequest.md#stoptransactionrequest)
- [`TriggerMessageRequest`](src/ocpp/model/1.6/types/TriggerMessageRequest.md#triggermessagerequest)
- [`UnlockConnectorRequest`](src/ocpp/model/1.6/types/UnlockConnectorRequest.md#unlockconnectorrequest)
- [`UpdateFirmwareRequest`](src/ocpp/model/1.6/types/UpdateFirmwareRequest.md#updatefirmwarerequest)
- [`AuthorizeRequest`](src/ocpp/model/2.0.1/types/AuthorizeRequest.md#authorizerequest)
- [`BootNotificationRequest`](src/ocpp/model/2.0.1/types/BootNotificationRequest.md#bootnotificationrequest)
- [`CancelReservationRequest`](src/ocpp/model/2.0.1/types/CancelReservationRequest.md#cancelreservationrequest)
- [`CertificateSignedRequest`](src/ocpp/model/2.0.1/types/CertificateSignedRequest.md#certificatesignedrequest)
- [`ChangeAvailabilityRequest`](src/ocpp/model/2.0.1/types/ChangeAvailabilityRequest.md#changeavailabilityrequest)
- [`ClearCacheRequest`](src/ocpp/model/2.0.1/types/ClearCacheRequest.md#clearcacherequest)
- [`ClearChargingProfileRequest`](src/ocpp/model/2.0.1/types/ClearChargingProfileRequest.md#clearchargingprofilerequest)
- [`ClearDisplayMessageRequest`](src/ocpp/model/2.0.1/types/ClearDisplayMessageRequest.md#cleardisplaymessagerequest)
- [`ClearVariableMonitoringRequest`](src/ocpp/model/2.0.1/types/ClearVariableMonitoringRequest.md#clearvariablemonitoringrequest)
- [`ClearedChargingLimitRequest`](src/ocpp/model/2.0.1/types/ClearedChargingLimitRequest.md#clearedcharginglimitrequest)
- [`CostUpdatedRequest`](src/ocpp/model/2.0.1/types/CostUpdatedRequest.md#costupdatedrequest)
- [`CustomerInformationRequest`](src/ocpp/model/2.0.1/types/CustomerInformationRequest.md#customerinformationrequest)
- [`DataTransferRequest`](src/ocpp/model/2.0.1/types/DataTransferRequest.md#datatransferrequest)
- [`DeleteCertificateRequest`](src/ocpp/model/2.0.1/types/DeleteCertificateRequest.md#deletecertificaterequest)
- [`FirmwareStatusNotificationRequest`](src/ocpp/model/2.0.1/types/FirmwareStatusNotificationRequest.md#firmwarestatusnotificationrequest)
- [`Get15118EVCertificateRequest`](src/ocpp/model/2.0.1/types/Get15118EVCertificateRequest.md#get15118evcertificaterequest)
- [`GetBaseReportRequest`](src/ocpp/model/2.0.1/types/GetBaseReportRequest.md#getbasereportrequest)
- [`GetCertificateStatusRequest`](src/ocpp/model/2.0.1/types/GetCertificateStatusRequest.md#getcertificatestatusrequest)
- [`GetChargingProfilesRequest`](src/ocpp/model/2.0.1/types/GetChargingProfilesRequest.md#getchargingprofilesrequest)
- [`GetCompositeScheduleRequest`](src/ocpp/model/2.0.1/types/GetCompositeScheduleRequest.md#getcompositeschedulerequest)
- [`GetDisplayMessagesRequest`](src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.md#getdisplaymessagesrequest)
- [`GetInstalledCertificateIdsRequest`](src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsRequest.md#getinstalledcertificateidsrequest)
- [`GetLocalListVersionRequest`](src/ocpp/model/2.0.1/types/GetLocalListVersionRequest.md#getlocallistversionrequest)
- [`GetLogRequest`](src/ocpp/model/2.0.1/types/GetLogRequest.md#getlogrequest)
- [`GetMonitoringReportRequest`](src/ocpp/model/2.0.1/types/GetMonitoringReportRequest.md#getmonitoringreportrequest)
- [`GetReportRequest`](src/ocpp/model/2.0.1/types/GetReportRequest.md#getreportrequest)
- [`GetTransactionStatusRequest`](src/ocpp/model/2.0.1/types/GetTransactionStatusRequest.md#gettransactionstatusrequest)
- [`GetVariablesRequest`](src/ocpp/model/2.0.1/types/GetVariablesRequest.md#getvariablesrequest)
- [`HeartbeatRequest`](src/ocpp/model/2.0.1/types/HeartbeatRequest.md#heartbeatrequest)
- [`InstallCertificateRequest`](src/ocpp/model/2.0.1/types/InstallCertificateRequest.md#installcertificaterequest)
- [`LogStatusNotificationRequest`](src/ocpp/model/2.0.1/types/LogStatusNotificationRequest.md#logstatusnotificationrequest)
- [`MeterValuesRequest`](src/ocpp/model/2.0.1/types/MeterValuesRequest.md#metervaluesrequest)
- [`NotifyChargingLimitRequest`](src/ocpp/model/2.0.1/types/NotifyChargingLimitRequest.md#notifycharginglimitrequest)
- [`NotifyCustomerInformationRequest`](src/ocpp/model/2.0.1/types/NotifyCustomerInformationRequest.md#notifycustomerinformationrequest)
- [`NotifyDisplayMessagesRequest`](src/ocpp/model/2.0.1/types/NotifyDisplayMessagesRequest.md#notifydisplaymessagesrequest)
- [`NotifyEVChargingNeedsRequest`](src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsRequest.md#notifyevchargingneedsrequest)
- [`NotifyEVChargingScheduleRequest`](src/ocpp/model/2.0.1/types/NotifyEVChargingScheduleRequest.md#notifyevchargingschedulerequest)
- [`NotifyEventRequest`](src/ocpp/model/2.0.1/types/NotifyEventRequest.md#notifyeventrequest)
- [`NotifyMonitoringReportRequest`](src/ocpp/model/2.0.1/types/NotifyMonitoringReportRequest.md#notifymonitoringreportrequest)
- [`NotifyReportRequest`](src/ocpp/model/2.0.1/types/NotifyReportRequest.md#notifyreportrequest)
- [`PublishFirmwareRequest`](src/ocpp/model/2.0.1/types/PublishFirmwareRequest.md#publishfirmwarerequest)
- [`PublishFirmwareStatusNotificationRequest`](src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationRequest.md#publishfirmwarestatusnotificationrequest)
- [`ReportChargingProfilesRequest`](src/ocpp/model/2.0.1/types/ReportChargingProfilesRequest.md#reportchargingprofilesrequest)
- [`RequestStartTransactionRequest`](src/ocpp/model/2.0.1/types/RequestStartTransactionRequest.md#requeststarttransactionrequest)
- [`RequestStartTransactionResponse`](src/ocpp/model/2.0.1/types/RequestStartTransactionResponse.md#requeststarttransactionresponse)
- [`RequestStopTransactionRequest`](src/ocpp/model/2.0.1/types/RequestStopTransactionRequest.md#requeststoptransactionrequest)
- [`RequestStopTransactionResponse`](src/ocpp/model/2.0.1/types/RequestStopTransactionResponse.md#requeststoptransactionresponse)
- [`ReservationStatusUpdateRequest`](src/ocpp/model/2.0.1/types/ReservationStatusUpdateRequest.md#reservationstatusupdaterequest)
- [`ReserveNowRequest`](src/ocpp/model/2.0.1/types/ReserveNowRequest.md#reservenowrequest)
- [`ResetRequest`](src/ocpp/model/2.0.1/types/ResetRequest.md#resetrequest)
- [`SecurityEventNotificationRequest`](src/ocpp/model/2.0.1/types/SecurityEventNotificationRequest.md#securityeventnotificationrequest)
- [`SendLocalListRequest`](src/ocpp/model/2.0.1/types/SendLocalListRequest.md#sendlocallistrequest)
- [`SetChargingProfileRequest`](src/ocpp/model/2.0.1/types/SetChargingProfileRequest.md#setchargingprofilerequest)
- [`SetDisplayMessageRequest`](src/ocpp/model/2.0.1/types/SetDisplayMessageRequest.md#setdisplaymessagerequest)
- [`SetMonitoringBaseRequest`](src/ocpp/model/2.0.1/types/SetMonitoringBaseRequest.md#setmonitoringbaserequest)
- [`SetMonitoringLevelRequest`](src/ocpp/model/2.0.1/types/SetMonitoringLevelRequest.md#setmonitoringlevelrequest)
- [`SetNetworkProfileRequest`](src/ocpp/model/2.0.1/types/SetNetworkProfileRequest.md#setnetworkprofilerequest)
- [`SetVariableMonitoringRequest`](src/ocpp/model/2.0.1/types/SetVariableMonitoringRequest.md#setvariablemonitoringrequest)
- [`SetVariablesRequest`](src/ocpp/model/2.0.1/types/SetVariablesRequest.md#setvariablesrequest)
- [`SignCertificateRequest`](src/ocpp/model/2.0.1/types/SignCertificateRequest.md#signcertificaterequest)
- [`StatusNotificationRequest`](src/ocpp/model/2.0.1/types/StatusNotificationRequest.md#statusnotificationrequest)
- [`TransactionEventRequest`](src/ocpp/model/2.0.1/types/TransactionEventRequest.md#transactioneventrequest)
- [`TriggerMessageRequest`](src/ocpp/model/2.0.1/types/TriggerMessageRequest.md#triggermessagerequest)
- [`UnlockConnectorRequest`](src/ocpp/model/2.0.1/types/UnlockConnectorRequest.md#unlockconnectorrequest)
- [`UnpublishFirmwareRequest`](src/ocpp/model/2.0.1/types/UnpublishFirmwareRequest.md#unpublishfirmwarerequest)
- [`UpdateFirmwareRequest`](src/ocpp/model/2.0.1/types/UpdateFirmwareRequest.md#updatefirmwarerequest)

---

### OcppResponse

Defined in: [00_Base/src/index.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L121)

#### Extended by

- [`AuthorizeResponse`](src/ocpp/model/1.6/types/AuthorizeResponse.md#authorizeresponse)
- [`BootNotificationResponse`](src/ocpp/model/1.6/types/BootNotificationResponse.md#bootnotificationresponse)
- [`CancelReservationResponse`](src/ocpp/model/1.6/types/CancelReservationResponse.md#cancelreservationresponse)
- [`ChangeAvailabilityResponse`](src/ocpp/model/1.6/types/ChangeAvailabilityResponse.md#changeavailabilityresponse)
- [`ChangeConfigurationResponse`](src/ocpp/model/1.6/types/ChangeConfigurationResponse.md#changeconfigurationresponse)
- [`ClearCacheResponse`](src/ocpp/model/1.6/types/ClearCacheResponse.md#clearcacheresponse)
- [`ClearChargingProfileResponse`](src/ocpp/model/1.6/types/ClearChargingProfileResponse.md#clearchargingprofileresponse)
- [`DataTransferResponse`](src/ocpp/model/1.6/types/DataTransferResponse.md#datatransferresponse)
- [`DiagnosticsStatusNotificationResponse`](src/ocpp/model/1.6/types/DiagnosticsStatusNotificationResponse.md#diagnosticsstatusnotificationresponse)
- [`FirmwareStatusNotificationResponse`](src/ocpp/model/1.6/types/FirmwareStatusNotificationResponse.md#firmwarestatusnotificationresponse)
- [`GetCompositeScheduleResponse`](src/ocpp/model/1.6/types/GetCompositeScheduleResponse.md#getcompositescheduleresponse)
- [`GetConfigurationResponse`](src/ocpp/model/1.6/types/GetConfigurationResponse.md#getconfigurationresponse)
- [`GetDiagnosticsResponse`](src/ocpp/model/1.6/types/GetDiagnosticsResponse.md#getdiagnosticsresponse)
- [`GetLocalListVersionResponse`](src/ocpp/model/1.6/types/GetLocalListVersionResponse.md#getlocallistversionresponse)
- [`HeartbeatResponse`](src/ocpp/model/1.6/types/HeartbeatResponse.md#heartbeatresponse)
- [`MeterValuesResponse`](src/ocpp/model/1.6/types/MeterValuesResponse.md#metervaluesresponse)
- [`RemoteStartTransactionResponse`](src/ocpp/model/1.6/types/RemoteStartTransactionResponse.md#remotestarttransactionresponse)
- [`RemoteStopTransactionResponse`](src/ocpp/model/1.6/types/RemoteStopTransactionResponse.md#remotestoptransactionresponse)
- [`ReserveNowResponse`](src/ocpp/model/1.6/types/ReserveNowResponse.md#reservenowresponse)
- [`ResetResponse`](src/ocpp/model/1.6/types/ResetResponse.md#resetresponse)
- [`SendLocalListResponse`](src/ocpp/model/1.6/types/SendLocalListResponse.md#sendlocallistresponse)
- [`SetChargingProfileResponse`](src/ocpp/model/1.6/types/SetChargingProfileResponse.md#setchargingprofileresponse)
- [`StartTransactionResponse`](src/ocpp/model/1.6/types/StartTransactionResponse.md#starttransactionresponse)
- [`StatusNotificationResponse`](src/ocpp/model/1.6/types/StatusNotificationResponse.md#statusnotificationresponse)
- [`StopTransactionResponse`](src/ocpp/model/1.6/types/StopTransactionResponse.md#stoptransactionresponse)
- [`TriggerMessageResponse`](src/ocpp/model/1.6/types/TriggerMessageResponse.md#triggermessageresponse)
- [`UnlockConnectorResponse`](src/ocpp/model/1.6/types/UnlockConnectorResponse.md#unlockconnectorresponse)
- [`UpdateFirmwareResponse`](src/ocpp/model/1.6/types/UpdateFirmwareResponse.md#updatefirmwareresponse)
- [`AuthorizeResponse`](src/ocpp/model/2.0.1/types/AuthorizeResponse.md#authorizeresponse)
- [`BootNotificationResponse`](src/ocpp/model/2.0.1/types/BootNotificationResponse.md#bootnotificationresponse)
- [`CancelReservationResponse`](src/ocpp/model/2.0.1/types/CancelReservationResponse.md#cancelreservationresponse)
- [`CertificateSignedResponse`](src/ocpp/model/2.0.1/types/CertificateSignedResponse.md#certificatesignedresponse)
- [`ChangeAvailabilityResponse`](src/ocpp/model/2.0.1/types/ChangeAvailabilityResponse.md#changeavailabilityresponse)
- [`ClearCacheResponse`](src/ocpp/model/2.0.1/types/ClearCacheResponse.md#clearcacheresponse)
- [`ClearChargingProfileResponse`](src/ocpp/model/2.0.1/types/ClearChargingProfileResponse.md#clearchargingprofileresponse)
- [`ClearDisplayMessageResponse`](src/ocpp/model/2.0.1/types/ClearDisplayMessageResponse.md#cleardisplaymessageresponse)
- [`ClearVariableMonitoringResponse`](src/ocpp/model/2.0.1/types/ClearVariableMonitoringResponse.md#clearvariablemonitoringresponse)
- [`ClearedChargingLimitResponse`](src/ocpp/model/2.0.1/types/ClearedChargingLimitResponse.md#clearedcharginglimitresponse)
- [`CostUpdatedResponse`](src/ocpp/model/2.0.1/types/CostUpdatedResponse.md#costupdatedresponse)
- [`CustomerInformationResponse`](src/ocpp/model/2.0.1/types/CustomerInformationResponse.md#customerinformationresponse)
- [`DataTransferResponse`](src/ocpp/model/2.0.1/types/DataTransferResponse.md#datatransferresponse)
- [`DeleteCertificateResponse`](src/ocpp/model/2.0.1/types/DeleteCertificateResponse.md#deletecertificateresponse)
- [`FirmwareStatusNotificationResponse`](src/ocpp/model/2.0.1/types/FirmwareStatusNotificationResponse.md#firmwarestatusnotificationresponse)
- [`Get15118EVCertificateResponse`](src/ocpp/model/2.0.1/types/Get15118EVCertificateResponse.md#get15118evcertificateresponse)
- [`GetBaseReportResponse`](src/ocpp/model/2.0.1/types/GetBaseReportResponse.md#getbasereportresponse)
- [`GetCertificateStatusResponse`](src/ocpp/model/2.0.1/types/GetCertificateStatusResponse.md#getcertificatestatusresponse)
- [`GetChargingProfilesResponse`](src/ocpp/model/2.0.1/types/GetChargingProfilesResponse.md#getchargingprofilesresponse)
- [`GetCompositeScheduleResponse`](src/ocpp/model/2.0.1/types/GetCompositeScheduleResponse.md#getcompositescheduleresponse)
- [`GetDisplayMessagesResponse`](src/ocpp/model/2.0.1/types/GetDisplayMessagesResponse.md#getdisplaymessagesresponse)
- [`GetInstalledCertificateIdsResponse`](src/ocpp/model/2.0.1/types/GetInstalledCertificateIdsResponse.md#getinstalledcertificateidsresponse)
- [`GetLocalListVersionResponse`](src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.md#getlocallistversionresponse)
- [`GetLogResponse`](src/ocpp/model/2.0.1/types/GetLogResponse.md#getlogresponse)
- [`GetMonitoringReportResponse`](src/ocpp/model/2.0.1/types/GetMonitoringReportResponse.md#getmonitoringreportresponse)
- [`GetReportResponse`](src/ocpp/model/2.0.1/types/GetReportResponse.md#getreportresponse)
- [`GetTransactionStatusResponse`](src/ocpp/model/2.0.1/types/GetTransactionStatusResponse.md#gettransactionstatusresponse)
- [`GetVariablesResponse`](src/ocpp/model/2.0.1/types/GetVariablesResponse.md#getvariablesresponse)
- [`HeartbeatResponse`](src/ocpp/model/2.0.1/types/HeartbeatResponse.md#heartbeatresponse)
- [`InstallCertificateResponse`](src/ocpp/model/2.0.1/types/InstallCertificateResponse.md#installcertificateresponse)
- [`LogStatusNotificationResponse`](src/ocpp/model/2.0.1/types/LogStatusNotificationResponse.md#logstatusnotificationresponse)
- [`MeterValuesResponse`](src/ocpp/model/2.0.1/types/MeterValuesResponse.md#metervaluesresponse)
- [`NotifyChargingLimitResponse`](src/ocpp/model/2.0.1/types/NotifyChargingLimitResponse.md#notifycharginglimitresponse)
- [`NotifyCustomerInformationResponse`](src/ocpp/model/2.0.1/types/NotifyCustomerInformationResponse.md#notifycustomerinformationresponse)
- [`NotifyDisplayMessagesResponse`](src/ocpp/model/2.0.1/types/NotifyDisplayMessagesResponse.md#notifydisplaymessagesresponse)
- [`NotifyEVChargingNeedsResponse`](src/ocpp/model/2.0.1/types/NotifyEVChargingNeedsResponse.md#notifyevchargingneedsresponse)
- [`NotifyEVChargingScheduleResponse`](src/ocpp/model/2.0.1/types/NotifyEVChargingScheduleResponse.md#notifyevchargingscheduleresponse)
- [`NotifyEventResponse`](src/ocpp/model/2.0.1/types/NotifyEventResponse.md#notifyeventresponse)
- [`NotifyMonitoringReportResponse`](src/ocpp/model/2.0.1/types/NotifyMonitoringReportResponse.md#notifymonitoringreportresponse)
- [`NotifyReportResponse`](src/ocpp/model/2.0.1/types/NotifyReportResponse.md#notifyreportresponse)
- [`PublishFirmwareResponse`](src/ocpp/model/2.0.1/types/PublishFirmwareResponse.md#publishfirmwareresponse)
- [`PublishFirmwareStatusNotificationResponse`](src/ocpp/model/2.0.1/types/PublishFirmwareStatusNotificationResponse.md#publishfirmwarestatusnotificationresponse)
- [`ReportChargingProfilesResponse`](src/ocpp/model/2.0.1/types/ReportChargingProfilesResponse.md#reportchargingprofilesresponse)
- [`ReservationStatusUpdateResponse`](src/ocpp/model/2.0.1/types/ReservationStatusUpdateResponse.md#reservationstatusupdateresponse)
- [`ReserveNowResponse`](src/ocpp/model/2.0.1/types/ReserveNowResponse.md#reservenowresponse)
- [`ResetResponse`](src/ocpp/model/2.0.1/types/ResetResponse.md#resetresponse)
- [`SecurityEventNotificationResponse`](src/ocpp/model/2.0.1/types/SecurityEventNotificationResponse.md#securityeventnotificationresponse)
- [`SendLocalListResponse`](src/ocpp/model/2.0.1/types/SendLocalListResponse.md#sendlocallistresponse)
- [`SetChargingProfileResponse`](src/ocpp/model/2.0.1/types/SetChargingProfileResponse.md#setchargingprofileresponse)
- [`SetDisplayMessageResponse`](src/ocpp/model/2.0.1/types/SetDisplayMessageResponse.md#setdisplaymessageresponse)
- [`SetMonitoringBaseResponse`](src/ocpp/model/2.0.1/types/SetMonitoringBaseResponse.md#setmonitoringbaseresponse)
- [`SetMonitoringLevelResponse`](src/ocpp/model/2.0.1/types/SetMonitoringLevelResponse.md#setmonitoringlevelresponse)
- [`SetNetworkProfileResponse`](src/ocpp/model/2.0.1/types/SetNetworkProfileResponse.md#setnetworkprofileresponse)
- [`SetVariableMonitoringResponse`](src/ocpp/model/2.0.1/types/SetVariableMonitoringResponse.md#setvariablemonitoringresponse)
- [`SetVariablesResponse`](src/ocpp/model/2.0.1/types/SetVariablesResponse.md#setvariablesresponse)
- [`SignCertificateResponse`](src/ocpp/model/2.0.1/types/SignCertificateResponse.md#signcertificateresponse)
- [`StatusNotificationResponse`](src/ocpp/model/2.0.1/types/StatusNotificationResponse.md#statusnotificationresponse)
- [`TransactionEventResponse`](src/ocpp/model/2.0.1/types/TransactionEventResponse.md#transactioneventresponse)
- [`TriggerMessageResponse`](src/ocpp/model/2.0.1/types/TriggerMessageResponse.md#triggermessageresponse)
- [`UnlockConnectorResponse`](src/ocpp/model/2.0.1/types/UnlockConnectorResponse.md#unlockconnectorresponse)
- [`UnpublishFirmwareResponse`](src/ocpp/model/2.0.1/types/UnpublishFirmwareResponse.md#unpublishfirmwareresponse)
- [`UpdateFirmwareResponse`](src/ocpp/model/2.0.1/types/UpdateFirmwareResponse.md#updatefirmwareresponse)

## Type Aliases

### Constructable()

```ts
type Constructable<T> = (...args) => T;
```

Defined in: [00_Base/src/index.ts:434](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L434)

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter | Type    |
| --------- | ------- |
| ...`args` | `any`[] |

#### Returns

`T`

## Variables

### AuthorizationDataSchema

```ts
AuthorizationDataSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L1)

#### Type Declaration

| Name                                                                      | Type       | Default value                                                                                                                                                                                        | Defined in                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id"></a> `$id`                                            | `string`   | `"AuthorizationData"`                                                                                                                                                                                | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L2)     |
| <a id="property-definitions"></a> `definitions`                           | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L13)   |
| `definitions.AdditionalInfoType`                                          | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L99)   |
| `definitions.AdditionalInfoType.description`                              | `string`   | "Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.\r\n"                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L100) |
| `definitions.AdditionalInfoType.javaType`                                 | `string`   | `"AdditionalInfo"`                                                                                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L101) |
| `definitions.AdditionalInfoType.properties`                               | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L103) |
| `definitions.AdditionalInfoType.properties.additionalIdToken`             | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L104) |
| `definitions.AdditionalInfoType.properties.additionalIdToken.description` | `string`   | "This field specifies the additional IdToken.\r\n"                                                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L105) |
| `definitions.AdditionalInfoType.properties.additionalIdToken.maxLength`   | `number`   | `36`                                                                                                                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L107) |
| `definitions.AdditionalInfoType.properties.additionalIdToken.type`        | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L106) |
| `definitions.AdditionalInfoType.properties.type`                          | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L109) |
| `definitions.AdditionalInfoType.properties.type.description`              | `string`   | "This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties.\r\n"                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L110) |
| `definitions.AdditionalInfoType.properties.type.maxLength`                | `number`   | `50`                                                                                                                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L112) |
| `definitions.AdditionalInfoType.properties.type.type`                     | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L111) |
| `definitions.AdditionalInfoType.required`                                 | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L115) |
| `definitions.AdditionalInfoType.type`                                     | `string`   | `"object"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L102) |
| `definitions.AuthorizationStatusEnumType`                                 | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L14)   |
| `definitions.AuthorizationStatusEnumType.additionalProperties`            | `boolean`  | `true`                                                                                                                                                                                               | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L18)   |
| `definitions.AuthorizationStatusEnumType.description`                     | `string`   | "ID\_ Token. Status. Authorization\_ Status\r\nurn:x-oca:ocpp:uid:1:569372\r\nCurrent status of the ID Token.\r\n"                                                                                   | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L15)   |
| `definitions.AuthorizationStatusEnumType.enum`                            | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L19)   |
| `definitions.AuthorizationStatusEnumType.javaType`                        | `string`   | `"AuthorizationStatusEnum"`                                                                                                                                                                          | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L16)   |
| `definitions.AuthorizationStatusEnumType.tsEnumNames`                     | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L31)   |
| `definitions.AuthorizationStatusEnumType.type`                            | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L17)   |
| `definitions.IdTokenEnumType`                                             | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L44)   |
| `definitions.IdTokenEnumType.additionalProperties`                        | `boolean`  | `true`                                                                                                                                                                                               | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L48)   |
| `definitions.IdTokenEnumType.description`                                 | `string`   | "Enumeration of possible idToken types.\r\n"                                                                                                                                                         | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L45)   |
| `definitions.IdTokenEnumType.enum`                                        | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L49)   |
| `definitions.IdTokenEnumType.javaType`                                    | `string`   | `"IdTokenEnum"`                                                                                                                                                                                      | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L46)   |
| `definitions.IdTokenEnumType.tsEnumNames`                                 | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L59)   |
| `definitions.IdTokenEnumType.type`                                        | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L47)   |
| `definitions.IdTokenInfoType`                                             | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L139) |
| `definitions.IdTokenInfoType.javaType`                                    | `string`   | `"IdTokenInfo"`                                                                                                                                                                                      | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:140](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L140) |
| `definitions.IdTokenInfoType.properties`                                  | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:142](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L142) |
| `definitions.IdTokenInfoType.properties.cacheExpiryDateTime`              | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:146](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L146) |
| `definitions.IdTokenInfoType.properties.cacheExpiryDateTime.format`       | `string`   | `"date-time"`                                                                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:148](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L148) |
| `definitions.IdTokenInfoType.properties.cacheExpiryDateTime.type`         | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L147) |
| `definitions.IdTokenInfoType.properties.chargingPriority`                 | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L150) |
| `definitions.IdTokenInfoType.properties.chargingPriority.type`            | `string`   | `"integer"`                                                                                                                                                                                          | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:151](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L151) |
| `definitions.IdTokenInfoType.properties.evseId`                           | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:157](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L157) |
| `definitions.IdTokenInfoType.properties.evseId.additionalItems`           | `boolean`  | `false`                                                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:159](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L159) |
| `definitions.IdTokenInfoType.properties.evseId.items`                     | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:160](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L160) |
| `definitions.IdTokenInfoType.properties.evseId.items.type`                | `string`   | `"integer"`                                                                                                                                                                                          | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:161](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L161) |
| `definitions.IdTokenInfoType.properties.evseId.minItems`                  | `number`   | `1`                                                                                                                                                                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:163](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L163) |
| `definitions.IdTokenInfoType.properties.evseId.type`                      | `string`   | `"array"`                                                                                                                                                                                            | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:158](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L158) |
| `definitions.IdTokenInfoType.properties.groupIdToken`                     | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:165](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L165) |
| `definitions.IdTokenInfoType.properties.groupIdToken.$ref`                | `string`   | `"#/definitions/IdTokenType"`                                                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:166](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L166) |
| `definitions.IdTokenInfoType.properties.language1`                        | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:153](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L153) |
| `definitions.IdTokenInfoType.properties.language1.maxLength`              | `number`   | `8`                                                                                                                                                                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L155) |
| `definitions.IdTokenInfoType.properties.language1.type`                   | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:154](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L154) |
| `definitions.IdTokenInfoType.properties.language2`                        | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:168](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L168) |
| `definitions.IdTokenInfoType.properties.language2.maxLength`              | `number`   | `8`                                                                                                                                                                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:170](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L170) |
| `definitions.IdTokenInfoType.properties.language2.type`                   | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:169](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L169) |
| `definitions.IdTokenInfoType.properties.personalMessage`                  | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:172](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L172) |
| `definitions.IdTokenInfoType.properties.personalMessage.$ref`             | `string`   | `"#/definitions/MessageContentType"`                                                                                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:173](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L173) |
| `definitions.IdTokenInfoType.properties.status`                           | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L143) |
| `definitions.IdTokenInfoType.properties.status.$ref`                      | `string`   | `"#/definitions/AuthorizationStatusEnumType"`                                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L144) |
| `definitions.IdTokenInfoType.required`                                    | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:176](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L176) |
| `definitions.IdTokenInfoType.type`                                        | `string`   | `"object"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L141) |
| `definitions.IdTokenType`                                                 | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L117) |
| `definitions.IdTokenType.javaType`                                        | `string`   | `"IdToken"`                                                                                                                                                                                          | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L118) |
| `definitions.IdTokenType.properties`                                      | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L120) |
| `definitions.IdTokenType.properties.additionalInfo`                       | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L121) |
| `definitions.IdTokenType.properties.additionalInfo.additionalItems`       | `boolean`  | `false`                                                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L123) |
| `definitions.IdTokenType.properties.additionalInfo.items`                 | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:124](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L124) |
| `definitions.IdTokenType.properties.additionalInfo.items.$ref`            | `string`   | `"#/definitions/AdditionalInfoType"`                                                                                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:125](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L125) |
| `definitions.IdTokenType.properties.additionalInfo.minItems`              | `number`   | `1`                                                                                                                                                                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L127) |
| `definitions.IdTokenType.properties.additionalInfo.type`                  | `string`   | `"array"`                                                                                                                                                                                            | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L122) |
| `definitions.IdTokenType.properties.idToken`                              | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L129) |
| `definitions.IdTokenType.properties.idToken.maxLength`                    | `number`   | `36`                                                                                                                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:131](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L131) |
| `definitions.IdTokenType.properties.idToken.type`                         | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L130) |
| `definitions.IdTokenType.properties.type`                                 | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L133) |
| `definitions.IdTokenType.properties.type.$ref`                            | `string`   | `"#/definitions/IdTokenEnumType"`                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L134) |
| `definitions.IdTokenType.required`                                        | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:137](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L137) |
| `definitions.IdTokenType.type`                                            | `string`   | `"object"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L119) |
| `definitions.MessageContentType`                                          | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L70)   |
| `definitions.MessageContentType.description`                              | `string`   | "Message\_ Content\r\nurn:x-enexis:ecdm:uid:2:234490\r\nContains message details, for a message to be displayed on a Charging Station.\r\n\r\n"                                                      | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L71)   |
| `definitions.MessageContentType.javaType`                                 | `string`   | `"MessageContent"`                                                                                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L72)   |
| `definitions.MessageContentType.properties`                               | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L74)   |
| `definitions.MessageContentType.properties.content`                       | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L83)   |
| `definitions.MessageContentType.properties.content.description`           | `string`   | "Message\_ Content. Content. Message\r\nurn:x-enexis:ecdm:uid:1:570852\r\nMessage contents.\r\n\r\n"                                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L84)   |
| `definitions.MessageContentType.properties.content.maxLength`             | `number`   | `512`                                                                                                                                                                                                | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L86)   |
| `definitions.MessageContentType.properties.content.type`                  | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L85)   |
| `definitions.MessageContentType.properties.format`                        | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L75)   |
| `definitions.MessageContentType.properties.format.$ref`                   | `string`   | `"#/definitions/MessageFormatEnumType"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L76)   |
| `definitions.MessageContentType.properties.language`                      | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L78)   |
| `definitions.MessageContentType.properties.language.description`          | `string`   | "Message\_ Content. Language. Language\_ Code\r\nurn:x-enexis:ecdm:uid:1:570849\r\nMessage language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,\[RFC5646\]&gt;&gt;.\r\n" | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L79)   |
| `definitions.MessageContentType.properties.language.maxLength`            | `number`   | `8`                                                                                                                                                                                                  | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L81)   |
| `definitions.MessageContentType.properties.language.type`                 | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L80)   |
| `definitions.MessageContentType.required`                                 | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L89)   |
| `definitions.MessageContentType.type`                                     | `string`   | `"object"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L73)   |
| `definitions.MessageFormatEnumType`                                       | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L91)   |
| `definitions.MessageFormatEnumType.additionalProperties`                  | `boolean`  | `true`                                                                                                                                                                                               | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:95](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L95)   |
| `definitions.MessageFormatEnumType.description`                           | `string`   | "Message\_ Content. Format. Message\_ Format\_ Code\r\nurn:x-enexis:ecdm:uid:1:570848\r\nFormat of the message.\r\n"                                                                                 | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L92)   |
| `definitions.MessageFormatEnumType.enum`                                  | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L96)   |
| `definitions.MessageFormatEnumType.javaType`                              | `string`   | `"MessageFormatEnum"`                                                                                                                                                                                | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L93)   |
| `definitions.MessageFormatEnumType.tsEnumNames`                           | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:97](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L97)   |
| `definitions.MessageFormatEnumType.type`                                  | `string`   | `"string"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:94](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L94)   |
| <a id="property-properties"></a> `properties`                             | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L4)     |
| `properties.idToken`                                                      | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L5)     |
| `properties.idToken.$ref`                                                 | `string`   | `"#/definitions/IdTokenType"`                                                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L6)     |
| `properties.idTokenInfo`                                                  | `object`   | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L8)     |
| `properties.idTokenInfo.$ref`                                             | `string`   | `"#/definitions/IdTokenInfoType"`                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L9)     |
| <a id="property-required"></a> `required`                                 | `string`[] | -                                                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L12)   |
| <a id="property-type"></a> `type`                                         | `string`   | `"object"`                                                                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/AuthorizationDataSchema.json#L3)     |

---

### BootConfigSchema

```ts
BootConfigSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L1)

#### Type Declaration

| Name                                                               | Type       | Default value                                                                                                       | Defined in                                                                                                                                                                                                                |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id-1"></a> `$id`                                   | `string`   | `"BootConfigSchema"`                                                                                                | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L2)   |
| <a id="property-definitions-1"></a> `definitions`                  | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L4)   |
| `definitions.RegistrationStatusEnumType`                           | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L5)   |
| `definitions.RegistrationStatusEnumType.additionalProperties`      | `boolean`  | `true`                                                                                                              | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L9)   |
| `definitions.RegistrationStatusEnumType.description`               | `string`   | "This contains whether the Charging Station has been registered\r\nwithin the CSMS.\r\n"                            | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L6)   |
| `definitions.RegistrationStatusEnumType.enum`                      | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L10) |
| `definitions.RegistrationStatusEnumType.javaType`                  | `string`   | `"RegistrationStatusEnum"`                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L7)   |
| `definitions.RegistrationStatusEnumType.tsEnumNames`               | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L11) |
| `definitions.RegistrationStatusEnumType.type`                      | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L8)   |
| `definitions.StatusInfoType`                                       | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L13) |
| `definitions.StatusInfoType.description`                           | `string`   | "Element providing more information about the status.\r\n"                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L14) |
| `definitions.StatusInfoType.javaType`                              | `string`   | `"StatusInfo"`                                                                                                      | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L15) |
| `definitions.StatusInfoType.properties`                            | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L17) |
| `definitions.StatusInfoType.properties.additionalInfo`             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L23) |
| `definitions.StatusInfoType.properties.additionalInfo.description` | `string`   | "Additional text to provide detailed information.\r\n"                                                              | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L24) |
| `definitions.StatusInfoType.properties.additionalInfo.maxLength`   | `number`   | `512`                                                                                                               | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L26) |
| `definitions.StatusInfoType.properties.additionalInfo.type`        | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L25) |
| `definitions.StatusInfoType.properties.reasonCode`                 | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L18) |
| `definitions.StatusInfoType.properties.reasonCode.description`     | `string`   | "A predefined code for the reason why the status is returned in this response. The string is case-insensitive.\r\n" | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L19) |
| `definitions.StatusInfoType.properties.reasonCode.maxLength`       | `number`   | `20`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L21) |
| `definitions.StatusInfoType.properties.reasonCode.type`            | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L20) |
| `definitions.StatusInfoType.required`                              | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L29) |
| `definitions.StatusInfoType.type`                                  | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L16) |
| <a id="property-description"></a> `description`                    | `string`   | `"Boot configuration used to determine boot process for a charging station"`                                        | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L3)   |
| <a id="property-properties-1"></a> `properties`                    | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L32) |
| `properties.bootRetryInterval`                                     | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L36) |
| `properties.bootRetryInterval.type`                                | `string`   | `"integer"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L37) |
| `properties.bootWithRejectedVariables`                             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L55) |
| `properties.bootWithRejectedVariables.type`                        | `string`   | `"boolean"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L56) |
| `properties.getBaseReportOnPending`                                | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L45) |
| `properties.getBaseReportOnPending.type`                           | `string`   | `"boolean"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L46) |
| `properties.heartbeatInterval`                                     | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L33) |
| `properties.heartbeatInterval.type`                                | `string`   | `"integer"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L34) |
| `properties.setVariableIds`                                        | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L48) |
| `properties.setVariableIds.additionalItems`                        | `boolean`  | `false`                                                                                                             | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L50) |
| `properties.setVariableIds.items`                                  | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L51) |
| `properties.setVariableIds.items.type`                             | `string`   | `"integer"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L52) |
| `properties.setVariableIds.type`                                   | `string`   | `"array"`                                                                                                           | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L49) |
| `properties.status`                                                | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L39) |
| `properties.status.$ref`                                           | `string`   | `"#/definitions/RegistrationStatusEnumType"`                                                                        | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L40) |
| `properties.statusInfo`                                            | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L42) |
| `properties.statusInfo.$ref`                                       | `string`   | `"#/definitions/StatusInfoType"`                                                                                    | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L43) |
| <a id="property-required-1"></a> `required`                        | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L59) |
| <a id="property-type-1"></a> `type`                                | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/BootConfigSchema.json#L60) |

---

### ChargingStationTypeSchema

```ts
ChargingStationTypeSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L1)

#### Type Declaration

| Name                                                  | Type       | Default value                                                                                                                                                           | Defined in                                                                                                                                                                                                                                  |
| ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id-2"></a> `$id`                      | `string`   | `"ChargingStationTypeSchema"`                                                                                                                                           | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L2)   |
| <a id="property-definitions-2"></a> `definitions`     | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L3)   |
| `definitions.CustomDataType`                          | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L4)   |
| `definitions.CustomDataType.additionalProperties`     | `object`   | `{}`                                                                                                                                                                    | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L5)   |
| `definitions.CustomDataType.description`              | `string`   | `"Represents OCPP CustomData. Allows vendor-specific extension properties."`                                                                                            | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L6)   |
| `definitions.CustomDataType.properties`               | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L7)   |
| `definitions.CustomDataType.properties.vendorId`      | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L8)   |
| `definitions.CustomDataType.properties.vendorId.type` | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L9)   |
| `definitions.CustomDataType.required`                 | `string`[] | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L12) |
| `definitions.CustomDataType.type`                     | `string`   | `"object"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L13) |
| `definitions.ModemType`                               | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L15) |
| `definitions.ModemType.description`                   | `string`   | "Wireless\_ Communication\_ Module\nurn:x-oca:ocpp:uid:2:233306\nDefines parameters required for initiating and maintaining wireless communication with other devices." | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L16) |
| `definitions.ModemType.properties`                    | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L17) |
| `definitions.ModemType.properties.customData`         | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L18) |
| `definitions.ModemType.properties.customData.$ref`    | `string`   | `"#/definitions/CustomDataType"`                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L19) |
| `definitions.ModemType.properties.iccid`              | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L21) |
| `definitions.ModemType.properties.iccid.description`  | `string`   | "Wireless\_ Communication\_ Module. ICCID. CI20\_ Text\nurn:x-oca:ocpp:uid:1:569327\nThis contains the ICCID of the modem’s SIM card."                                  | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L22) |
| `definitions.ModemType.properties.iccid.type`         | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L23) |
| `definitions.ModemType.properties.imsi`               | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L25) |
| `definitions.ModemType.properties.imsi.description`   | `string`   | "Wireless\_ Communication\_ Module. IMSI. CI20\_ Text\nurn:x-oca:ocpp:uid:1:569328\nThis contains the IMSI of the modem’s SIM card."                                    | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L26) |
| `definitions.ModemType.properties.imsi.type`          | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L27) |
| `definitions.ModemType.type`                          | `string`   | `"object"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L30) |
| <a id="property-description-1"></a> `description`     | `string`   | "Charge\_ Point\nurn:x-oca:ocpp:uid:2:233122\nThe physical system where an Electrical Vehicle (EV) can be charged."                                                     | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L33) |
| <a id="property-properties-2"></a> `properties`       | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L34) |
| `properties.customData`                               | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L35) |
| `properties.customData.$ref`                          | `string`   | `"#/definitions/CustomDataType"`                                                                                                                                        | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L36) |
| `properties.firmwareVersion`                          | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L38) |
| `properties.firmwareVersion.description`              | `string`   | `"This contains the firmware version of the Charging Station."`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L39) |
| `properties.firmwareVersion.type`                     | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L40) |
| `properties.model`                                    | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L42) |
| `properties.model.description`                        | `string`   | "Device. Model. CI20\_ Text\nurn:x-oca:ocpp:uid:1:569325\nDefines the model of the device."                                                                             | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L43) |
| `properties.model.type`                               | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L44) |
| `properties.modem`                                    | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L46) |
| `properties.modem.$ref`                               | `string`   | `"#/definitions/ModemType"`                                                                                                                                             | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L47) |
| `properties.serialNumber`                             | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L49) |
| `properties.serialNumber.description`                 | `string`   | "Device. Serial\_ Number. Serial\_ Number\nurn:x-oca:ocpp:uid:1:569324\nVendor-specific device identifier."                                                             | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L50) |
| `properties.serialNumber.type`                        | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L51) |
| `properties.vendorName`                               | `object`   | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L53) |
| `properties.vendorName.description`                   | `string`   | `"Identifies the vendor (not necessarily in a unique manner)."`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L54) |
| `properties.vendorName.type`                          | `string`   | `"string"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L55) |
| <a id="property-required-2"></a> `required`           | `string`[] | -                                                                                                                                                                       | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L58) |
| <a id="property-type-2"></a> `type`                   | `string`   | `"object"`                                                                                                                                                              | [00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ChargingStationTypeSchema.json#L59) |

---

### LOG_LEVEL_OCPP

```ts
const LOG_LEVEL_OCPP: 10 = 10;
```

Defined in: [00_Base/src/index.ts:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L111)

---

### OCPP1_6_CALL_RESULT_SCHEMA_MAP

```ts
const OCPP1_6_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object>;
```

Defined in: [00_Base/src/index.ts:247](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L247)

---

### OCPP1_6_CALL_SCHEMA_MAP

```ts
const OCPP1_6_CALL_SCHEMA_MAP: Map<CallAction, object>;
```

Defined in: [00_Base/src/index.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L123)

---

### OCPP2_0_1_CALL_RESULT_SCHEMA_MAP

```ts
const OCPP2_0_1_CALL_RESULT_SCHEMA_MAP: Map<CallAction, object>;
```

Defined in: [00_Base/src/index.ts:284](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L284)

---

### OCPP2_0_1_CALL_SCHEMA_MAP

```ts
const OCPP2_0_1_CALL_SCHEMA_MAP: Map<CallAction, object>;
```

Defined in: [00_Base/src/index.ts:162](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/index.ts#L162)

---

### ReportDataTypeSchema

```ts
ReportDataTypeSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L1)

#### Type Declaration

| Name                                                                         | Type       | Default value                                 | Defined in                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id-3"></a> `$id`                                             | `string`   | `"ReportDataTypeSchema"`                      | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L2)     |
| <a id="property-definitions-3"></a> `definitions`                            | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L3)     |
| `definitions.AttributeEnumType`                                              | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L4)     |
| `definitions.AttributeEnumType.default`                                      | `string`   | `"Actual"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L5)     |
| `definitions.AttributeEnumType.enum`                                         | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L6)     |
| `definitions.AttributeEnumType.javaType`                                     | `string`   | `"AttributeEnum"`                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L7)     |
| `definitions.AttributeEnumType.tsEnumNames`                                  | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L8)     |
| `definitions.AttributeEnumType.type`                                         | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L9)     |
| `definitions.ComponentType`                                                  | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L11)   |
| `definitions.ComponentType.javaType`                                         | `string`   | `"Component"`                                 | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L12)   |
| `definitions.ComponentType.properties`                                       | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L13)   |
| `definitions.ComponentType.properties.evse`                                  | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L14)   |
| `definitions.ComponentType.properties.evse.$ref`                             | `string`   | `"#/definitions/EVSEType"`                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L15)   |
| `definitions.ComponentType.properties.instance`                              | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L17)   |
| `definitions.ComponentType.properties.instance.maxLength`                    | `number`   | `50`                                          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L18)   |
| `definitions.ComponentType.properties.instance.type`                         | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L19)   |
| `definitions.ComponentType.properties.name`                                  | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L21)   |
| `definitions.ComponentType.properties.name.maxLength`                        | `number`   | `50`                                          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L22)   |
| `definitions.ComponentType.properties.name.type`                             | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L23)   |
| `definitions.ComponentType.required`                                         | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L26)   |
| `definitions.ComponentType.type`                                             | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L27)   |
| `definitions.DataEnumType`                                                   | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L29)   |
| `definitions.DataEnumType.enum`                                              | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L30)   |
| `definitions.DataEnumType.javaType`                                          | `string`   | `"DataEnum"`                                  | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L41)   |
| `definitions.DataEnumType.tsEnumNames`                                       | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L42)   |
| `definitions.DataEnumType.type`                                              | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L52)   |
| `definitions.EVSEType`                                                       | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L54)   |
| `definitions.EVSEType.javaType`                                              | `string`   | `"EVSE"`                                      | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L55)   |
| `definitions.EVSEType.properties`                                            | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L56)   |
| `definitions.EVSEType.properties.connectorId`                                | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L57)   |
| `definitions.EVSEType.properties.connectorId.type`                           | `string`   | `"integer"`                                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L58)   |
| `definitions.EVSEType.properties.id`                                         | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L60)   |
| `definitions.EVSEType.properties.id.type`                                    | `string`   | `"integer"`                                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L61)   |
| `definitions.EVSEType.required`                                              | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L64)   |
| `definitions.EVSEType.type`                                                  | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L65)   |
| `definitions.MutabilityEnumType`                                             | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L67)   |
| `definitions.MutabilityEnumType.default`                                     | `string`   | `"ReadWrite"`                                 | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L68)   |
| `definitions.MutabilityEnumType.enum`                                        | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L69)   |
| `definitions.MutabilityEnumType.javaType`                                    | `string`   | `"MutabilityEnum"`                            | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L70)   |
| `definitions.MutabilityEnumType.tsEnumNames`                                 | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L71)   |
| `definitions.MutabilityEnumType.type`                                        | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:72](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L72)   |
| `definitions.VariableAttributeType`                                          | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L74)   |
| `definitions.VariableAttributeType.javaType`                                 | `string`   | `"VariableAttribute"`                         | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L75)   |
| `definitions.VariableAttributeType.properties`                               | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L76)   |
| `definitions.VariableAttributeType.properties.constant`                      | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L77)   |
| `definitions.VariableAttributeType.properties.constant.default`              | `boolean`  | `false`                                       | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L78)   |
| `definitions.VariableAttributeType.properties.constant.type`                 | `string`   | `"boolean"`                                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L79)   |
| `definitions.VariableAttributeType.properties.mutability`                    | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L81)   |
| `definitions.VariableAttributeType.properties.mutability.$ref`               | `string`   | `"#/definitions/MutabilityEnumType"`          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L82)   |
| `definitions.VariableAttributeType.properties.persistent`                    | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L84)   |
| `definitions.VariableAttributeType.properties.persistent.default`            | `boolean`  | `false`                                       | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L85)   |
| `definitions.VariableAttributeType.properties.persistent.type`               | `string`   | `"boolean"`                                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:86](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L86)   |
| `definitions.VariableAttributeType.properties.type`                          | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L88)   |
| `definitions.VariableAttributeType.properties.type.$ref`                     | `string`   | `"#/definitions/AttributeEnumType"`           | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L89)   |
| `definitions.VariableAttributeType.properties.value`                         | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L91)   |
| `definitions.VariableAttributeType.properties.value.maxLength`               | `number`   | `2500`                                        | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L92)   |
| `definitions.VariableAttributeType.properties.value.type`                    | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L93)   |
| `definitions.VariableAttributeType.type`                                     | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L96)   |
| `definitions.VariableCharacteristicsType`                                    | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L98)   |
| `definitions.VariableCharacteristicsType.javaType`                           | `string`   | `"VariableCharacteristics"`                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L99)   |
| `definitions.VariableCharacteristicsType.properties`                         | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L100) |
| `definitions.VariableCharacteristicsType.properties.dataType`                | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L101) |
| `definitions.VariableCharacteristicsType.properties.dataType.$ref`           | `string`   | `"#/definitions/DataEnumType"`                | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L102) |
| `definitions.VariableCharacteristicsType.properties.maxLimit`                | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L104) |
| `definitions.VariableCharacteristicsType.properties.maxLimit.type`           | `string`   | `"number"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L105) |
| `definitions.VariableCharacteristicsType.properties.minLimit`                | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L107) |
| `definitions.VariableCharacteristicsType.properties.minLimit.type`           | `string`   | `"number"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L108) |
| `definitions.VariableCharacteristicsType.properties.supportsMonitoring`      | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:110](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L110) |
| `definitions.VariableCharacteristicsType.properties.supportsMonitoring.type` | `string`   | `"boolean"`                                   | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L111) |
| `definitions.VariableCharacteristicsType.properties.unit`                    | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:113](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L113) |
| `definitions.VariableCharacteristicsType.properties.unit.maxLength`          | `number`   | `16`                                          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L114) |
| `definitions.VariableCharacteristicsType.properties.unit.type`               | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L115) |
| `definitions.VariableCharacteristicsType.properties.valuesList`              | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:117](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L117) |
| `definitions.VariableCharacteristicsType.properties.valuesList.maxLength`    | `number`   | `1000`                                        | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L118) |
| `definitions.VariableCharacteristicsType.properties.valuesList.type`         | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:119](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L119) |
| `definitions.VariableCharacteristicsType.required`                           | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L122) |
| `definitions.VariableCharacteristicsType.type`                               | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L123) |
| `definitions.VariableType`                                                   | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:125](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L125) |
| `definitions.VariableType.javaType`                                          | `string`   | `"Variable"`                                  | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:126](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L126) |
| `definitions.VariableType.properties`                                        | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:127](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L127) |
| `definitions.VariableType.properties.instance`                               | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:128](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L128) |
| `definitions.VariableType.properties.instance.maxLength`                     | `number`   | `50`                                          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L129) |
| `definitions.VariableType.properties.instance.type`                          | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L130) |
| `definitions.VariableType.properties.name`                                   | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:132](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L132) |
| `definitions.VariableType.properties.name.maxLength`                         | `number`   | `50`                                          | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:133](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L133) |
| `definitions.VariableType.properties.name.type`                              | `string`   | `"string"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L134) |
| `definitions.VariableType.required`                                          | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:137](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L137) |
| `definitions.VariableType.type`                                              | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L138) |
| <a id="property-javatype"></a> `javaType`                                    | `string`   | `"ReportData"`                                | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:141](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L141) |
| <a id="property-properties-3"></a> `properties`                              | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:142](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L142) |
| `properties.component`                                                       | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:143](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L143) |
| `properties.component.$ref`                                                  | `string`   | `"#/definitions/ComponentType"`               | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:144](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L144) |
| `properties.variable`                                                        | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:146](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L146) |
| `properties.variable.$ref`                                                   | `string`   | `"#/definitions/VariableType"`                | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L147) |
| `properties.variableAttribute`                                               | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:149](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L149) |
| `properties.variableAttribute.additionalItems`                               | `boolean`  | `false`                                       | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:150](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L150) |
| `properties.variableAttribute.items`                                         | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:151](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L151) |
| `properties.variableAttribute.items.$ref`                                    | `string`   | `"#/definitions/VariableAttributeType"`       | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:152](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L152) |
| `properties.variableAttribute.maxItems`                                      | `number`   | `4`                                           | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:154](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L154) |
| `properties.variableAttribute.minItems`                                      | `number`   | `1`                                           | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L155) |
| `properties.variableAttribute.type`                                          | `string`   | `"array"`                                     | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:156](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L156) |
| `properties.variableCharacteristics`                                         | `object`   | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:158](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L158) |
| `properties.variableCharacteristics.$ref`                                    | `string`   | `"#/definitions/VariableCharacteristicsType"` | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:159](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L159) |
| <a id="property-required-3"></a> `required`                                  | `string`[] | -                                             | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:162](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L162) |
| <a id="property-type-3"></a> `type`                                          | `string`   | `"object"`                                    | [00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json:163](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/ReportDataTypeSchema.json#L163) |

---

### SetVariableResultTypeSchema

```ts
SetVariableResultTypeSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L1)

#### Type Declaration

| Name                                                               | Type       | Default value                                                                                                       | Defined in                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-additionalproperties"></a> `additionalProperties`  | `boolean`  | `true`                                                                                                              | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:100](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L100) |
| <a id="property-definitions-4"></a> `definitions`                  | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L2)     |
| `definitions.AttributeEnumType`                                    | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L3)     |
| `definitions.AttributeEnumType.default`                            | `string`   | `"Actual"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L4)     |
| `definitions.AttributeEnumType.enum`                               | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L5)     |
| `definitions.AttributeEnumType.javaType`                           | `string`   | `"AttributeEnum"`                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L6)     |
| `definitions.AttributeEnumType.tsEnumNames`                        | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L7)     |
| `definitions.AttributeEnumType.type`                               | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L8)     |
| `definitions.ComponentType`                                        | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L10)   |
| `definitions.ComponentType.javaType`                               | `string`   | `"Component"`                                                                                                       | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L11)   |
| `definitions.ComponentType.properties`                             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L12)   |
| `definitions.ComponentType.properties.evse`                        | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L13)   |
| `definitions.ComponentType.properties.evse.$ref`                   | `string`   | `"#/definitions/EVSEType"`                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L14)   |
| `definitions.ComponentType.properties.instance`                    | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L16)   |
| `definitions.ComponentType.properties.instance.maxLength`          | `number`   | `50`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L17)   |
| `definitions.ComponentType.properties.instance.type`               | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L18)   |
| `definitions.ComponentType.properties.name`                        | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L20)   |
| `definitions.ComponentType.properties.name.maxLength`              | `number`   | `50`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L21)   |
| `definitions.ComponentType.properties.name.type`                   | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L22)   |
| `definitions.ComponentType.required`                               | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L25)   |
| `definitions.ComponentType.type`                                   | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L26)   |
| `definitions.EVSEType`                                             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L28)   |
| `definitions.EVSEType.javaType`                                    | `string`   | `"EVSE"`                                                                                                            | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L29)   |
| `definitions.EVSEType.properties`                                  | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L30)   |
| `definitions.EVSEType.properties.connectorId`                      | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L31)   |
| `definitions.EVSEType.properties.connectorId.type`                 | `string`   | `"integer"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L32)   |
| `definitions.EVSEType.properties.id`                               | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:34](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L34)   |
| `definitions.EVSEType.properties.id.type`                          | `string`   | `"integer"`                                                                                                         | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L35)   |
| `definitions.EVSEType.required`                                    | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L38)   |
| `definitions.EVSEType.type`                                        | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L39)   |
| `definitions.SetVariableStatusEnumType`                            | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L75)   |
| `definitions.SetVariableStatusEnumType.additionalProperties`       | `boolean`  | `true`                                                                                                              | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:79](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L79)   |
| `definitions.SetVariableStatusEnumType.description`                | `string`   | "Result status of setting the variable.\r\n"                                                                        | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L76)   |
| `definitions.SetVariableStatusEnumType.enum`                       | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:80](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L80)   |
| `definitions.SetVariableStatusEnumType.javaType`                   | `string`   | `"SetVariableStatusEnum"`                                                                                           | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L77)   |
| `definitions.SetVariableStatusEnumType.tsEnumNames`                | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L88)   |
| `definitions.SetVariableStatusEnumType.type`                       | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L78)   |
| `definitions.StatusInfoType`                                       | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L56)   |
| `definitions.StatusInfoType.additionalProperties`                  | `boolean`  | `true`                                                                                                              | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:60](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L60)   |
| `definitions.StatusInfoType.description`                           | `string`   | "Element providing more information about the status.\r\n"                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L57)   |
| `definitions.StatusInfoType.javaType`                              | `string`   | `"StatusInfo"`                                                                                                      | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L58)   |
| `definitions.StatusInfoType.properties`                            | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L61)   |
| `definitions.StatusInfoType.properties.additionalInfo`             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L67)   |
| `definitions.StatusInfoType.properties.additionalInfo.description` | `string`   | "Additional text to provide detailed information.\r\n"                                                              | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L68)   |
| `definitions.StatusInfoType.properties.additionalInfo.maxLength`   | `number`   | `512`                                                                                                               | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L70)   |
| `definitions.StatusInfoType.properties.additionalInfo.type`        | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L69)   |
| `definitions.StatusInfoType.properties.reasonCode`                 | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L62)   |
| `definitions.StatusInfoType.properties.reasonCode.description`     | `string`   | "A predefined code for the reason why the status is returned in this response. The string is case-insensitive.\r\n" | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L63)   |
| `definitions.StatusInfoType.properties.reasonCode.maxLength`       | `number`   | `20`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L65)   |
| `definitions.StatusInfoType.properties.reasonCode.type`            | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L64)   |
| `definitions.StatusInfoType.required`                              | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L73)   |
| `definitions.StatusInfoType.type`                                  | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:59](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L59)   |
| `definitions.VariableType`                                         | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L41)   |
| `definitions.VariableType.javaType`                                | `string`   | `"Variable"`                                                                                                        | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L42)   |
| `definitions.VariableType.properties`                              | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L43)   |
| `definitions.VariableType.properties.instance`                     | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L44)   |
| `definitions.VariableType.properties.instance.maxLength`           | `number`   | `50`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L45)   |
| `definitions.VariableType.properties.instance.type`                | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L46)   |
| `definitions.VariableType.properties.name`                         | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L48)   |
| `definitions.VariableType.properties.name.maxLength`               | `number`   | `50`                                                                                                                | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L49)   |
| `definitions.VariableType.properties.name.type`                    | `string`   | `"string"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L50)   |
| `definitions.VariableType.required`                                | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L53)   |
| `definitions.VariableType.type`                                    | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L54)   |
| <a id="property-javatype-1"></a> `javaType`                        | `string`   | `"SetVariableResult"`                                                                                               | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:98](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L98)   |
| <a id="property-properties-4"></a> `properties`                    | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L101) |
| `properties.attributeStatus`                                       | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:105](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L105) |
| `properties.attributeStatus.$ref`                                  | `string`   | `"#/definitions/SetVariableStatusEnumType"`                                                                         | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L106) |
| `properties.attributeStatusInfo`                                   | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:108](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L108) |
| `properties.attributeStatusInfo.$ref`                              | `string`   | `"#/definitions/StatusInfoType"`                                                                                    | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:109](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L109) |
| `properties.attributeType`                                         | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L102) |
| `properties.attributeType.$ref`                                    | `string`   | `"#/definitions/AttributeEnumType"`                                                                                 | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:103](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L103) |
| `properties.component`                                             | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:111](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L111) |
| `properties.component.$ref`                                        | `string`   | `"#/definitions/ComponentType"`                                                                                     | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L112) |
| `properties.variable`                                              | `object`   | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:114](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L114) |
| `properties.variable.$ref`                                         | `string`   | `"#/definitions/VariableType"`                                                                                      | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L115) |
| <a id="property-required-4"></a> `required`                        | `string`[] | -                                                                                                                   | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:118](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L118) |
| <a id="property-type-4"></a> `type`                                | `string`   | `"object"`                                                                                                          | [00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/SetVariableResultTypeSchema.json#L99)   |

---

### UpdateChargingStationPasswordSchema

```ts
UpdateChargingStationPasswordSchema: object;
```

Defined in: [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:1](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L1)

#### Type Declaration

| Name                                                                | Type       | Default value                                  | Defined in                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------- | ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id-4"></a> `$id`                                    | `string`   | `"UpdateChargingStationPasswordRequestSchema"` | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:2](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L2)   |
| <a id="property-additionalproperties-1"></a> `additionalProperties` | `boolean`  | `true`                                         | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L20) |
| <a id="property-properties-5"></a> `properties`                     | `object`   | -                                              | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:4](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L4)   |
| `properties.password`                                               | `object`   | -                                              | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L8)   |
| `properties.password.maxLength`                                     | `number`   | `40`                                           | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L11) |
| `properties.password.minLength`                                     | `number`   | `16`                                           | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L10) |
| `properties.password.pattern`                                       | `string`   | "^\[a-zA-Z0-9\*\\-\_=:+\|@.\]\{16,40\}$"       | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L12) |
| `properties.password.type`                                          | `string`   | `"string"`                                     | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L9)   |
| `properties.setOnCharger`                                           | `object`   | -                                              | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L14) |
| `properties.setOnCharger.default`                                   | `boolean`  | `false`                                        | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L16) |
| `properties.setOnCharger.type`                                      | `string`   | `"boolean"`                                    | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L15) |
| `properties.stationId`                                              | `object`   | -                                              | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L5)   |
| `properties.stationId.type`                                         | `string`   | `"string"`                                     | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L6)   |
| <a id="property-required-5"></a> `required`                         | `string`[] | -                                              | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L19) |
| <a id="property-type-5"></a> `type`                                 | `string`   | `"object"`                                     | [00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json:3](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/persistence/schemas/UpdateChargingStationPasswordRequestSchema.json#L3)   |

## References

### AbstractConnectionManager

Re-exports [AbstractConnectionManager](src/interfaces/messages/AbstractConnectionManager.md#abstract-abstractconnectionmanager)

---

### AbstractMessageHandler

Re-exports [AbstractMessageHandler](src/interfaces/messages/AbstractMessageHandler.md#abstract-abstractmessagehandler)

---

### AbstractMessageRouter

Re-exports [AbstractMessageRouter](src/interfaces/router/AbstractRouter.md#abstract-abstractmessagerouter)

---

### AbstractMessageSender

Re-exports [AbstractMessageSender](src/interfaces/messages/AbstractMessageSender.md#abstract-abstractmessagesender)

---

### AbstractModule

Re-exports [AbstractModule](src/interfaces/modules/AbstractModule.md#abstract-abstractmodule)

---

### AbstractModuleApi

Re-exports [AbstractModuleApi](src/interfaces/api/AbstractModuleApi.md#abstract-abstractmoduleapi)

---

### ACChargingParametersSchema

Re-exports [ACChargingParametersSchema](src/interfaces/dto/types/charging.parameters.md#acchargingparametersschema)

---

### ACChargingParametersType

Re-exports [ACChargingParametersType](src/interfaces/dto/types/charging.parameters.md#acchargingparameterstype)

---

### AdditionalInfo

Re-exports [AdditionalInfo](src/interfaces/dto/types/authorization.md#additionalinfo)

---

### AdditionalInfoSchema

Re-exports [AdditionalInfoSchema](src/interfaces/dto/types/authorization.md#additionalinfoschema)

---

### ApiAuthenticationResult

Re-exports [ApiAuthenticationResult](src/interfaces/api/auth/ApiAuthenticationResult.md#apiauthenticationresult)

---

### ApiAuthorizationResult

Re-exports [ApiAuthorizationResult](src/interfaces/api/auth/ApiAuthorizationResult.md#apiauthorizationresult)

---

### AsDataEndpoint

Re-exports [AsDataEndpoint](src/interfaces/api/AsDataEndpoint.md#asdataendpoint)

---

### AsHandler

Re-exports [AsHandler](src/interfaces/modules/AsHandler.md#ashandler)

---

### AsMessageEndpoint

Re-exports [AsMessageEndpoint](src/interfaces/api/AsMessageEndpoint.md#asmessageendpoint)

---

### assert

Re-exports [assert](src/assertion/assertion.md#assert)

---

### AsyncJobActionEnum

Re-exports [AsyncJobActionEnum](src/interfaces/dto/types/enums.md#asyncjobactionenum)

---

### AsyncJobActionEnumType

Re-exports [AsyncJobActionEnumType](src/interfaces/dto/types/enums.md#asyncjobactionenumtype)

---

### AsyncJobActionSchema

Re-exports [AsyncJobActionSchema](src/interfaces/dto/types/enums.md#asyncjobactionschema)

---

### AsyncJobCreate

Re-exports [AsyncJobCreate](src/interfaces/dto/async.job.dto.md#asyncjobcreate)

---

### AsyncJobCreateSchema

Re-exports [AsyncJobCreateSchema](src/interfaces/dto/async.job.dto.md#asyncjobcreateschema)

---

### AsyncJobDto

Re-exports [AsyncJobDto](src/interfaces/dto/async.job.dto.md#asyncjobdto)

---

### AsyncJobNameEnum

Re-exports [AsyncJobNameEnum](src/interfaces/dto/types/enums.md#asyncjobnameenum)

---

### AsyncJobNameEnumType

Re-exports [AsyncJobNameEnumType](src/interfaces/dto/types/enums.md#asyncjobnameenumtype)

---

### AsyncJobNameSchema

Re-exports [AsyncJobNameSchema](src/interfaces/dto/types/enums.md#asyncjobnameschema)

---

### AsyncJobProps

Re-exports [AsyncJobProps](src/interfaces/dto/async.job.dto.md#asyncjobprops)

---

### AsyncJobRequest

Re-exports [AsyncJobRequest](src/interfaces/dto/async.job.dto.md#asyncjobrequest)

---

### AsyncJobRequestSchema

Re-exports [AsyncJobRequestSchema](src/interfaces/dto/async.job.dto.md#asyncjobrequestschema)

---

### AsyncJobSchema

Re-exports [AsyncJobSchema](src/interfaces/dto/async.job.dto.md#asyncjobschema)

---

### asyncJobSchemas

Re-exports [asyncJobSchemas](src/interfaces/dto/async.job.dto.md#asyncjobschemas)

---

### AuthenticationOptions

Re-exports [AuthenticationOptions](src/interfaces/router/AuthenticationOptions.md#authenticationoptions)

---

### AuthorizationCreate

Re-exports [AuthorizationCreate](src/interfaces/dto/authorization.dto.md#authorizationcreate)

---

### AuthorizationCreateSchema

Re-exports [AuthorizationCreateSchema](src/interfaces/dto/authorization.dto.md#authorizationcreateschema)

---

### AuthorizationDto

Re-exports [AuthorizationDto](src/interfaces/dto/authorization.dto.md#authorizationdto)

---

### AuthorizationProps

Re-exports [AuthorizationProps](src/interfaces/dto/authorization.dto.md#authorizationprops)

---

### AuthorizationSchema

Re-exports [AuthorizationSchema](src/interfaces/dto/authorization.dto.md#authorizationschema)

---

### authorizationSchemas

Re-exports [authorizationSchemas](src/interfaces/dto/authorization.dto.md#authorizationschemas)

---

### AuthorizationSecurity

Re-exports [AuthorizationSecurity](src/interfaces/api/AuthorizationSecurity.md#authorizationsecurity)

---

### AuthorizationStatusEnum

Re-exports [AuthorizationStatusEnum](src/interfaces/dto/types/enums.md#authorizationstatusenum)

---

### AuthorizationStatusEnumSchema

Re-exports [AuthorizationStatusEnumSchema](src/interfaces/dto/types/enums.md#authorizationstatusenumschema)

---

### AuthorizationStatusEnumType

Re-exports [AuthorizationStatusEnumType](src/interfaces/dto/types/enums.md#authorizationstatusenumtype)

---

### AuthorizationUpdate

Re-exports [AuthorizationUpdate](src/interfaces/dto/authorization.dto.md#authorizationupdate)

---

### AuthorizationUpdateSchema

Re-exports [AuthorizationUpdateSchema](src/interfaces/dto/authorization.dto.md#authorizationupdateschema)

---

### AuthorizationWhitelistEnum

Re-exports [AuthorizationWhitelistEnum](src/interfaces/dto/types/enums.md#authorizationwhitelistenum)

---

### AuthorizationWhitelistEnumSchema

Re-exports [AuthorizationWhitelistEnumSchema](src/interfaces/dto/types/enums.md#authorizationwhitelistenumschema)

---

### AuthorizationWhitelistEnumType

Re-exports [AuthorizationWhitelistEnumType](src/interfaces/dto/types/enums.md#authorizationwhitelistenumtype)

---

### BadRequestError

Re-exports [BadRequestError](src/interfaces/api/exceptions/BadRequestError.md#badrequesterror)

---

### BaseDto

Re-exports [BaseDto](src/interfaces/dto/types/base.dto.md#basedto)

---

### BaseProps

Re-exports [BaseProps](src/interfaces/dto/types/base.dto.md#baseprops)

---

### BaseSchema

Re-exports [BaseSchema](src/interfaces/dto/types/base.dto.md#baseschema)

---

### BOOT_STATUS

Re-exports [BOOT_STATUS](src/config/BootConfig.md#boot_status)

---

### BootConfig

Re-exports [BootConfig](src/config/BootConfig.md#bootconfig)

---

### BootCreate

Re-exports [BootCreate](src/interfaces/dto/boot.dto.md#bootcreate)

---

### BootCreateSchema

Re-exports [BootCreateSchema](src/interfaces/dto/boot.dto.md#bootcreateschema)

---

### BootDto

Re-exports [BootDto](src/interfaces/dto/boot.dto.md#bootdto)

---

### BootProps

Re-exports [BootProps](src/interfaces/dto/boot.dto.md#bootprops)

---

### BootSchema

Re-exports [BootSchema](src/interfaces/dto/boot.dto.md#bootschema)

---

### bootSchemas

Re-exports [bootSchemas](src/interfaces/dto/boot.dto.md#bootschemas)

---

### BootstrapConfig

Re-exports [BootstrapConfig](src/config/bootstrap.config.md#bootstrapconfig)

---

### BootUpdate

Re-exports [BootUpdate](src/interfaces/dto/boot.dto.md#bootupdate)

---

### BootUpdateSchema

Re-exports [BootUpdateSchema](src/interfaces/dto/boot.dto.md#bootupdateschema)

---

### BusinessDetails

Re-exports [BusinessDetails](src/interfaces/dto/types/ocpi.registration.md#businessdetails)

---

### BusinessDetailsSchema

Re-exports [BusinessDetailsSchema](src/interfaces/dto/types/ocpi.registration.md#businessdetailsschema)

---

### CacheNamespace

Re-exports [CacheNamespace](src/interfaces/cache/types.md#cachenamespace)

---

### Call

Re-exports [Call](src/ocpp/rpc/message.md#call-1)

---

### CallAction

Re-exports [CallAction](src/ocpp/rpc/message.md#callaction)

---

### CallError

Re-exports [CallError](src/ocpp/rpc/message.md#callerror-1)

---

### CallResult

Re-exports [CallResult](src/ocpp/rpc/message.md#callresult-1)

---

### CertificateCreate

Re-exports [CertificateCreate](src/interfaces/dto/certificate.dto.md#certificatecreate)

---

### CertificateCreateSchema

Re-exports [CertificateCreateSchema](src/interfaces/dto/certificate.dto.md#certificatecreateschema)

---

### CertificateDto

Re-exports [CertificateDto](src/interfaces/dto/certificate.dto.md#certificatedto)

---

### CertificateProps

Re-exports [CertificateProps](src/interfaces/dto/certificate.dto.md#certificateprops)

---

### CertificateSchema

Re-exports [CertificateSchema](src/interfaces/dto/certificate.dto.md#certificateschema)

---

### certificateSchemas

Re-exports [certificateSchemas](src/interfaces/dto/certificate.dto.md#certificateschemas)

---

### CertificateUseEnum

Re-exports [CertificateUseEnum](src/interfaces/dto/types/enums.md#certificateuseenum)

---

### CertificateUseEnumSchema

Re-exports [CertificateUseEnumSchema](src/interfaces/dto/types/enums.md#certificateuseenumschema)

---

### CertificateUseEnumType

Re-exports [CertificateUseEnumType](src/interfaces/dto/types/enums.md#certificateuseenumtype)

---

### ChangeConfigurationCreate

Re-exports [ChangeConfigurationCreate](src/interfaces/dto/change.configuration.dto.md#changeconfigurationcreate)

---

### ChangeConfigurationCreateSchema

Re-exports [ChangeConfigurationCreateSchema](src/interfaces/dto/change.configuration.dto.md#changeconfigurationcreateschema)

---

### ChangeConfigurationDto

Re-exports [ChangeConfigurationDto](src/interfaces/dto/change.configuration.dto.md#changeconfigurationdto)

---

### ChangeConfigurationProps

Re-exports [ChangeConfigurationProps](src/interfaces/dto/change.configuration.dto.md#changeconfigurationprops)

---

### ChangeConfigurationSchema

Re-exports [ChangeConfigurationSchema](src/interfaces/dto/change.configuration.dto.md#changeconfigurationschema)

---

### changeConfigurationSchemas

Re-exports [changeConfigurationSchemas](src/interfaces/dto/change.configuration.dto.md#changeconfigurationschemas)

---

### ChargingLimitSourceEnum

Re-exports [ChargingLimitSourceEnum](src/interfaces/dto/types/enums.md#charginglimitsourceenum)

---

### ChargingLimitSourceEnumSchema

Re-exports [ChargingLimitSourceEnumSchema](src/interfaces/dto/types/enums.md#charginglimitsourceenumschema)

---

### ChargingLimitSourceEnumType

Re-exports [ChargingLimitSourceEnumType](src/interfaces/dto/types/enums.md#charginglimitsourceenumtype)

---

### ChargingNeedsCreate

Re-exports [ChargingNeedsCreate](src/interfaces/dto/charging.needs.dto.md#chargingneedscreate)

---

### ChargingNeedsCreateSchema

Re-exports [ChargingNeedsCreateSchema](src/interfaces/dto/charging.needs.dto.md#chargingneedscreateschema)

---

### ChargingNeedsDto

Re-exports [ChargingNeedsDto](src/interfaces/dto/charging.needs.dto.md#chargingneedsdto)

---

### ChargingNeedsProps

Re-exports [ChargingNeedsProps](src/interfaces/dto/charging.needs.dto.md#chargingneedsprops)

---

### ChargingNeedsSchema

Re-exports [ChargingNeedsSchema](src/interfaces/dto/charging.needs.dto.md#chargingneedsschema)

---

### chargingNeedsSchemas

Re-exports [chargingNeedsSchemas](src/interfaces/dto/charging.needs.dto.md#chargingneedsschemas)

---

### ChargingProfileCreate

Re-exports [ChargingProfileCreate](src/interfaces/dto/charging.profile.dto.md#chargingprofilecreate)

---

### ChargingProfileCreateSchema

Re-exports [ChargingProfileCreateSchema](src/interfaces/dto/charging.profile.dto.md#chargingprofilecreateschema)

---

### ChargingProfileDto

Re-exports [ChargingProfileDto](src/interfaces/dto/charging.profile.dto.md#chargingprofiledto)

---

### ChargingProfileKindEnum

Re-exports [ChargingProfileKindEnum](src/interfaces/dto/types/enums.md#chargingprofilekindenum)

---

### ChargingProfileKindEnumSchema

Re-exports [ChargingProfileKindEnumSchema](src/interfaces/dto/types/enums.md#chargingprofilekindenumschema)

---

### ChargingProfileKindEnumType

Re-exports [ChargingProfileKindEnumType](src/interfaces/dto/types/enums.md#chargingprofilekindenumtype)

---

### ChargingProfileProps

Re-exports [ChargingProfileProps](src/interfaces/dto/charging.profile.dto.md#chargingprofileprops)

---

### ChargingProfilePurposeEnum

Re-exports [ChargingProfilePurposeEnum](src/interfaces/dto/types/enums.md#chargingprofilepurposeenum)

---

### ChargingProfilePurposeEnumSchema

Re-exports [ChargingProfilePurposeEnumSchema](src/interfaces/dto/types/enums.md#chargingprofilepurposeenumschema)

---

### ChargingProfilePurposeEnumType

Re-exports [ChargingProfilePurposeEnumType](src/interfaces/dto/types/enums.md#chargingprofilepurposeenumtype)

---

### ChargingProfileSchema

Re-exports [ChargingProfileSchema](src/interfaces/dto/charging.profile.dto.md#chargingprofileschema)

---

### chargingProfileSchemas

Re-exports [chargingProfileSchemas](src/interfaces/dto/charging.profile.dto.md#chargingprofileschemas)

---

### ChargingRateUnitEnum

Re-exports [ChargingRateUnitEnum](src/interfaces/dto/types/enums.md#chargingrateunitenum)

---

### ChargingRateUnitEnumSchema

Re-exports [ChargingRateUnitEnumSchema](src/interfaces/dto/types/enums.md#chargingrateunitenumschema)

---

### ChargingRateUnitEnumType

Re-exports [ChargingRateUnitEnumType](src/interfaces/dto/types/enums.md#chargingrateunitenumtype)

---

### ChargingScheduleCreate

Re-exports [ChargingScheduleCreate](src/interfaces/dto/charging.schedule.dto.md#chargingschedulecreate)

---

### ChargingScheduleCreateSchema

Re-exports [ChargingScheduleCreateSchema](src/interfaces/dto/charging.schedule.dto.md#chargingschedulecreateschema)

---

### ChargingScheduleDto

Re-exports [ChargingScheduleDto](src/interfaces/dto/charging.schedule.dto.md#chargingscheduledto)

---

### ChargingScheduleProps

Re-exports [ChargingScheduleProps](src/interfaces/dto/charging.schedule.dto.md#chargingscheduleprops)

---

### ChargingScheduleSchema

Re-exports [ChargingScheduleSchema](src/interfaces/dto/charging.schedule.dto.md#chargingscheduleschema)

---

### chargingScheduleSchemas

Re-exports [chargingScheduleSchemas](src/interfaces/dto/charging.schedule.dto.md#chargingscheduleschemas)

---

### ChargingStateEnum

Re-exports [ChargingStateEnum](src/interfaces/dto/types/enums.md#chargingstateenum)

---

### ChargingStateEnumSchema

Re-exports [ChargingStateEnumSchema](src/interfaces/dto/types/enums.md#chargingstateenumschema)

---

### ChargingStateEnumType

Re-exports [ChargingStateEnumType](src/interfaces/dto/types/enums.md#chargingstateenumtype)

---

### ChargingStationCapabilityEnum

Re-exports [ChargingStationCapabilityEnum](src/interfaces/dto/types/enums.md#chargingstationcapabilityenum)

---

### ChargingStationCapabilityEnumType

Re-exports [ChargingStationCapabilityEnumType](src/interfaces/dto/types/enums.md#chargingstationcapabilityenumtype)

---

### ChargingStationCapabilitySchema

Re-exports [ChargingStationCapabilitySchema](src/interfaces/dto/types/enums.md#chargingstationcapabilityschema)

---

### ChargingStationCreate

Re-exports [ChargingStationCreate](src/interfaces/dto/charging.station.dto.md#chargingstationcreate)

---

### ChargingStationCreateSchema

Re-exports [ChargingStationCreateSchema](src/interfaces/dto/charging.station.dto.md#chargingstationcreateschema)

---

### ChargingStationDto

Re-exports [ChargingStationDto](src/interfaces/dto/charging.station.dto.md#chargingstationdto)

---

### ChargingStationNetworkProfileCreate

Re-exports [ChargingStationNetworkProfileCreate](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofilecreate)

---

### ChargingStationNetworkProfileCreateSchema

Re-exports [ChargingStationNetworkProfileCreateSchema](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofilecreateschema)

---

### ChargingStationNetworkProfileDto

Re-exports [ChargingStationNetworkProfileDto](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofiledto)

---

### ChargingStationNetworkProfileProps

Re-exports [ChargingStationNetworkProfileProps](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofileprops)

---

### ChargingStationNetworkProfileSchema

Re-exports [ChargingStationNetworkProfileSchema](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofileschema)

---

### chargingStationNetworkProfileSchemas

Re-exports [chargingStationNetworkProfileSchemas](src/interfaces/dto/charging.station.network.profile.dto.md#chargingstationnetworkprofileschemas)

---

### ChargingStationOCPI

Re-exports [ChargingStationOCPI](src/interfaces/dto/charging.station.dto.md#chargingstationocpi)

---

### ChargingStationOCPISchema

Re-exports [ChargingStationOCPISchema](src/interfaces/dto/charging.station.dto.md#chargingstationocpischema)

---

### ChargingStationParkingRestrictionEnum

Re-exports [ChargingStationParkingRestrictionEnum](src/interfaces/dto/types/enums.md#chargingstationparkingrestrictionenum)

---

### ChargingStationParkingRestrictionEnumType

Re-exports [ChargingStationParkingRestrictionEnumType](src/interfaces/dto/types/enums.md#chargingstationparkingrestrictionenumtype)

---

### ChargingStationParkingRestrictionSchema

Re-exports [ChargingStationParkingRestrictionSchema](src/interfaces/dto/types/enums.md#chargingstationparkingrestrictionschema)

---

### ChargingStationProps

Re-exports [ChargingStationProps](src/interfaces/dto/charging.station.dto.md#chargingstationprops)

---

### ChargingStationSchema

Re-exports [ChargingStationSchema](src/interfaces/dto/charging.station.dto.md#chargingstationschema)

---

### chargingStationSchemas

Re-exports [chargingStationSchemas](src/interfaces/dto/charging.station.dto.md#chargingstationschemas)

---

### ChargingStationSecurityInfoCreate

Re-exports [ChargingStationSecurityInfoCreate](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfocreate)

---

### ChargingStationSecurityInfoCreateSchema

Re-exports [ChargingStationSecurityInfoCreateSchema](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfocreateschema)

---

### ChargingStationSecurityInfoDto

Re-exports [ChargingStationSecurityInfoDto](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfodto)

---

### ChargingStationSecurityInfoProps

Re-exports [ChargingStationSecurityInfoProps](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfoprops)

---

### ChargingStationSecurityInfoSchema

Re-exports [ChargingStationSecurityInfoSchema](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfoschema)

---

### chargingStationSecurityInfoSchemas

Re-exports [chargingStationSecurityInfoSchemas](src/interfaces/dto/charging.station.security.info.dto.md#chargingstationsecurityinfoschemas)

---

### ChargingStationSequenceCreate

Re-exports [ChargingStationSequenceCreate](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequencecreate)

---

### ChargingStationSequenceCreateSchema

Re-exports [ChargingStationSequenceCreateSchema](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequencecreateschema)

---

### ChargingStationSequenceDto

Re-exports [ChargingStationSequenceDto](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequencedto)

---

### ChargingStationSequenceProps

Re-exports [ChargingStationSequenceProps](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequenceprops)

---

### ChargingStationSequenceSchema

Re-exports [ChargingStationSequenceSchema](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequenceschema)

---

### chargingStationSequenceSchemas

Re-exports [chargingStationSequenceSchemas](src/interfaces/dto/charging.station.sequence.dto.md#chargingstationsequenceschemas)

---

### ChargingStationSequenceTypeEnum

Re-exports [ChargingStationSequenceTypeEnum](src/interfaces/dto/types/enums.md#chargingstationsequencetypeenum)

---

### ChargingStationSequenceTypeEnumType

Re-exports [ChargingStationSequenceTypeEnumType](src/interfaces/dto/types/enums.md#chargingstationsequencetypeenumtype)

---

### ChargingStationSequenceTypeSchema

Re-exports [ChargingStationSequenceTypeSchema](src/interfaces/dto/types/enums.md#chargingstationsequencetypeschema)

---

### ComponentCreate

Re-exports [ComponentCreate](src/interfaces/dto/component.dto.md#componentcreate)

---

### ComponentCreateSchema

Re-exports [ComponentCreateSchema](src/interfaces/dto/component.dto.md#componentcreateschema)

---

### ComponentDto

Re-exports [ComponentDto](src/interfaces/dto/component.dto.md#componentdto)

---

### ComponentProps

Re-exports [ComponentProps](src/interfaces/dto/component.dto.md#componentprops)

---

### ComponentSchema

Re-exports [ComponentSchema](src/interfaces/dto/component.dto.md#componentschema)

---

### componentSchemas

Re-exports [componentSchemas](src/interfaces/dto/component.dto.md#componentschemas)

---

### CompositeScheduleCreate

Re-exports [CompositeScheduleCreate](src/interfaces/dto/composite.schedule.dto.md#compositeschedulecreate)

---

### CompositeScheduleCreateSchema

Re-exports [CompositeScheduleCreateSchema](src/interfaces/dto/composite.schedule.dto.md#compositeschedulecreateschema)

---

### CompositeScheduleDto

Re-exports [CompositeScheduleDto](src/interfaces/dto/composite.schedule.dto.md#compositescheduledto)

---

### CompositeScheduleProps

Re-exports [CompositeScheduleProps](src/interfaces/dto/composite.schedule.dto.md#compositescheduleprops)

---

### CompositeScheduleSchema

Re-exports [CompositeScheduleSchema](src/interfaces/dto/composite.schedule.dto.md#compositescheduleschema)

---

### compositeScheduleSchemas

Re-exports [compositeScheduleSchemas](src/interfaces/dto/composite.schedule.dto.md#compositescheduleschemas)

---

### ConfigStore

Re-exports [ConfigStore](src/config/ConfigStore.md#configstore)

---

### ConfigStoreFactory

Re-exports [ConfigStoreFactory](src/config/ConfigStore.md#configstorefactory)

---

### ConnectorCreate

Re-exports [ConnectorCreate](src/interfaces/dto/connector.dto.md#connectorcreate)

---

### ConnectorCreateSchema

Re-exports [ConnectorCreateSchema](src/interfaces/dto/connector.dto.md#connectorcreateschema)

---

### ConnectorDto

Re-exports [ConnectorDto](src/interfaces/dto/connector.dto.md#connectordto)

---

### ConnectorErrorCodeEnum

Re-exports [ConnectorErrorCodeEnum](src/interfaces/dto/types/enums.md#connectorerrorcodeenum)

---

### ConnectorErrorCodeEnumSchema

Re-exports [ConnectorErrorCodeEnumSchema](src/interfaces/dto/types/enums.md#connectorerrorcodeenumschema)

---

### ConnectorErrorCodeEnumType

Re-exports [ConnectorErrorCodeEnumType](src/interfaces/dto/types/enums.md#connectorerrorcodeenumtype)

---

### ConnectorFormatEnum

Re-exports [ConnectorFormatEnum](src/interfaces/dto/types/enums.md#connectorformatenum)

---

### ConnectorFormatEnumSchema

Re-exports [ConnectorFormatEnumSchema](src/interfaces/dto/types/enums.md#connectorformatenumschema)

---

### ConnectorFormatEnumType

Re-exports [ConnectorFormatEnumType](src/interfaces/dto/types/enums.md#connectorformatenumtype)

---

### ConnectorPowerTypeEnum

Re-exports [ConnectorPowerTypeEnum](src/interfaces/dto/types/enums.md#connectorpowertypeenum)

---

### ConnectorPowerTypeEnumSchema

Re-exports [ConnectorPowerTypeEnumSchema](src/interfaces/dto/types/enums.md#connectorpowertypeenumschema)

---

### ConnectorPowerTypeEnumType

Re-exports [ConnectorPowerTypeEnumType](src/interfaces/dto/types/enums.md#connectorpowertypeenumtype)

---

### ConnectorProps

Re-exports [ConnectorProps](src/interfaces/dto/connector.dto.md#connectorprops)

---

### ConnectorSchema

Re-exports [ConnectorSchema](src/interfaces/dto/connector.dto.md#connectorschema)

---

### connectorSchemas

Re-exports [connectorSchemas](src/interfaces/dto/connector.dto.md#connectorschemas)

---

### ConnectorSchemaWithoutParent

Re-exports [ConnectorSchemaWithoutParent](src/interfaces/dto/connector.dto.md#connectorschemawithoutparent)

---

### ConnectorStatusEnum

Re-exports [ConnectorStatusEnum](src/interfaces/dto/types/enums.md#connectorstatusenum)

---

### ConnectorStatusEnumSchema

Re-exports [ConnectorStatusEnumSchema](src/interfaces/dto/types/enums.md#connectorstatusenumschema)

---

### ConnectorStatusEnumType

Re-exports [ConnectorStatusEnumType](src/interfaces/dto/types/enums.md#connectorstatusenumtype)

---

### ConnectorTypeEnum

Re-exports [ConnectorTypeEnum](src/interfaces/dto/types/enums.md#connectortypeenum)

---

### ConnectorTypeEnumSchema

Re-exports [ConnectorTypeEnumSchema](src/interfaces/dto/types/enums.md#connectortypeenumschema)

---

### ConnectorTypeEnumType

Re-exports [ConnectorTypeEnumType](src/interfaces/dto/types/enums.md#connectortypeenumtype)

---

### ConsumptionCost

Re-exports [ConsumptionCost](src/interfaces/dto/types/sales.tariff.md#consumptioncost)

---

### ConsumptionCostSchema

Re-exports [ConsumptionCostSchema](src/interfaces/dto/types/sales.tariff.md#consumptioncostschema)

---

### Cost

Re-exports [Cost](src/interfaces/dto/types/sales.tariff.md#cost)

---

### CostKindEnum

Re-exports [CostKindEnum](src/interfaces/dto/types/enums.md#costkindenum)

---

### CostKindEnumSchema

Re-exports [CostKindEnumSchema](src/interfaces/dto/types/enums.md#costkindenumschema)

---

### CostKindEnumType

Re-exports [CostKindEnumType](src/interfaces/dto/types/enums.md#costkindenumtype)

---

### CostSchema

Re-exports [CostSchema](src/interfaces/dto/types/sales.tariff.md#costschema)

---

### CountryName

Re-exports [CountryName](src/interfaces/dto/certificate.dto.md#countryname)

---

### CountryNameSchema

Re-exports [CountryNameSchema](src/interfaces/dto/certificate.dto.md#countrynameschema)

---

### createIdentifier

Re-exports [createIdentifier](src/interfaces/cache/types.md#createidentifier)

---

### CredentialRole

Re-exports [CredentialRole](src/interfaces/dto/types/ocpi.registration.md#credentialrole)

---

### CredentialRoleSchema

Re-exports [CredentialRoleSchema](src/interfaces/dto/types/ocpi.registration.md#credentialroleschema)

---

### Credentials

Re-exports [Credentials](src/interfaces/dto/types/ocpi.registration.md#credentials)

---

### CredentialsSchema

Re-exports [CredentialsSchema](src/interfaces/dto/types/ocpi.registration.md#credentialsschema)

---

### CrudEvent

Re-exports [CrudEvent](src/interfaces/repository.md#crudevent)

---

### CrudRepository

Re-exports [CrudRepository](src/interfaces/repository.md#abstract-crudrepository)

---

### Currency

Re-exports [Currency](src/money/Currency.md#currency)

---

### CurrencyCode

Re-exports [CurrencyCode](src/money/Currency.md#currencycode-1)

---

### DCChargingParametersSchema

Re-exports [DCChargingParametersSchema](src/interfaces/dto/types/charging.parameters.md#dcchargingparametersschema)

---

### DCChargingParametersType

Re-exports [DCChargingParametersType](src/interfaces/dto/types/charging.parameters.md#dcchargingparameterstype)

---

### deepDirectionalEqual

Re-exports [deepDirectionalEqual](src/assertion/assertion.md#deepdirectionalequal)

---

### DEFAULT_TENANT_ID

Re-exports [DEFAULT_TENANT_ID](src/config/defineConfig.md#default_tenant_id)

---

### defineConfig

Re-exports [defineConfig](src/config/defineConfig.md#defineconfig)

---

### Endpoint

Re-exports [Endpoint](src/interfaces/dto/types/ocpi.registration.md#endpoint)

---

### EndpointSchema

Re-exports [EndpointSchema](src/interfaces/dto/types/ocpi.registration.md#endpointschema)

---

### EnergyTransferModeEnum

Re-exports [EnergyTransferModeEnum](src/interfaces/dto/types/enums.md#energytransfermodeenum)

---

### EnergyTransferModeEnumSchema

Re-exports [EnergyTransferModeEnumSchema](src/interfaces/dto/types/enums.md#energytransfermodeenumschema)

---

### EnergyTransferModeEnumType

Re-exports [EnergyTransferModeEnumType](src/interfaces/dto/types/enums.md#energytransfermodeenumtype)

---

### ErrorCode

Re-exports [ErrorCode](src/ocpp/rpc/message.md#errorcode)

---

### EventDataCreate

Re-exports [EventDataCreate](src/interfaces/dto/event.data.dto.md#eventdatacreate)

---

### EventDataCreateSchema

Re-exports [EventDataCreateSchema](src/interfaces/dto/event.data.dto.md#eventdatacreateschema)

---

### EventDataDto

Re-exports [EventDataDto](src/interfaces/dto/event.data.dto.md#eventdatadto)

---

### EventDataProps

Re-exports [EventDataProps](src/interfaces/dto/event.data.dto.md#eventdataprops)

---

### EventDataSchema

Re-exports [EventDataSchema](src/interfaces/dto/event.data.dto.md#eventdataschema)

---

### eventDataSchemas

Re-exports [eventDataSchemas](src/interfaces/dto/event.data.dto.md#eventdataschemas)

---

### EventGroup

Re-exports [EventGroup](src/interfaces/messages.md#eventgroup)

---

### eventGroupFromString

Re-exports [eventGroupFromString](src/interfaces/messages.md#eventgroupfromstring)

---

### EventNotificationEnum

Re-exports [EventNotificationEnum](src/interfaces/dto/types/enums.md#eventnotificationenum)

---

### EventNotificationEnumSchema

Re-exports [EventNotificationEnumSchema](src/interfaces/dto/types/enums.md#eventnotificationenumschema)

---

### EventNotificationEnumType

Re-exports [EventNotificationEnumType](src/interfaces/dto/types/enums.md#eventnotificationenumtype)

---

### EventTriggerEnum

Re-exports [EventTriggerEnum](src/interfaces/dto/types/enums.md#eventtriggerenum)

---

### EventTriggerEnumSchema

Re-exports [EventTriggerEnumSchema](src/interfaces/dto/types/enums.md#eventtriggerenumschema)

---

### EventTriggerEnumType

Re-exports [EventTriggerEnumType](src/interfaces/dto/types/enums.md#eventtriggerenumtype)

---

### EvseCreate

Re-exports [EvseCreate](src/interfaces/dto/evse.dto.md#evsecreate)

---

### EvseCreateSchema

Re-exports [EvseCreateSchema](src/interfaces/dto/evse.dto.md#evsecreateschema)

---

### EvseDto

Re-exports [EvseDto](src/interfaces/dto/evse.dto.md#evsedto)

---

### EvseProps

Re-exports [EvseProps](src/interfaces/dto/evse.dto.md#evseprops)

---

### EvseSchema

Re-exports [EvseSchema](src/interfaces/dto/evse.dto.md#evseschema)

---

### evseSchemas

Re-exports [evseSchemas](src/interfaces/dto/evse.dto.md#evseschemas)

---

### EvseTypeCreate

Re-exports [EvseTypeCreate](src/interfaces/dto/evse.type.dto.md#evsetypecreate)

---

### EvseTypeCreateSchema

Re-exports [EvseTypeCreateSchema](src/interfaces/dto/evse.type.dto.md#evsetypecreateschema)

---

### EvseTypeDto

Re-exports [EvseTypeDto](src/interfaces/dto/evse.type.dto.md#evsetypedto)

---

### EvseTypeProps

Re-exports [EvseTypeProps](src/interfaces/dto/evse.type.dto.md#evsetypeprops)

---

### EvseTypeSchema

Re-exports [EvseTypeSchema](src/interfaces/dto/evse.type.dto.md#evsetypeschema)

---

### evseTypeSchemas

Re-exports [evseTypeSchemas](src/interfaces/dto/evse.type.dto.md#evsetypeschemas)

---

### getStationIdFromIdentifier

Re-exports [getStationIdFromIdentifier](src/interfaces/cache/types.md#getstationidfromidentifier)

---

### getTenantIdFromIdentifier

Re-exports [getTenantIdFromIdentifier](src/interfaces/cache/types.md#gettenantidfromidentifier)

---

### GroupAuthorizationDto

Re-exports [GroupAuthorizationDto](src/interfaces/dto/authorization.dto.md#groupauthorizationdto)

---

### GroupAuthorizationSchema

Re-exports [GroupAuthorizationSchema](src/interfaces/dto/authorization.dto.md#groupauthorizationschema)

---

### HandlerProperties

Re-exports [HandlerProperties](src/interfaces/messages.md#handlerproperties)

---

### HashAlgorithmEnum

Re-exports [HashAlgorithmEnum](src/interfaces/dto/types/enums.md#hashalgorithmenum)

---

### HashAlgorithmEnumSchema

Re-exports [HashAlgorithmEnumSchema](src/interfaces/dto/types/enums.md#hashalgorithmenumschema)

---

### HashAlgorithmEnumType

Re-exports [HashAlgorithmEnumType](src/interfaces/dto/types/enums.md#hashalgorithmenumtype)

---

### HttpHeader

Re-exports [HttpHeader](src/interfaces/api/http.header.md#httpheader)

---

### HttpMethod

Re-exports [HttpMethod](src/interfaces/api.md#httpmethod)

---

### HttpStatus

Re-exports [HttpStatus](src/interfaces/api/http.status.md#httpstatus)

---

### HUBJECT_DEFAULT_AUTH_TOKEN

Re-exports [HUBJECT_DEFAULT_AUTH_TOKEN](src/config/types.md#hubject_default_auth_token)

---

### HUBJECT_DEFAULT_BASEURL

Re-exports [HUBJECT_DEFAULT_BASEURL](src/config/types.md#hubject_default_baseurl)

---

### HUBJECT_DEFAULT_CLIENTID

Re-exports [HUBJECT_DEFAULT_CLIENTID](src/config/types.md#hubject_default_clientid)

---

### HUBJECT_DEFAULT_CLIENTSECRET

Re-exports [HUBJECT_DEFAULT_CLIENTSECRET](src/config/types.md#hubject_default_clientsecret)

---

### HUBJECT_DEFAULT_TOKENURL

Re-exports [HUBJECT_DEFAULT_TOKENURL](src/config/types.md#hubject_default_tokenurl)

---

### IApiAuthProvider

Re-exports [IApiAuthProvider](src/interfaces/api/auth/IApiAuthProvider.md#iapiauthprovider)

---

### IAuthenticator

Re-exports [IAuthenticator](src/interfaces/router/Authenticator.md#iauthenticator)

---

### IAuthorizer

Re-exports [IAuthorizer](src/interfaces/authorizer.md#iauthorizer)

---

### ICache

Re-exports [ICache](src/interfaces/cache/cache.md#icache)

---

### IConnectionManager

Re-exports [IConnectionManager](src/interfaces/messages/IConnectionManager.md#iconnectionmanager)

---

### IdTokenEnum

Re-exports [IdTokenEnum](src/interfaces/dto/types/enums.md#idtokenenum)

---

### IdTokenEnumSchema

Re-exports [IdTokenEnumSchema](src/interfaces/dto/types/enums.md#idtokenenumschema)

---

### IdTokenEnumType

Re-exports [IdTokenEnumType](src/interfaces/dto/types/enums.md#idtokenenumtype)

---

### IFileAccess

Re-exports [IFileAccess](src/interfaces/files/fileAccess.md#ifileaccess)

---

### IFileStorage

Re-exports [IFileStorage](src/interfaces/files/fileStorage.md#ifilestorage)

---

### Image

Re-exports [Image](src/interfaces/dto/types/ocpi.registration.md#image)

---

### ImageSchema

Re-exports [ImageSchema](src/interfaces/dto/types/ocpi.registration.md#imageschema)

---

### IMessage

Re-exports [IMessage](src/interfaces/messages/Message.md#imessage)

---

### IMessageConfirmation

Re-exports [IMessageConfirmation](src/interfaces/messages/MessageConfirmation.md#imessageconfirmation)

---

### IMessageContext

Re-exports [IMessageContext](src/interfaces/messages/MessageContext.md#imessagecontext)

---

### IMessageHandler

Re-exports [IMessageHandler](src/interfaces/messages/MessageHandler.md#imessagehandler)

---

### IMessageQuerystring

Re-exports [IMessageQuerystring](src/interfaces/api/MessageQuerystring.md#imessagequerystring)

---

### IMessageQuerystringSchema

Re-exports [IMessageQuerystringSchema](src/interfaces/api/MessageQuerystring.md#imessagequerystringschema)

---

### IMessageRouter

Re-exports [IMessageRouter](src/interfaces/router/Router.md#imessagerouter)

---

### IMessageSender

Re-exports [IMessageSender](src/interfaces/messages/MessageSender.md#imessagesender)

---

### IModule

Re-exports [IModule](src/interfaces/modules/Module.md#imodule)

---

### IModuleApi

Re-exports [IModuleApi](src/interfaces/api/ModuleApi.md#imoduleapi)

---

### INetworkConnection

Re-exports [INetworkConnection](src/interfaces/router/INetworkConnection.md#inetworkconnection)

---

### InstalledCertificateCreate

Re-exports [InstalledCertificateCreate](src/interfaces/dto/installed.certificate.dto.md#installedcertificatecreate)

---

### InstalledCertificateCreateSchema

Re-exports [InstalledCertificateCreateSchema](src/interfaces/dto/installed.certificate.dto.md#installedcertificatecreateschema)

---

### InstalledCertificateDto

Re-exports [InstalledCertificateDto](src/interfaces/dto/installed.certificate.dto.md#installedcertificatedto)

---

### InstalledCertificateProps

Re-exports [InstalledCertificateProps](src/interfaces/dto/installed.certificate.dto.md#installedcertificateprops)

---

### InstalledCertificateSchema

Re-exports [InstalledCertificateSchema](src/interfaces/dto/installed.certificate.dto.md#installedcertificateschema)

---

### installedCertificateSchemas

Re-exports [installedCertificateSchemas](src/interfaces/dto/installed.certificate.dto.md#installedcertificateschemas)

---

### IWebsocketConnection

Re-exports [IWebsocketConnection](src/interfaces/cache/types.md#iwebsocketconnection)

---

### LatestStatusNotificationCreate

Re-exports [LatestStatusNotificationCreate](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationcreate)

---

### LatestStatusNotificationCreateSchema

Re-exports [LatestStatusNotificationCreateSchema](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationcreateschema)

---

### LatestStatusNotificationDto

Re-exports [LatestStatusNotificationDto](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationdto)

---

### LatestStatusNotificationProps

Re-exports [LatestStatusNotificationProps](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationprops)

---

### LatestStatusNotificationSchema

Re-exports [LatestStatusNotificationSchema](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationschema)

---

### latestStatusNotificationSchemas

Re-exports [latestStatusNotificationSchemas](src/interfaces/dto/latest.status.notification.dto.md#lateststatusnotificationschemas)

---

### loadBootstrapConfig

Re-exports [loadBootstrapConfig](src/config/bootstrap.config.md#loadbootstrapconfig)

---

### LocationCreate

Re-exports [LocationCreate](src/interfaces/dto/location.dto.md#locationcreate)

---

### LocationCreateSchema

Re-exports [LocationCreateSchema](src/interfaces/dto/location.dto.md#locationcreateschema)

---

### LocationDto

Re-exports [LocationDto](src/interfaces/dto/location.dto.md#locationdto)

---

### LocationEnum

Re-exports [LocationEnum](src/interfaces/dto/types/enums.md#locationenum)

---

### LocationEnumSchema

Re-exports [LocationEnumSchema](src/interfaces/dto/types/enums.md#locationenumschema)

---

### LocationEnumType

Re-exports [LocationEnumType](src/interfaces/dto/types/enums.md#locationenumtype)

---

### LocationExceptionalPeriod

Re-exports [LocationExceptionalPeriod](src/interfaces/dto/types/hours.md#locationexceptionalperiod)

---

### LocationFacilityEnum

Re-exports [LocationFacilityEnum](src/interfaces/dto/types/enums.md#locationfacilityenum)

---

### LocationFacilityEnumSchema

Re-exports [LocationFacilityEnumSchema](src/interfaces/dto/types/enums.md#locationfacilityenumschema)

---

### LocationFacilityEnumType

Re-exports [LocationFacilityEnumType](src/interfaces/dto/types/enums.md#locationfacilityenumtype)

---

### LocationHours

Re-exports [LocationHours](src/interfaces/dto/types/hours.md#locationhours)

---

### LocationHoursSchema

Re-exports [LocationHoursSchema](src/interfaces/dto/types/location.md#locationhoursschema)

---

### LocationParkingEnum

Re-exports [LocationParkingEnum](src/interfaces/dto/types/enums.md#locationparkingenum)

---

### LocationParkingEnumSchema

Re-exports [LocationParkingEnumSchema](src/interfaces/dto/types/enums.md#locationparkingenumschema)

---

### LocationParkingEnumType

Re-exports [LocationParkingEnumType](src/interfaces/dto/types/enums.md#locationparkingenumtype)

---

### LocationProps

Re-exports [LocationProps](src/interfaces/dto/location.dto.md#locationprops)

---

### LocationRegularHours

Re-exports [LocationRegularHours](src/interfaces/dto/types/hours.md#locationregularhours)

---

### LocationSchema

Re-exports [LocationSchema](src/interfaces/dto/location.dto.md#locationschema)

---

### locationSchemas

Re-exports [locationSchemas](src/interfaces/dto/location.dto.md#locationschemas)

---

### mapToCallAction

Re-exports [mapToCallAction](src/ocpp/rpc/message.md#maptocallaction)

---

### MeasurandEnum

Re-exports [MeasurandEnum](src/interfaces/dto/types/enums.md#measurandenum)

---

### MeasurandEnumSchema

Re-exports [MeasurandEnumSchema](src/interfaces/dto/types/enums.md#measurandenumschema)

---

### MeasurandEnumType

Re-exports [MeasurandEnumType](src/interfaces/dto/types/enums.md#measurandenumtype)

---

### Message

Re-exports [Message](src/interfaces/messages/Message.md#message)

---

### MessageConfirmationSchema

Re-exports [MessageConfirmationSchema](src/ocpp/persistence/querySchema.md#messageconfirmationschema)

---

### MessageContent

Re-exports [MessageContent](src/interfaces/dto/types/message.info.md#messagecontent)

---

### MessageContentSchema

Re-exports [MessageContentSchema](src/interfaces/dto/types/message.info.md#messagecontentschema)

---

### MessageFormatEnum

Re-exports [MessageFormatEnum](src/interfaces/dto/types/enums.md#messageformatenum)

---

### MessageFormatEnumSchema

Re-exports [MessageFormatEnumSchema](src/interfaces/dto/types/enums.md#messageformatenumschema)

---

### MessageFormatEnumType

Re-exports [MessageFormatEnumType](src/interfaces/dto/types/enums.md#messageformatenumtype)

---

### MessageInfoCreate

Re-exports [MessageInfoCreate](src/interfaces/dto/message.info.dto.md#messageinfocreate)

---

### MessageInfoCreateSchema

Re-exports [MessageInfoCreateSchema](src/interfaces/dto/message.info.dto.md#messageinfocreateschema)

---

### MessageInfoDto

Re-exports [MessageInfoDto](src/interfaces/dto/message.info.dto.md#messageinfodto)

---

### MessageInfoProps

Re-exports [MessageInfoProps](src/interfaces/dto/message.info.dto.md#messageinfoprops)

---

### MessageInfoSchema

Re-exports [MessageInfoSchema](src/interfaces/dto/message.info.dto.md#messageinfoschema)

---

### messageInfoSchemas

Re-exports [messageInfoSchemas](src/interfaces/dto/message.info.dto.md#messageinfoschemas)

---

### MessageOrigin

Re-exports [MessageOrigin](src/interfaces/messages.md#messageorigin)

---

### MessagePriorityEnum

Re-exports [MessagePriorityEnum](src/interfaces/dto/types/enums.md#messagepriorityenum)

---

### MessagePriorityEnumSchema

Re-exports [MessagePriorityEnumSchema](src/interfaces/dto/types/enums.md#messagepriorityenumschema)

---

### MessagePriorityEnumType

Re-exports [MessagePriorityEnumType](src/interfaces/dto/types/enums.md#messagepriorityenumtype)

---

### MessageState

Re-exports [MessageState](src/interfaces/messages.md#messagestate)

---

### MessageStateEnum

Re-exports [MessageStateEnum](src/interfaces/dto/types/enums.md#messagestateenum)

---

### MessageStateEnumSchema

Re-exports [MessageStateEnumSchema](src/interfaces/dto/types/enums.md#messagestateenumschema)

---

### MessageStateEnumType

Re-exports [MessageStateEnumType](src/interfaces/dto/types/enums.md#messagestateenumtype)

---

### MessageTypeId

Re-exports [MessageTypeId](src/ocpp/rpc/message.md#messagetypeid)

---

### MeterValueCreate

Re-exports [MeterValueCreate](src/interfaces/dto/meter.value.dto.md#metervaluecreate)

---

### MeterValueCreateSchema

Re-exports [MeterValueCreateSchema](src/interfaces/dto/meter.value.dto.md#metervaluecreateschema)

---

### MeterValueDto

Re-exports [MeterValueDto](src/interfaces/dto/meter.value.dto.md#metervaluedto)

---

### MeterValueProps

Re-exports [MeterValueProps](src/interfaces/dto/meter.value.dto.md#metervalueprops)

---

### MeterValueSchema

Re-exports [MeterValueSchema](src/interfaces/dto/meter.value.dto.md#metervalueschema)

---

### meterValueSchemas

Re-exports [meterValueSchemas](src/interfaces/dto/meter.value.dto.md#metervalueschemas)

---

### MeterValueUtils

Re-exports [MeterValueUtils](src/util/MeterValueUtils.md#metervalueutils)

---

### Money

Re-exports [Money](src/money/Money.md#money)

---

### MonitorEnum

Re-exports [MonitorEnum](src/interfaces/dto/types/enums.md#monitorenum)

---

### MonitorEnumSchema

Re-exports [MonitorEnumSchema](src/interfaces/dto/types/enums.md#monitorenumschema)

---

### MonitorEnumType

Re-exports [MonitorEnumType](src/interfaces/dto/types/enums.md#monitorenumtype)

---

### Namespace

Re-exports [Namespace](src/ocpp/persistence/namespace.md#namespace)

---

### NO_ACTION

Re-exports [NO_ACTION](src/ocpp/rpc/message.md#no_action)

---

### NotFoundError

Re-exports [NotFoundError](src/interfaces/api/exceptions/NotFoundError.md#notfounderror)

---

### notNull

Re-exports [notNull](src/assertion/assertion.md#notnull)

---

### OCPIVersionNumberEnum

Re-exports [OCPIVersionNumberEnum](src/interfaces/dto/types/enums.md#ocpiversionnumberenum)

---

### OCPIVersionNumberEnumType

Re-exports [OCPIVersionNumberEnumType](src/interfaces/dto/types/enums.md#ocpiversionnumberenumtype)

---

### OCPIVersionNumberSchema

Re-exports [OCPIVersionNumberSchema](src/interfaces/dto/types/enums.md#ocpiversionnumberschema)

---

### OCPP1_6

Renames and re-exports [00_Base/src/ocpp/model/1.6](src/ocpp/model/1.6.md)

---

### OCPP1_6_CallAction

Re-exports [OCPP1_6_CallAction](src/ocpp/rpc/message.md#ocpp1_6_callaction)

---

### OCPP1_6_Namespace

Re-exports [OCPP1_6_Namespace](src/ocpp/persistence/namespace.md#ocpp1_6_namespace)

---

### OCPP2_0_1

Renames and re-exports [00_Base/src/ocpp/model/2.0.1](src/ocpp/model/2.0.1.md)

---

### OCPP2_0_1_CallAction

Re-exports [OCPP2_0_1_CallAction](src/ocpp/rpc/message.md#ocpp2_0_1_callaction)

---

### OCPP2_0_1_Namespace

Re-exports [OCPP2_0_1_Namespace](src/ocpp/persistence/namespace.md#ocpp2_0_1_namespace)

---

### OcppError

Re-exports [OcppError](src/ocpp/rpc/message.md#ocpperror)

---

### OCPPInterfaceEnum

Re-exports [OCPPInterfaceEnum](src/interfaces/dto/types/enums.md#ocppinterfaceenum)

---

### OCPPInterfaceEnumSchema

Re-exports [OCPPInterfaceEnumSchema](src/interfaces/dto/types/enums.md#ocppinterfaceenumschema)

---

### OCPPInterfaceEnumType

Re-exports [OCPPInterfaceEnumType](src/interfaces/dto/types/enums.md#ocppinterfaceenumtype)

---

### OCPPMessageCreate

Re-exports [OCPPMessageCreate](src/interfaces/dto/ocpp.message.dto.md#ocppmessagecreate)

---

### OCPPMessageCreateSchema

Re-exports [OCPPMessageCreateSchema](src/interfaces/dto/ocpp.message.dto.md#ocppmessagecreateschema)

---

### OCPPMessageDto

Re-exports [OCPPMessageDto](src/interfaces/dto/ocpp.message.dto.md#ocppmessagedto)

---

### OCPPMessageProps

Re-exports [OCPPMessageProps](src/interfaces/dto/ocpp.message.dto.md#ocppmessageprops)

---

### ocppMessageSchemas

Re-exports [ocppMessageSchemas](src/interfaces/dto/ocpp.message.dto.md#ocppmessageschemas)

---

### OCPPMessageWithoutRequestResponseSchema

Re-exports [OCPPMessageWithoutRequestResponseSchema](src/interfaces/dto/ocpp.message.dto.md#ocppmessagewithoutrequestresponseschema)

---

### OCPPTransportEnum

Re-exports [OCPPTransportEnum](src/interfaces/dto/types/enums.md#ocpptransportenum)

---

### OCPPTransportEnumSchema

Re-exports [OCPPTransportEnumSchema](src/interfaces/dto/types/enums.md#ocpptransportenumschema)

---

### OCPPTransportEnumType

Re-exports [OCPPTransportEnumType](src/interfaces/dto/types/enums.md#ocpptransportenumtype)

---

### OCPPValidator

Re-exports [OCPPValidator](src/interfaces/modules/OCPPValidator.md#ocppvalidator)

---

### OCPPVersion

Re-exports [OCPPVersion](src/ocpp/rpc/message.md#ocppversion)

---

### OCPPVersionEnum

Re-exports [OCPPVersionEnum](src/interfaces/dto/types/enums.md#ocppversionenum)

---

### OCPPVersionEnumSchema

Re-exports [OCPPVersionEnumSchema](src/interfaces/dto/types/enums.md#ocppversionenumschema)

---

### OCPPVersionEnumType

Re-exports [OCPPVersionEnumType](src/interfaces/dto/types/enums.md#ocppversionenumtype)

---

### OCPPVersionType

Re-exports [OCPPVersionType](src/ocpp/rpc/message.md#ocppversiontype)

---

### PaginatedParams

Re-exports [PaginatedParams](src/interfaces/dto/async.job.dto.md#paginatedparams)

---

### PaginatedParamsSchema

Re-exports [PaginatedParamsSchema](src/interfaces/dto/async.job.dto.md#paginatedparamsschema)

---

### PartnerProfile

Re-exports [PartnerProfile](src/interfaces/dto/types/ocpi.registration.md#partnerprofile)

---

### PartnerProfileSchema

Re-exports [PartnerProfileSchema](src/interfaces/dto/types/ocpi.registration.md#partnerprofileschema)

---

### PhaseEnum

Re-exports [PhaseEnum](src/interfaces/dto/types/enums.md#phaseenum)

---

### PhaseEnumSchema

Re-exports [PhaseEnumSchema](src/interfaces/dto/types/enums.md#phaseenumschema)

---

### PhaseEnumType

Re-exports [PhaseEnumType](src/interfaces/dto/types/enums.md#phaseenumtype)

---

### Point

Re-exports [Point](src/interfaces/dto/types/location.md#point)

---

### PointSchema

Re-exports [PointSchema](src/interfaces/dto/types/location.md#pointschema)

---

### QuerySchema

Re-exports [QuerySchema](src/ocpp/persistence/querySchema.md#queryschema)

---

### RbacRules

Re-exports [RbacRules](src/config/types.md#rbacrules)

---

### RbacRulesSchema

Re-exports [RbacRulesSchema](src/config/types.md#rbacrulesschema)

---

### ReadingContextEnum

Re-exports [ReadingContextEnum](src/interfaces/dto/types/enums.md#readingcontextenum)

---

### ReadingContextEnumSchema

Re-exports [ReadingContextEnumSchema](src/interfaces/dto/types/enums.md#readingcontextenumschema)

---

### ReadingContextEnumType

Re-exports [ReadingContextEnumType](src/interfaces/dto/types/enums.md#readingcontextenumtype)

---

### RealTimeAuthLastAttempt

Re-exports [RealTimeAuthLastAttempt](src/interfaces/dto/types/authorization.md#realtimeauthlastattempt)

---

### RealTimeAuthLastAttemptSchema

Re-exports [RealTimeAuthLastAttemptSchema](src/interfaces/dto/types/authorization.md#realtimeauthlastattemptschema)

---

### ReasonEnum

Re-exports [ReasonEnum](src/interfaces/dto/types/enums.md#reasonenum)

---

### ReasonEnumSchema

Re-exports [ReasonEnumSchema](src/interfaces/dto/types/enums.md#reasonenumschema)

---

### ReasonEnumType

Re-exports [ReasonEnumType](src/interfaces/dto/types/enums.md#reasonenumtype)

---

### RecurrencyKindEnum

Re-exports [RecurrencyKindEnum](src/interfaces/dto/types/enums.md#recurrencykindenum)

---

### RecurrencyKindEnumSchema

Re-exports [RecurrencyKindEnumSchema](src/interfaces/dto/types/enums.md#recurrencykindenumschema)

---

### RecurrencyKindEnumType

Re-exports [RecurrencyKindEnumType](src/interfaces/dto/types/enums.md#recurrencykindenumtype)

---

### RelativeTimeInterval

Re-exports [RelativeTimeInterval](src/interfaces/dto/types/sales.tariff.md#relativetimeinterval)

---

### RelativeTimeIntervalSchema

Re-exports [RelativeTimeIntervalSchema](src/interfaces/dto/types/sales.tariff.md#relativetimeintervalschema)

---

### RequestBuilder

Re-exports [RequestBuilder](src/util/request.md#requestbuilder)

---

### ReservationCreate

Re-exports [ReservationCreate](src/interfaces/dto/reservation.dto.md#reservationcreate)

---

### ReservationCreateSchema

Re-exports [ReservationCreateSchema](src/interfaces/dto/reservation.dto.md#reservationcreateschema)

---

### ReservationDto

Re-exports [ReservationDto](src/interfaces/dto/reservation.dto.md#reservationdto)

---

### ReservationProps

Re-exports [ReservationProps](src/interfaces/dto/reservation.dto.md#reservationprops)

---

### ReservationSchema

Re-exports [ReservationSchema](src/interfaces/dto/reservation.dto.md#reservationschema)

---

### reservationSchemas

Re-exports [reservationSchemas](src/interfaces/dto/reservation.dto.md#reservationschemas)

---

### RetryMessageError

Re-exports [RetryMessageError](src/interfaces/messages.md#retrymessageerror)

---

### SalesTariffCreate

Re-exports [SalesTariffCreate](src/interfaces/dto/sales.tariff.dto.md#salestariffcreate)

---

### SalesTariffCreateSchema

Re-exports [SalesTariffCreateSchema](src/interfaces/dto/sales.tariff.dto.md#salestariffcreateschema)

---

### SalesTariffDto

Re-exports [SalesTariffDto](src/interfaces/dto/sales.tariff.dto.md#salestariffdto)

---

### SalesTariffEntry

Re-exports [SalesTariffEntry](src/interfaces/dto/types/sales.tariff.md#salestariffentry)

---

### SalesTariffEntrySchema

Re-exports [SalesTariffEntrySchema](src/interfaces/dto/types/sales.tariff.md#salestariffentryschema)

---

### SalesTariffProps

Re-exports [SalesTariffProps](src/interfaces/dto/sales.tariff.dto.md#salestariffprops)

---

### SalesTariffSchema

Re-exports [SalesTariffSchema](src/interfaces/dto/sales.tariff.dto.md#salestariffschema)

---

### salesTariffSchemas

Re-exports [salesTariffSchemas](src/interfaces/dto/sales.tariff.dto.md#salestariffschemas)

---

### SampledValue

Re-exports [SampledValue](src/interfaces/dto/types/sampled.value.dto.md#sampledvalue)

---

### SampledValueSchema

Re-exports [SampledValueSchema](src/interfaces/dto/types/sampled.value.dto.md#sampledvalueschema)

---

### SecurityEventCreate

Re-exports [SecurityEventCreate](src/interfaces/dto/security.event.dto.md#securityeventcreate)

---

### SecurityEventCreateSchema

Re-exports [SecurityEventCreateSchema](src/interfaces/dto/security.event.dto.md#securityeventcreateschema)

---

### SecurityEventDto

Re-exports [SecurityEventDto](src/interfaces/dto/security.event.dto.md#securityeventdto)

---

### SecurityEventProps

Re-exports [SecurityEventProps](src/interfaces/dto/security.event.dto.md#securityeventprops)

---

### SecurityEventSchema

Re-exports [SecurityEventSchema](src/interfaces/dto/security.event.dto.md#securityeventschema)

---

### securityEventSchemas

Re-exports [securityEventSchemas](src/interfaces/dto/security.event.dto.md#securityeventschemas)

---

### ServerNetworkProfileCreate

Re-exports [ServerNetworkProfileCreate](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofilecreate)

---

### ServerNetworkProfileCreateSchema

Re-exports [ServerNetworkProfileCreateSchema](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofilecreateschema)

---

### ServerNetworkProfileDto

Re-exports [ServerNetworkProfileDto](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofiledto)

---

### ServerNetworkProfileProps

Re-exports [ServerNetworkProfileProps](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofileprops)

---

### ServerNetworkProfileSchema

Re-exports [ServerNetworkProfileSchema](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofileschema)

---

### serverNetworkProfileSchemas

Re-exports [serverNetworkProfileSchemas](src/interfaces/dto/server.network.profile.dto.md#servernetworkprofileschemas)

---

### ServerProfile

Re-exports [ServerProfile](src/interfaces/dto/types/ocpi.registration.md#serverprofile)

---

### ServerProfileSchema

Re-exports [ServerProfileSchema](src/interfaces/dto/types/ocpi.registration.md#serverprofileschema)

---

### SetNetworkProfileCreate

Re-exports [SetNetworkProfileCreate](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofilecreate)

---

### SetNetworkProfileCreateSchema

Re-exports [SetNetworkProfileCreateSchema](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofilecreateschema)

---

### SetNetworkProfileDto

Re-exports [SetNetworkProfileDto](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofiledto)

---

### SetNetworkProfileProps

Re-exports [SetNetworkProfileProps](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofileprops)

---

### SetNetworkProfileSchema

Re-exports [SetNetworkProfileSchema](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofileschema)

---

### setNetworkProfileSchemas

Re-exports [setNetworkProfileSchemas](src/interfaces/dto/set.network.profile.dto.md#setnetworkprofileschemas)

---

### SignatureAlgorithm

Re-exports [SignatureAlgorithm](src/interfaces/dto/certificate.dto.md#signaturealgorithm)

---

### SignatureAlgorithmSchema

Re-exports [SignatureAlgorithmSchema](src/interfaces/dto/certificate.dto.md#signaturealgorithmschema)

---

### SignedMeterValue

Re-exports [SignedMeterValue](src/interfaces/dto/types/sampled.value.dto.md#signedmetervalue)

---

### SignedMeterValueSchema

Re-exports [SignedMeterValueSchema](src/interfaces/dto/types/sampled.value.dto.md#signedmetervalueschema)

---

### SignedMeterValuesConfig

Re-exports [SignedMeterValuesConfig](src/config/signedMeterValuesConfig.md#signedmetervaluesconfig)

---

### StartTransactionCreate

Re-exports [StartTransactionCreate](src/interfaces/dto/start.transaction.dto.md#starttransactioncreate)

---

### StartTransactionCreateSchema

Re-exports [StartTransactionCreateSchema](src/interfaces/dto/start.transaction.dto.md#starttransactioncreateschema)

---

### StartTransactionDto

Re-exports [StartTransactionDto](src/interfaces/dto/start.transaction.dto.md#starttransactiondto)

---

### StartTransactionProps

Re-exports [StartTransactionProps](src/interfaces/dto/start.transaction.dto.md#starttransactionprops)

---

### StartTransactionSchema

Re-exports [StartTransactionSchema](src/interfaces/dto/start.transaction.dto.md#starttransactionschema)

---

### startTransactionSchemas

Re-exports [startTransactionSchemas](src/interfaces/dto/start.transaction.dto.md#starttransactionschemas)

---

### StatusInfo

Re-exports [StatusInfo](src/interfaces/dto/types/location.md#statusinfo)

---

### StatusInfoSchema

Re-exports [StatusInfoSchema](src/interfaces/dto/types/location.md#statusinfoschema)

---

### StatusNotificationCreate

Re-exports [StatusNotificationCreate](src/interfaces/dto/status.notification.dto.md#statusnotificationcreate)

---

### StatusNotificationCreateSchema

Re-exports [StatusNotificationCreateSchema](src/interfaces/dto/status.notification.dto.md#statusnotificationcreateschema)

---

### StatusNotificationDto

Re-exports [StatusNotificationDto](src/interfaces/dto/status.notification.dto.md#statusnotificationdto)

---

### StatusNotificationProps

Re-exports [StatusNotificationProps](src/interfaces/dto/status.notification.dto.md#statusnotificationprops)

---

### StatusNotificationSchema

Re-exports [StatusNotificationSchema](src/interfaces/dto/status.notification.dto.md#statusnotificationschema)

---

### statusNotificationSchemas

Re-exports [statusNotificationSchemas](src/interfaces/dto/status.notification.dto.md#statusnotificationschemas)

---

### StopTransactionCreate

Re-exports [StopTransactionCreate](src/interfaces/dto/stop.transaction.dto.md#stoptransactioncreate)

---

### StopTransactionCreateSchema

Re-exports [StopTransactionCreateSchema](src/interfaces/dto/stop.transaction.dto.md#stoptransactioncreateschema)

---

### StopTransactionDto

Re-exports [StopTransactionDto](src/interfaces/dto/stop.transaction.dto.md#stoptransactiondto)

---

### StopTransactionProps

Re-exports [StopTransactionProps](src/interfaces/dto/stop.transaction.dto.md#stoptransactionprops)

---

### StopTransactionSchema

Re-exports [StopTransactionSchema](src/interfaces/dto/stop.transaction.dto.md#stoptransactionschema)

---

### stopTransactionSchemas

Re-exports [stopTransactionSchemas](src/interfaces/dto/stop.transaction.dto.md#stoptransactionschemas)

---

### SubscriptionCreate

Re-exports [SubscriptionCreate](src/interfaces/dto/subscription.dto.md#subscriptioncreate)

---

### SubscriptionCreateSchema

Re-exports [SubscriptionCreateSchema](src/interfaces/dto/subscription.dto.md#subscriptioncreateschema)

---

### SubscriptionDto

Re-exports [SubscriptionDto](src/interfaces/dto/subscription.dto.md#subscriptiondto)

---

### SubscriptionProps

Re-exports [SubscriptionProps](src/interfaces/dto/subscription.dto.md#subscriptionprops)

---

### SubscriptionSchema

Re-exports [SubscriptionSchema](src/interfaces/dto/subscription.dto.md#subscriptionschema)

---

### subscriptionSchemas

Re-exports [subscriptionSchemas](src/interfaces/dto/subscription.dto.md#subscriptionschemas)

---

### SystemConfig

Re-exports [SystemConfig](src/config/types.md#systemconfig)

---

### systemConfigSchema

Re-exports [systemConfigSchema](src/config/types.md#systemconfigschema)

---

### TariffCreate

Re-exports [TariffCreate](src/interfaces/dto/tariff.dto.md#tariffcreate)

---

### TariffCreateSchema

Re-exports [TariffCreateSchema](src/interfaces/dto/tariff.dto.md#tariffcreateschema)

---

### TariffDto

Re-exports [TariffDto](src/interfaces/dto/tariff.dto.md#tariffdto)

---

### TariffProps

Re-exports [TariffProps](src/interfaces/dto/tariff.dto.md#tariffprops)

---

### TariffSchema

Re-exports [TariffSchema](src/interfaces/dto/tariff.dto.md#tariffschema)

---

### tariffSchemas

Re-exports [tariffSchemas](src/interfaces/dto/tariff.dto.md#tariffschemas)

---

### TenantContextManager

Re-exports [TenantContextManager](src/interfaces/tenant.md#tenantcontextmanager)

---

### TenantCreate

Re-exports [TenantCreate](src/interfaces/dto/tenant.dto.md#tenantcreate)

---

### TenantCreateSchema

Re-exports [TenantCreateSchema](src/interfaces/dto/tenant.dto.md#tenantcreateschema)

---

### TenantDto

Re-exports [TenantDto](src/interfaces/dto/tenant.dto.md#tenantdto)

---

### TenantPartnerCreate

Re-exports [TenantPartnerCreate](src/interfaces/dto/tenant.partner.dto.md#tenantpartnercreate)

---

### TenantPartnerCreateSchema

Re-exports [TenantPartnerCreateSchema](src/interfaces/dto/tenant.partner.dto.md#tenantpartnercreateschema)

---

### TenantPartnerDto

Re-exports [TenantPartnerDto](src/interfaces/dto/tenant.partner.dto.md#tenantpartnerdto)

---

### TenantPartnerProps

Re-exports [TenantPartnerProps](src/interfaces/dto/tenant.partner.dto.md#tenantpartnerprops)

---

### TenantPartnerSchema

Re-exports [TenantPartnerSchema](src/interfaces/dto/tenant.partner.dto.md#tenantpartnerschema)

---

### tenantPartnerSchemas

Re-exports [tenantPartnerSchemas](src/interfaces/dto/tenant.partner.dto.md#tenantpartnerschemas)

---

### TenantProps

Re-exports [TenantProps](src/interfaces/dto/tenant.dto.md#tenantprops)

---

### TenantSchema

Re-exports [TenantSchema](src/interfaces/dto/tenant.dto.md#tenantschema)

---

### tenantSchemas

Re-exports [tenantSchemas](src/interfaces/dto/tenant.dto.md#tenantschemas)

---

### TenantUpdate

Re-exports [TenantUpdate](src/interfaces/dto/tenant.dto.md#tenantupdate)

---

### TenantUpdateSchema

Re-exports [TenantUpdateSchema](src/interfaces/dto/tenant.dto.md#tenantupdateschema)

---

### TransactionCreate

Re-exports [TransactionCreate](src/interfaces/dto/transaction.dto.md#transactioncreate)

---

### TransactionCreateSchema

Re-exports [TransactionCreateSchema](src/interfaces/dto/transaction.dto.md#transactioncreateschema)

---

### TransactionDto

Re-exports [TransactionDto](src/interfaces/dto/transaction.dto.md#transactiondto)

---

### TransactionEventCreate

Re-exports [TransactionEventCreate](src/interfaces/dto/transaction.event.dto.md#transactioneventcreate)

---

### TransactionEventCreateSchema

Re-exports [TransactionEventCreateSchema](src/interfaces/dto/transaction.event.dto.md#transactioneventcreateschema)

---

### TransactionEventDto

Re-exports [TransactionEventDto](src/interfaces/dto/transaction.event.dto.md#transactioneventdto)

---

### TransactionEventEnum

Re-exports [TransactionEventEnum](src/interfaces/dto/types/enums.md#transactioneventenum)

---

### TransactionEventEnumSchema

Re-exports [TransactionEventEnumSchema](src/interfaces/dto/types/enums.md#transactioneventenumschema)

---

### TransactionEventEnumType

Re-exports [TransactionEventEnumType](src/interfaces/dto/types/enums.md#transactioneventenumtype)

---

### TransactionEventProps

Re-exports [TransactionEventProps](src/interfaces/dto/transaction.event.dto.md#transactioneventprops)

---

### TransactionEventSchema

Re-exports [TransactionEventSchema](src/interfaces/dto/transaction.event.dto.md#transactioneventschema)

---

### transactionEventSchemas

Re-exports [transactionEventSchemas](src/interfaces/dto/transaction.event.dto.md#transactioneventschemas)

---

### TransactionProps

Re-exports [TransactionProps](src/interfaces/dto/transaction.dto.md#transactionprops)

---

### TransactionSchema

Re-exports [TransactionSchema](src/interfaces/dto/transaction.dto.md#transactionschema)

---

### transactionSchemas

Re-exports [transactionSchemas](src/interfaces/dto/transaction.dto.md#transactionschemas)

---

### TransactionType

Re-exports [TransactionType](src/interfaces/dto/types/transaction.type.md#transactiontype)

---

### TransactionTypeSchema

Re-exports [TransactionTypeSchema](src/interfaces/dto/types/transaction.type.md#transactiontypeschema)

---

### TriggerReasonEnum

Re-exports [TriggerReasonEnum](src/interfaces/dto/types/enums.md#triggerreasonenum)

---

### TriggerReasonEnumSchema

Re-exports [TriggerReasonEnumSchema](src/interfaces/dto/types/enums.md#triggerreasonenumschema)

---

### TriggerReasonEnumType

Re-exports [TriggerReasonEnumType](src/interfaces/dto/types/enums.md#triggerreasonenumtype)

---

### UnauthorizedError

Re-exports [UnauthorizedError](src/interfaces/api/exception/UnauthorizedError.md#unauthorizederror)

---

### UnauthorizedException

Re-exports [UnauthorizedException](src/interfaces/api/exceptions/unauthorized.exception.md#unauthorizedexception)

---

### UnitOfMeasure

Re-exports [UnitOfMeasure](src/interfaces/dto/types/sampled.value.dto.md#unitofmeasure)

---

### UnitOfMeasureSchema

Re-exports [UnitOfMeasureSchema](src/interfaces/dto/types/sampled.value.dto.md#unitofmeasureschema)

---

### UpdateChargingStationPasswordRequest

Re-exports [UpdateChargingStationPasswordRequest](src/ocpp/model/UpdateChargingStationPasswordRequest.md#updatechargingstationpasswordrequest)

---

### UserInfo

Re-exports [UserInfo](src/interfaces/api/auth/UserInfo.md#userinfo)

---

### VariableAttributeCreate

Re-exports [VariableAttributeCreate](src/interfaces/dto/variable.attribute.dto.md#variableattributecreate)

---

### VariableAttributeCreateSchema

Re-exports [VariableAttributeCreateSchema](src/interfaces/dto/variable.attribute.dto.md#variableattributecreateschema)

---

### VariableAttributeDto

Re-exports [VariableAttributeDto](src/interfaces/dto/variable.attribute.dto.md#variableattributedto)

---

### VariableAttributeProps

Re-exports [VariableAttributeProps](src/interfaces/dto/variable.attribute.dto.md#variableattributeprops)

---

### VariableAttributeSchema

Re-exports [VariableAttributeSchema](src/interfaces/dto/variable.attribute.dto.md#variableattributeschema)

---

### variableAttributeSchemas

Re-exports [variableAttributeSchemas](src/interfaces/dto/variable.attribute.dto.md#variableattributeschemas)

---

### VariableCharacteristicsCreate

Re-exports [VariableCharacteristicsCreate](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicscreate)

---

### VariableCharacteristicsCreateSchema

Re-exports [VariableCharacteristicsCreateSchema](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicscreateschema)

---

### VariableCharacteristicsDto

Re-exports [VariableCharacteristicsDto](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicsdto)

---

### VariableCharacteristicsProps

Re-exports [VariableCharacteristicsProps](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicsprops)

---

### VariableCharacteristicsSchema

Re-exports [VariableCharacteristicsSchema](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicsschema)

---

### variableCharacteristicsSchemas

Re-exports [variableCharacteristicsSchemas](src/interfaces/dto/variable.characteristics.dto.md#variablecharacteristicsschemas)

---

### VariableCreate

Re-exports [VariableCreate](src/interfaces/dto/variable.dto.md#variablecreate)

---

### VariableCreateSchema

Re-exports [VariableCreateSchema](src/interfaces/dto/variable.dto.md#variablecreateschema)

---

### VariableDto

Re-exports [VariableDto](src/interfaces/dto/variable.dto.md#variabledto)

---

### VariableMonitoringCreate

Re-exports [VariableMonitoringCreate](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringcreate)

---

### VariableMonitoringCreateSchema

Re-exports [VariableMonitoringCreateSchema](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringcreateschema)

---

### VariableMonitoringDto

Re-exports [VariableMonitoringDto](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringdto)

---

### VariableMonitoringProps

Re-exports [VariableMonitoringProps](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringprops)

---

### VariableMonitoringSchema

Re-exports [VariableMonitoringSchema](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringschema)

---

### variableMonitoringSchemas

Re-exports [variableMonitoringSchemas](src/interfaces/dto/variable.monitoring.dto.md#variablemonitoringschemas)

---

### VariableMonitoringStatusCreate

Re-exports [VariableMonitoringStatusCreate](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatuscreate)

---

### VariableMonitoringStatusCreateSchema

Re-exports [VariableMonitoringStatusCreateSchema](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatuscreateschema)

---

### VariableMonitoringStatusDto

Re-exports [VariableMonitoringStatusDto](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatusdto)

---

### VariableMonitoringStatusProps

Re-exports [VariableMonitoringStatusProps](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatusprops)

---

### VariableMonitoringStatusSchema

Re-exports [VariableMonitoringStatusSchema](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatusschema)

---

### variableMonitoringStatusSchemas

Re-exports [variableMonitoringStatusSchemas](src/interfaces/dto/variable.monitoring.status.dto.md#variablemonitoringstatusschemas)

---

### VariableProps

Re-exports [VariableProps](src/interfaces/dto/variable.dto.md#variableprops)

---

### VariableSchema

Re-exports [VariableSchema](src/interfaces/dto/variable.dto.md#variableschema)

---

### variableSchemas

Re-exports [variableSchemas](src/interfaces/dto/variable.dto.md#variableschemas)

---

### VariableStatusCreate

Re-exports [VariableStatusCreate](src/interfaces/dto/variable.status.dto.md#variablestatuscreate)

---

### VariableStatusCreateSchema

Re-exports [VariableStatusCreateSchema](src/interfaces/dto/variable.status.dto.md#variablestatuscreateschema)

---

### VariableStatusDto

Re-exports [VariableStatusDto](src/interfaces/dto/variable.status.dto.md#variablestatusdto)

---

### VariableStatusProps

Re-exports [VariableStatusProps](src/interfaces/dto/variable.status.dto.md#variablestatusprops)

---

### VariableStatusSchema

Re-exports [VariableStatusSchema](src/interfaces/dto/variable.status.dto.md#variablestatusschema)

---

### variableStatusSchemas

Re-exports [variableStatusSchemas](src/interfaces/dto/variable.status.dto.md#variablestatusschemas)

---

### Version

Re-exports [Version](src/interfaces/dto/types/ocpi.registration.md#version)

---

### VersionSchema

Re-exports [VersionSchema](src/interfaces/dto/types/ocpi.registration.md#versionschema)

---

### WebsocketServerConfig

Re-exports [WebsocketServerConfig](src/config/types.md#websocketserverconfig)

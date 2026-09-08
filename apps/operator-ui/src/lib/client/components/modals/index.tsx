// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OtherCommandsModal } from '@lib/client/components/modals/other-commands/other-commands-modal';
import { RemoteStartTransactionModal } from '@lib/client/components/modals/remote-start/remote-start-modal';
import { RemoteStopTransactionModal } from '@lib/client/components/modals/remote-stop/remote-stop-modal';
import { ResetModal } from '@lib/client/components/modals/reset/reset-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import { closeModal, selectModal } from '@lib/utils/store/modal-slice';
import { useDispatch, useSelector } from 'react-redux';
// Shared Modals (same for both OCPP versions)
import { DataTransferModal } from '@lib/client/components/modals/data-transfer/data-transfer-modal';
// OCPP 1.6 Modals
import { ChangeAvailabilityModal as ChangeAvailabilityModal16 } from '@lib/client/components/modals/1.6/change-availability/change-availability-modal';
import { ChangeConfigurationModal } from '@lib/client/components/modals/1.6/change-configuration/change-configuration-modal';
import { GetConfigurationModal } from '@lib/client/components/modals/1.6/get-configuration/get-configuration-modal';
import { TriggerMessageModal as TriggerMessageModal16 } from '@lib/client/components/modals/1.6/trigger-message/trigger-message-modal';
import { UpdateFirmwareModal as UpdateFirmwareModal16 } from '@lib/client/components/modals/1.6/update-firmware/update-firmware-modal'; // OCPP 2.0.1 Modals
import { CertificateSignedModal } from '@lib/client/components/modals/2.0.1/certificate-signed/certificate-signed-modal';
import { ChangeAvailabilityModal as ChangeAvailabilityModal201 } from '@lib/client/components/modals/2.0.1/change-availability/change-availability-modal';
import { ClearCacheModal } from '@lib/client/components/modals/2.0.1/clear-cache/clear-cache-modal';
import { CustomerInformationModal } from '@lib/client/components/modals/2.0.1/customer-information/customer-information-modal';
import { DeleteCertificateModal } from '@lib/client/components/modals/2.0.1/delete-certificate/delete-certificate-modal';
import { DeleteStationNetworkProfilesModal } from '@lib/client/components/modals/2.0.1/delete-station-network-profiles/delete-station-network-profiles-modal';
import { GetBaseReportModal } from '@lib/client/components/modals/2.0.1/get-base-report/get-base-report-modal';
import { GetInstalledCertificateIdsModal } from '@lib/client/components/modals/2.0.1/get-installed-certificate-ids/get-installed-certificate-ids-modal';
import { GetLogsModal } from '@lib/client/components/modals/2.0.1/get-logs/get-logs-modal';
import { GetTransactionStatusModal } from '@lib/client/components/modals/2.0.1/get-transaction-status/get-transaction-status-modal';
import { GetVariablesModal } from '@lib/client/components/modals/2.0.1/get-variables/get-variables-modal';
import { InstallCertificateModal } from '@lib/client/components/modals/2.0.1/install-certificate/install-certificate-modal';
import { SetNetworkProfileModal } from '@lib/client/components/modals/2.0.1/set-network-profile/set-network-profile-modal';
import { SetVariablesModal } from '@lib/client/components/modals/2.0.1/set-variables/set-variables-modal';
import { TriggerMessageModal as TriggerMessageModal201 } from '@lib/client/components/modals/2.0.1/trigger-message/trigger-message-modal';
import { UnlockConnectorModal } from '@lib/client/components/modals/2.0.1/unlock-connector/unlock-connector-modal';
import { UpdateAuthPasswordModal } from '@lib/client/components/modals/2.0.1/update-auth-password/update-auth-password-modal';
import { UpdateFirmwareModal as UpdateFirmwareModal201 } from '@lib/client/components/modals/2.0.1/update-firmware/update-firmware-modal';
import { ToggleStationOnlineModal } from '@lib/client/components/modals/toggle-status/toggle-station-online-modal';
import { ToggleTransactionActiveModal } from '@lib/client/components/modals/toggle-status/toggle-transaction-active-modal';
import { ModalComponentType } from '@lib/client/components/modals/modal-types';
import { ForceDisconnectModal } from './admin/force-disconnect/force-disconnect-modal';
import { GetDiagnosticsModal } from './1.6/get-diagnostics/get-diagnostics-modal';
import { isNullOrUndefined } from '@lib/utils/assertion';

const MODAL_COMPONENTS: Partial<{
  [key in ModalComponentType]: React.FC<any>;
}> = {
  // Admin Commands
  [ModalComponentType.forceDisconnect]: ForceDisconnectModal,
  // Shared Commands
  [ModalComponentType.remoteStart]: RemoteStartTransactionModal,
  [ModalComponentType.remoteStop]: RemoteStopTransactionModal,
  [ModalComponentType.reset]: ResetModal,
  [ModalComponentType.otherCommands]: OtherCommandsModal,
  // Shared
  [ModalComponentType.dataTransfer]: DataTransferModal,
  // OCPP 1.6
  [ModalComponentType.changeAvailability16]: ChangeAvailabilityModal16,
  [ModalComponentType.changeConfiguration16]: ChangeConfigurationModal,
  [ModalComponentType.getConfiguration16]: GetConfigurationModal,
  [ModalComponentType.getDiagnostics16]: GetDiagnosticsModal,
  [ModalComponentType.triggerMessage16]: TriggerMessageModal16,
  [ModalComponentType.updateFirmware16]: UpdateFirmwareModal16,
  // OCPP 2.0.1
  [ModalComponentType.certificateSigned]: CertificateSignedModal,
  [ModalComponentType.changeAvailability201]: ChangeAvailabilityModal201,
  [ModalComponentType.clearCache]: ClearCacheModal,
  [ModalComponentType.customerInformation]: CustomerInformationModal,
  [ModalComponentType.deleteCertificate]: DeleteCertificateModal,
  [ModalComponentType.deleteStationNetworkProfiles]: DeleteStationNetworkProfilesModal,
  [ModalComponentType.getBaseReport]: GetBaseReportModal,
  [ModalComponentType.getInstalledCertificateIds]: GetInstalledCertificateIdsModal,
  [ModalComponentType.getLogs]: GetLogsModal,
  [ModalComponentType.getTransactionStatus]: GetTransactionStatusModal,
  [ModalComponentType.getVariables]: GetVariablesModal,
  [ModalComponentType.installCertificate]: InstallCertificateModal,
  [ModalComponentType.setNetworkProfile]: SetNetworkProfileModal,
  [ModalComponentType.setVariables]: SetVariablesModal,
  [ModalComponentType.triggerMessage201]: TriggerMessageModal201,
  [ModalComponentType.unlockConnector]: UnlockConnectorModal,
  [ModalComponentType.updateAuthPassword]: UpdateAuthPasswordModal,
  [ModalComponentType.updateFirmware201]: UpdateFirmwareModal201,
  // Status Toggle Confirmations
  [ModalComponentType.toggleStationOnlineStatus]: ToggleStationOnlineModal,
  [ModalComponentType.toggleTransactionActiveStatus]: ToggleTransactionActiveModal,
};

const largeModals = [
  ModalComponentType.getVariables,
  ModalComponentType.setVariables,
  ModalComponentType.setNetworkProfile,
];

const AppModal = () => {
  const dispatch = useDispatch();
  const { isOpen, title, modalComponentType, modalComponentProps } = useSelector(selectModal);

  const ModalComponent = !isNullOrUndefined(modalComponentType)
    ? MODAL_COMPONENTS[modalComponentType]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dispatch(closeModal())}>
      <DialogContent
        className={`overflow-auto max-h-150! ${modalComponentType && largeModals.includes(modalComponentType) ? 'max-w-300!' : ''}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription></DialogDescription>
        {ModalComponent && <ModalComponent {...modalComponentProps} />}
      </DialogContent>
    </Dialog>
  );
};

export default AppModal;

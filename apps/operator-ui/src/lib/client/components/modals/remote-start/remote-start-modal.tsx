// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type EvseDto, OCPPVersion } from '@citrineos/types';
import { VersionedModal, type VersionedRender } from '../versioned-modal';
import { OCPP1_6_RemoteStart } from './1.6';
import { OCPP2_0_1_RemoteStart } from './2.0.1';

export interface RemoteStartTransactionModalProps {
  station: any;
  evse?: EvseDto;
}

export const RemoteStartTransactionModal = ({
  station,
  evse,
}: RemoteStartTransactionModalProps) => {
  const render: VersionedRender = {
    [OCPPVersion.OCPP1_6]: (s) => <OCPP1_6_RemoteStart station={s} />,
    [OCPPVersion.OCPP2_0_1]: (s) => <OCPP2_0_1_RemoteStart station={s} evse={evse} />,
    [OCPPVersion.OCPP2_1]: (s) => <OCPP2_0_1_RemoteStart station={s} evse={evse} />,
  };

  return <VersionedModal station={station} render={render} />;
};

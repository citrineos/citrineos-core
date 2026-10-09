// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { VersionedModal, type VersionedRender } from '../versioned-modal';
import { OCPP1_6_Commands } from './1.6';
import { OCPP2_0_1_Commands } from './2.0.1';

export interface OtherCommandsModalProps {
  station: any;
}

const OTHER_COMMANDS: VersionedRender = {
  [OCPPVersion.OCPP1_6]: (station) => <OCPP1_6_Commands station={station} />,
  [OCPPVersion.OCPP2_0_1]: (station) => <OCPP2_0_1_Commands station={station} />,
  [OCPPVersion.OCPP2_1]: (station) => <OCPP2_0_1_Commands station={station} />,
};

export const OtherCommandsModal = ({ station }: OtherCommandsModalProps) => (
  <VersionedModal station={station} render={OTHER_COMMANDS} />
);

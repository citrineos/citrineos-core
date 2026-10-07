// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { VersionedModal, type VersionedRender } from '../versioned-modal';
import { OCPP1_6_Reset } from './1.6';
import { OCPP2_0_1_Reset } from './2.0.1';

export interface ResetModalProps {
  station: any;
}

const RESET: VersionedRender = {
  [OCPPVersion.OCPP1_6]: (station) => <OCPP1_6_Reset station={station} />,
  [OCPPVersion.OCPP2_0_1]: (station) => <OCPP2_0_1_Reset station={station} />,
  [OCPPVersion.OCPP2_1]: (station) => <OCPP2_0_1_Reset station={station} />,
};

export const ResetModal = ({ station }: ResetModalProps) => (
  <VersionedModal station={station} render={RESET} />
);

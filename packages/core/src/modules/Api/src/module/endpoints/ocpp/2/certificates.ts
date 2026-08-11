// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type MessageEndpointClass, passthroughMessageEndpoint } from '@citrineos/base';
import { EventGroup, OCPP_CallAction } from '@citrineos/types';
import { DeleteCertificateEndpoint } from './certificates/DeleteCertificateEndpoint.js';
import { InstallCertificateEndpoint } from './certificates/InstallCertificateEndpoint.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from './schemas.js';

const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  passthroughMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Certificates,
    bodySchema: ocpp2Schema(schemaName),
  });

export const CERTIFICATES_MESSAGE_ENDPOINTS = [
  ocpp2(OCPP_CallAction.CertificateSigned, 'CertificateSignedRequestSchema'),
  InstallCertificateEndpoint,
  ocpp2(OCPP_CallAction.GetInstalledCertificateIds, 'GetInstalledCertificateIdsRequestSchema'),
  DeleteCertificateEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;

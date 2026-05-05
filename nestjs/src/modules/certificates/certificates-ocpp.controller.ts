// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CertificateSignedRequest } from '@dto/certificates/certificate-signed.request';
import { DeleteCertificateRequest } from '@dto/certificates/delete-certificate.request';
import { GetInstalledCertificateIdsRequest } from '@dto/certificates/get-installed-certificate-ids.request';
import { InstallCertificateRequest } from '@dto/certificates/install-certificate.request';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallDispatcher } from '@remote-calls/remote-call.dispatcher';
import { ModuleSegment, OCPPVersionSegment, ocppRoute } from '@ocpp/route-segments';

const dto = (body: object): Record<string, unknown> => ({ ...body });

/**
 * CSMS-initiated REST endpoints under the legacy `Certificates` tag.
 * Mirrors `Server/src/Certificates/module.ts`.
 */
@ApiTags('Certificates')
@Controller('ocpp')
export class CertificatesOcppController {
  constructor(private readonly dispatcher: RemoteCallDispatcher) {}

  // -------- 2.0.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Certificates, 'certificateSigned'))
  @ApiOperation({ summary: 'Deliver a freshly-signed certificate to the charger (OCPP 2.0.1)' })
  certificateSigned201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CertificateSignedRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CertificateSigned,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Certificates, 'installCertificate'))
  @ApiOperation({ summary: 'Install a certificate on the charger (OCPP 2.0.1)' })
  installCertificate201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: InstallCertificateRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.InstallCertificate,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(
    ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Certificates, 'getInstalledCertificateIds'),
  )
  @ApiOperation({ summary: 'List installed certificate ids on the charger (OCPP 2.0.1)' })
  getInstalledCertificateIds201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetInstalledCertificateIdsRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetInstalledCertificateIds,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_0_1, ModuleSegment.Certificates, 'deleteCertificate'))
  @ApiOperation({ summary: 'Delete an installed certificate (OCPP 2.0.1)' })
  deleteCertificate201(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: DeleteCertificateRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.DeleteCertificate,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  // -------- 2.1 --------

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Certificates, 'certificateSigned'))
  @ApiOperation({ summary: 'Deliver a freshly-signed certificate to the charger (OCPP 2.1)' })
  certificateSigned21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: CertificateSignedRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.CertificateSigned,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Certificates, 'installCertificate'))
  @ApiOperation({ summary: 'Install a certificate on the charger (OCPP 2.1)' })
  installCertificate21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: InstallCertificateRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.InstallCertificate,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(
    ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Certificates, 'getInstalledCertificateIds'),
  )
  @ApiOperation({ summary: 'List installed certificate ids on the charger (OCPP 2.1)' })
  getInstalledCertificateIds21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: GetInstalledCertificateIdsRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.GetInstalledCertificateIds,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }

  @Post(ocppRoute(OCPPVersionSegment.V2_1, ModuleSegment.Certificates, 'deleteCertificate'))
  @ApiOperation({ summary: 'Delete an installed certificate (OCPP 2.1)' })
  deleteCertificate21(
    @Query('identifier') identifier: string | string[],
    @Query('tenantId') tenantId: string = '1',
    @Body() body: DeleteCertificateRequest,
  ): Promise<MessageConfirmation[]> {
    return this.dispatcher.dispatch(
      OCPP_CallAction.DeleteCertificate,
      identifier,
      Number(tenantId),
      dto(body),
    );
  }
}

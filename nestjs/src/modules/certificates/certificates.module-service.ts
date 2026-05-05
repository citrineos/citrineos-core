import { Inject, Injectable } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import {
  CERTIFICATES_MODULE_CONFIG,
  CONFIG_LIMITS,
  type ConfigLimits,
} from '@modules/config/config.tokens';
import type { CertificatesModuleConfig } from '@modules/config/config.schema';
import { AbstractOcppModule } from '@ocpp/abstract-ocpp-module';
import { CacheService } from '@cache/cache.service';
import { EventGroup } from '@ocpp/event-group';
import { OcppHandlerRef } from '@ocpp/ocpp-request-handler';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import { Get15118EVCertificateHandler } from '@modules/certificates/handlers/get15118ev-certificate.handler';
import { GetCertificateStatusHandler } from '@modules/certificates/handlers/get-certificate-status.handler';
import { SignCertificateHandler } from '@modules/certificates/handlers/sign-certificate.handler';
import { DeleteCertificateResponseHandler } from '@modules/certificates/response-handlers/delete-certificate.response-handler';
import { InstallCertificateResponseHandler } from '@modules/certificates/response-handlers/install-certificate.response-handler';
import { CertificateSignedResponseHandler } from '@modules/certificates/response-handlers/certificate-signed.response-handler';

/**
 * Certificates module-service. Subclasses AbstractOcppModule to
 * register this module’s request handlers and CSMS-initiated response
 * handlers with the AMQP routing layer. Maps OCPP (action, version) pairs
 * onto handler instances at boot.
 */
@Injectable()
export class CertificatesModuleService extends AbstractOcppModule {
  protected readonly eventGroup = EventGroup.Certificates;

  constructor(
    amqp: AmqpService,
    @Inject(CERTIFICATES_MODULE_CONFIG) cfg: CertificatesModuleConfig,
    @Inject(CONFIG_LIMITS) limits: ConfigLimits,
    cache: CacheService,
    private readonly get15118EVCertificate: Get15118EVCertificateHandler,
    private readonly getCertificateStatus: GetCertificateStatusHandler,
    private readonly signCertificate: SignCertificateHandler,
    private readonly deleteCertificateResponse: DeleteCertificateResponseHandler,
    private readonly installCertificateResponse: InstallCertificateResponseHandler,
    private readonly certificateSignedResponse: CertificateSignedResponseHandler,
  ) {
    super(amqp, cfg, limits, cache);
  }

  protected getHandlers(): OcppHandlerRef[] {
    return [this.get15118EVCertificate, this.getCertificateStatus, this.signCertificate];
  }

  protected override getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [
      this.deleteCertificateResponse,
      this.installCertificateResponse,
      this.certificateSignedResponse,
    ];
  }
}

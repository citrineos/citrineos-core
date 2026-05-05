import { Module } from '@nestjs/common';
import { AmqpModule } from '@amqp/amqp.module';
import { CertificatesModuleService } from '@modules/certificates/certificates.module-service';
import { CertificatesOcppController } from '@modules/certificates/certificates-ocpp.controller';
import { Get15118EVCertificateHandler } from '@modules/certificates/handlers/get15118ev-certificate.handler';
import { GetCertificateStatusHandler } from '@modules/certificates/handlers/get-certificate-status.handler';
import { SignCertificateHandler } from '@modules/certificates/handlers/sign-certificate.handler';
import { DeleteCertificateResponseHandler } from '@modules/certificates/response-handlers/delete-certificate.response-handler';
import { InstallCertificateResponseHandler } from '@modules/certificates/response-handlers/install-certificate.response-handler';
import { CertificateSignedResponseHandler } from '@modules/certificates/response-handlers/certificate-signed.response-handler';

@Module({
  imports: [AmqpModule],
  providers: [
    CertificatesModuleService,
    Get15118EVCertificateHandler,
    GetCertificateStatusHandler,
    SignCertificateHandler,
    DeleteCertificateResponseHandler,
    InstallCertificateResponseHandler,
    CertificateSignedResponseHandler,
  ],
  controllers: [CertificatesOcppController],
})
/**
 * NestJS DI module wiring the Certificates surface.
 * Declares the providers, controllers, and re-exports that other modules
 * consume to interact with this domain.
 */
export class CertificatesModule {}

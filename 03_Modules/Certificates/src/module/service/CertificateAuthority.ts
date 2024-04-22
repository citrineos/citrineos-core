// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {AttributeEnumType, CacheNamespace, CertificateSigningUseEnumType, ICache, SystemConfig} from '@citrineos/base';
import {ICertificateAuthorityClient} from '../client/interface';
import {Hubject} from '../client/hubject';
import * as forge from 'node-forge';
import {IDeviceModelRepository} from '@citrineos/data';

export class CertificateAuthorityService {
    private readonly _certificateAuthority: ICertificateAuthorityClient;
    private readonly _cache: ICache;
    private readonly _deviceModelRepository: IDeviceModelRepository;
    private _securityCaCertKeyPairs: Map<string, [forge.pki.Certificate, forge.pki.rsa.PrivateKey]> = new Map();

    constructor(
        config: SystemConfig,
        cache: ICache,
        securityCaCertKeyPairs: Map<string, [forge.pki.Certificate, forge.pki.rsa.PrivateKey]>,
        deviceModelRepository: IDeviceModelRepository
    ) {
        // TODO: Add init for other caServer implementations based on the caServer value
        //  const caServer = config.modules.certificates?.certificateAuthority?.caServer;
        this._certificateAuthority = new Hubject(config);
        this._cache = cache;
        this._securityCaCertKeyPairs = securityCaCertKeyPairs;
        this._deviceModelRepository = deviceModelRepository;
    }

    async getCertificateChain(
        csrString: string,
        stationId: string,
        certificateType?: CertificateSigningUseEnumType
    ): Promise<string> {
        switch (certificateType) {
            case CertificateSigningUseEnumType.V2GCertificate: {
                const signedCert = await this._certificateAuthority.getSignedCertificate(csrString);
                const caCerts = await this._certificateAuthority.getCACertificates();
                return this._createCertificateChainWithoutRoot(signedCert, caCerts);
            }
            case CertificateSigningUseEnumType.ChargingStationCertificate: {
                const csr: forge.pki.CertificateSigningRequest = await this._getVerifiedChargingStationCertificateCSR(csrString, stationId);
                return await this._signChargingStationCertificate(csr, stationId);
            }
            default: {
                throw new Error(`Unsupported certificate type: ${certificateType}`);
            }
        }
    }

    /**
     * Create a certificate chain without the root certificate.
     *
     * @param {string} signedCert - The signed certificate.
     * @param {string} caCerts - The CA certificates.
     * @return {string} The certificate chain pem without the root cert.
     */
    private _createCertificateChainWithoutRoot(signedCert: string, caCerts: string): string {
        let certChainPem: string = signedCert;
        const caCertsArray: string[] = caCerts.split('-----END CERTIFICATE-----')
            .filter(cert => cert.trim().length > 0);

        caCertsArray.forEach((certPem) => {
                // Add "-----END CERTIFICATE-----" back because split removes it
                const pemWithEnd = certPem + '-----END CERTIFICATE-----';
                const parsedCert = forge.pki.certificateFromPem(pemWithEnd);
                if (!parsedCert.isIssuer(parsedCert)) {
                    certChainPem = certChainPem.concat(pemWithEnd);
                }
            }
        );

        return certChainPem;
    }

    private async _getVerifiedChargingStationCertificateCSR(
        csrString: string,
        stationId: string
    ): Promise<forge.pki.CertificateSigningRequest> {
        const csr: forge.pki.CertificateSigningRequest = forge.pki.certificationRequestFromPem(csrString);

        if (!csr.verify()) {
            throw new Error('Verify the signature on this csr using its public key failed');
        }

        const organizationName = await this._deviceModelRepository.readAllByQuery({
            stationId: stationId,
            component_name: 'SecurityCtrlr',
            variable_name: 'OrganizationName',
            type: AttributeEnumType.Actual,
        });
        const organizationNameCsr = csr.subject.getField({name: 'organizationName'});
        if (organizationName && organizationName.length > 0 && organizationName[0] !== organizationNameCsr){
            throw new Error(`Expect organizationName ${organizationName[0]} but get ${organizationNameCsr} from the csr`);
        }

        return csr;
    }

    private async _signChargingStationCertificate(
        csr: forge.pki.CertificateSigningRequest,
        stationId: string
    ): Promise<string> {
        const clientConnection: string = (await this._cache.get(stationId, CacheNamespace.Connections)) as string;
        if (!this._securityCaCertKeyPairs.has(clientConnection)) {
            throw new Error(`CA certificate and private key for server ${clientConnection} not found`);
        }
        const [caCert, caPrivateKey] =
            this._securityCaCertKeyPairs.get(clientConnection) as [forge.pki.Certificate, forge.pki.rsa.PrivateKey];

        return forge.pki.certificateToPem(this._createSignedCertificate(csr, caCert, caPrivateKey));
    }

    /**
     * Generate a serial number without leading 0s.
     */
    private _generateSerialNumber(): string {
        const hexString = forge.util.bytesToHex(forge.random.getBytesSync(20));
        return hexString.replace(/^0+/, '');
    }

    private _createSignedCertificate(
        csr: forge.pki.CertificateSigningRequest,
        caCert: forge.pki.Certificate,
        caPrivateKey: forge.pki.rsa.PrivateKey
    ): forge.pki.Certificate {
        const cert = forge.pki.createCertificate();
        cert.publicKey = csr.publicKey as forge.pki.rsa.PublicKey;
        cert.serialNumber = this._generateSerialNumber(); // Unique serial number for the certificate
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(
            cert.validity.notAfter.getFullYear() + 1,
        ); // 1-year validity
        // Set CA's attributes as issuer
        cert.setIssuer(caCert.subject.attributes);
        cert.setSubject(csr.subject.attributes);
        cert.setExtensions([{
            name: 'basicConstraints',
            cA: false,
        }, {
            name: 'keyUsage',
            digitalSignature: true,
            keyEncipherment: true
        }]);
        // Sign the certificate
        cert.sign(caPrivateKey);
        return cert;
    }
}

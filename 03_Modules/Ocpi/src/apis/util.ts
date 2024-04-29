import {BaseAPI, HTTPHeaders} from './BaseApi';

export interface BaseOcpiHeaders {
    authorization: string;
    xRequestID: string;
    xCorrelationID: string;
    oCPIFromCountryCode: string;
    oCPIFromPartyId: string;
    oCPIToCountryCode: string;
    oCPIToPartyId: string;
}

export const setAuthHeader = (headerParameters: HTTPHeaders) => {
    const tokenString = 'todo'; // todo get token from registration
    headerParameters['Authorization'] = `Bearer ${tokenString}`;
};

export const validateAndgetOcpiHeaders = <T>(requestParameters: T): HTTPHeaders => {

    BaseAPI.validateRequiredParam(requestParameters,
        'authorization',
        'xRequestID',
        'xCorrelationID',
        'oCPIFromCountryCode',
        'oCPIFromPartyId',
        'oCPIToCountryCode',
        'oCPIToPartyId'
    );
    const headerParameters: HTTPHeaders = {};
    if ((requestParameters as any)['authorization'] != null) {
        headerParameters['authorization'] = String((requestParameters as any)['authorization']);
    }

    if ((requestParameters as any)['xRequestID'] != null) {
        headerParameters['X-Request-ID'] = String((requestParameters as any)['xRequestID']);
    }

    if ((requestParameters as any)['xCorrelationID'] != null) {
        headerParameters['X-Correlation-ID'] = String((requestParameters as any)['xCorrelationID']);
    }

    if ((requestParameters as any)['oCPIFromCountryCode'] != null) {
        headerParameters['OCPI-from-country-code'] = String((requestParameters as any)['oCPIFromCountryCode']);
    }

    if ((requestParameters as any)['oCPIFromPartyId'] != null) {
        headerParameters['OCPI-from-party-id'] = String((requestParameters as any)['oCPIFromPartyId']);
    }

    if ((requestParameters as any)['oCPIToCountryCode'] != null) {
        headerParameters['OCPI-to-country-code'] = String((requestParameters as any)['oCPIToCountryCode']);
    }

    if ((requestParameters as any)['oCPIToPartyId'] != null) {
        headerParameters['OCPI-to-party-id'] = String((requestParameters as any)['oCPIToPartyId']);
    }

    return headerParameters;
};

import {HTTPHeaders} from './BaseApi';
import {OcpiParams} from "./util/ocpi.params";

export const setAuthHeader = (headerParameters: HTTPHeaders) => {
  const tokenString = 'todo'; // todo get token from credentials
  headerParameters['Authorization'] = `Bearer ${tokenString}`;
};

export const getOcpiHeaders = (
  params: OcpiParams,
): HTTPHeaders => {

  const headerParameters: HTTPHeaders = {};

  if (params.xRequestID != null) {
    headerParameters['X-Request-ID'] = String(params.xRequestID);
  }

  if (params.xCorrelationID != null) {
    headerParameters['X-Correlation-ID'] = String(params.xCorrelationID);
  }

  if (params.fromCountryCode != null) {
    headerParameters['OCPI-from-country-code'] = String(params.fromCountryCode);
  }

  if (params.fromPartyId != null) {
    headerParameters['OCPI-from-party-id'] = String(params.fromPartyId);
  }

  if (params.toCountryCode != null) {
    headerParameters['OCPI-to-country-code'] = String(params.toCountryCode);
  }

  if (params.toPartyId != null) {
    headerParameters['OCPI-to-party-id'] = String(params.toPartyId);
  }

  return headerParameters;
};

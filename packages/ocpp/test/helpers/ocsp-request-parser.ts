// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import jsrsasign from 'jsrsasign';

export interface ParsedOcspCertId {
  alg: string;
  issname: string;
  isskey: string;
  sbjsn: string;
}

// @types/jsrsasign does not declare OCSPParser, which jsrsasign 11 ships.
const { OCSPParser } = jsrsasign.KJUR.asn1.ocsp as unknown as {
  OCSPParser: new () => { getOCSPRequest(hex: string): { array: ParsedOcspCertId[] } };
};

export function parseOcspRequestHex(hex: string): ParsedOcspCertId[] {
  return new OCSPParser().getOCSPRequest(hex).array;
}

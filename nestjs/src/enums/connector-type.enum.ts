// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** OCPP 2.0.1 / 2.1 ConnectorEnumType — physical connector types. Used by ReserveNow. */
export enum ConnectorEnumType {
  cCCS1 = 'cCCS1',
  cCCS2 = 'cCCS2',
  cG105 = 'cG105',
  cTesla = 'cTesla',
  cType1 = 'cType1',
  cType2 = 'cType2',
  s309_1P_16A = 's309-1P-16A',
  s309_1P_32A = 's309-1P-32A',
  s309_3P_16A = 's309-3P-16A',
  s309_3P_32A = 's309-3P-32A',
  sBS1361 = 'sBS1361',
  sCEE_7_7 = 'sCEE-7-7',
  sType2 = 'sType2',
  sType3 = 'sType3',
  Other1PhMax16A = 'Other1PhMax16A',
  Other1PhOver16A = 'Other1PhOver16A',
  Other3Ph = 'Other3Ph',
  Pan = 'Pan',
  wInductive = 'wInductive',
  wResonant = 'wResonant',
  Undetermined = 'Undetermined',
  Unknown = 'Unknown',
}

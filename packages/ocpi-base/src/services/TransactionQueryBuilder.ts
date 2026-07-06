// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { Service } from 'typedi';
// import { OcpiLocation, OcpiLocationProps } from '../model/OcpiLocation';
// import { OcpiToken } from '../model/OcpiToken';
// import { Op } from 'sequelize';
// import {
//   Authorization,
//   ChargingStation,
//   Evse,
//   IdToken,
//   Location,
//   MeterValue,
//   TransactionEvent,
//   Transaction,
// } from '@citrineos/core';
// import { OCPP2_0_1 } from '@citrineos/base';

// @Service()
// export class TransactionQueryBuilder {
//   private readonly MODELS = {
//     CHARGING_STATION: 'ChargingStation',
//     LOCATION: 'Location',
//     OCPI_LOCATION: 'OcpiLocation',
//     TRANSACTION_EVENT: 'TransactionEvent',
//     ID_TOKEN: 'IdToken',
//     AUTHORIZATION: 'Authorization',
//     OCPI_TOKEN: 'OcpiToken',
//   };

//   buildQuery(params: QueryParams, endedOnly?: boolean): any {
//     const modelsToInclude: any[] = [
//       this.createMspFilters(params.mspCountryCode, params.mspPartyId),
//       this.createCpoFilters(params.cpoCountryCode, params.cpoPartyId),
//       MeterValue,
//       Evse,
//       ...(endedOnly
//         ? [
//             {
//               model: TransactionEvent,
//               as: Transaction.TRANSACTION_EVENTS_FILTER_ALIAS,
//               attributes: ['eventType'],
//               where: {
//                 eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
//               },
//             },
//           ]
//         : []),
//     ];

//     const queryOptions: any = {
//       ...(endedOnly ? { where: { totalKwh: { [Op.gt]: 0 } } } : {}),
//       include: [...modelsToInclude],
//       order: [['createdAt', 'ASC']],
//     };

//     this.addDateFilters(queryOptions, params.dateFrom, params.dateTo);
//     this.addPagination(queryOptions, params.offset, params.limit);

//     return queryOptions;
//   }

//   private addDateFilters(
//     queryOptions: any,
//     dateFrom?: Date,
//     dateTo?: Date,
//   ): void {
//     if (dateFrom || dateTo) {
//       queryOptions.where = { ...(queryOptions.where ?? {}), updatedAt: {} };
//       if (dateFrom) {
//         queryOptions.where.updatedAt[Op.gte] = dateFrom;
//       }
//       if (dateTo) {
//         queryOptions.where.updatedAt[Op.lt] = dateTo;
//       }
//     }
//   }

//   private createMspFilters(mspCountryCode?: string, mspPartyId?: string): any {
//     const ocpiTokenInclude: any = {
//       model: OcpiToken,
//       required: true,
//       duplicating: false,
//     };

//     if (mspCountryCode || mspPartyId) {
//       ocpiTokenInclude.where = ocpiTokenInclude.where ?? {};
//       if (mspCountryCode) {
//         ocpiTokenInclude.where.country_code = mspCountryCode;
//       }
//       if (mspPartyId) {
//         ocpiTokenInclude.where.party_id = mspPartyId;
//       }
//     }

//     return {
//       model: TransactionEvent,
//       as: Transaction.TRANSACTION_EVENTS_ALIAS,
//       required: true,
//       include: [
//         {
//           model: IdToken,
//           include: [
//             {
//               model: Authorization,
//               include: [ocpiTokenInclude],
//             },
//           ],
//         },
//       ],
//     };
//   }

//   private createCpoFilters(cpoCountryCode?: string, cpoPartyId?: string): any {
//     const ocpiLocationInclude: any = {
//       model: OcpiLocation,
//       required: true,
//       duplicating: false,
//     };

//     if (cpoCountryCode || cpoPartyId) {
//       ocpiLocationInclude.where = ocpiLocationInclude.where ?? {};
//       if (cpoCountryCode) {
//         ocpiLocationInclude.where[OcpiLocationProps.countryCode] =
//           cpoCountryCode;
//       }
//       if (cpoPartyId) {
//         ocpiLocationInclude.where[OcpiLocationProps.partyId] = cpoPartyId;
//       }
//     }

//     return {
//       model: ChargingStation,
//       required: true,
//       include: [
//         {
//           model: Location,
//           required: true,
//           include: [ocpiLocationInclude],
//         },
//       ],
//     };
//   }

//   private addPagination(
//     queryOptions: any,
//     offset?: number,
//     limit?: number,
//   ): void {
//     if (offset) {
//       queryOptions.offset = offset;
//     }
//     if (limit) {
//       queryOptions.limit = limit;
//     }
//   }
// }

// interface QueryParams {
//   dateFrom?: Date;
//   dateTo?: Date;
//   offset?: number;
//   limit?: number;
//   mspCountryCode?: string;
//   mspPartyId?: string;
//   cpoCountryCode?: string;
//   cpoPartyId?: string;
// }

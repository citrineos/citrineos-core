// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { BaseClientApi } from './base-client-api';
// import { PutChargingProfileParams } from './param/charging-profiles/put-charging-profile-params';
// import { IHeaders } from 'typed-rest-client/Interfaces';
// import { ModuleId } from '../model/module-id';
// import { InterfaceRole } from '../model/interface-role';
// import { OcpiEmptyResponse } from '../model/ocpi-empty-response';

// export class ChargingProfilesClientApi extends BaseClientApi {
//   CONTROLLER_PATH = ModuleId.ChargingProfiles;

//   async putChargingProfile(
//     params: PutChargingProfileParams,
//   ): Promise<OcpiEmptyResponse> {
//     this.validateRequiredParam(params, 'sessionId', 'activeChargingProfile');

//     params.authorization = await this.getAuthToken(
//       params.fromCountryCode,
//       params.fromPartyId,
//       params.toCountryCode,
//       params.toPartyId,
//     );

//     const endpoint = await this.getEndpointWithVersion(
//       params.fromCountryCode,
//       params.fromPartyId,
//       params.toCountryCode,
//       params.toPartyId,
//       ModuleId.ChargingProfiles,
//       InterfaceRole.RECEIVER,
//     );
//     params.version = endpoint.clientVersion.version;

//     this.baseUrl = endpoint.url;
//     const additionalHeaders: IHeaders = this.getOcpiHeaders(params);

//     return await this.replace(
//       OcpiEmptyResponse,
//       {
//         version: params.version,
//         path: '{sessionId}'.replace(
//           '{sessionId}',
//           encodeURIComponent(params.sessionId),
//         ),
//         additionalHeaders,
//       },
//       params.activeChargingProfile,
//     );
//   }
// }

// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type Endpoint as BaseEndpoint,
  type BusinessDetails,
  type CredentialRole,
  type Image,
  OCPIVersionNumberEnum,
  type OCPIVersionNumberEnumType,
  type TenantPartnerDto,
} from '@citrineos/base';
import type { CredentialsDTO } from '../index.js';
import { ImageCategory, ImageType, Role, VersionNumber } from '../index.js';
import type { BusinessDetailsDTO } from '../model/DTO/BusinessDetailsDTO.js';
import type { CredentialsRoleDTO } from '../model/DTO/CredentialsRoleDTO.js';
import type { ImageDTO } from '../model/DTO/ImageDTO.js';
import type { Endpoint } from '../model/Endpoint.js';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import { InterfaceRole } from '../model/InterfaceRole.js';
import { ModuleId } from '../model/ModuleId.js';

export class RegistrationMapper {
  static tenantPartnerToCredentialsDto(partner: TenantPartnerDto): CredentialsDTO {
    const partnerProfile = partner.partnerProfileOCPI!;
    const tenant = partner.tenant!;
    const serverProfile = tenant.serverProfileOCPI!;
    return {
      token: partnerProfile.serverCredentials.token!,
      url: partnerProfile.serverCredentials.versionsUrl,
      roles: [
        RegistrationMapper.toCredentialsRoleDto(
          tenant.countryCode!,
          tenant.partyId!,
          serverProfile.credentialsRole,
        ),
      ],
    };
  }

  static toCredentialsRoleDto(
    countryCode: string,
    partyId: string,
    value: CredentialRole,
  ): CredentialsRoleDTO {
    return {
      country_code: countryCode,
      party_id: partyId,
      role: RegistrationMapper.toRole(value.role),
      business_details: RegistrationMapper.toBusinessDetails(value.businessDetails),
    };
  }

  static toCredentialsRole(value: CredentialsRoleDTO): CredentialRole {
    return {
      role: RegistrationMapper.toRoleString(value.role),
      businessDetails: RegistrationMapper.toRegistrationBusinessDetails(value.business_details),
    };
  }

  static toBusinessDetails(value: BusinessDetails): BusinessDetailsDTO {
    return {
      name: value.name,
      website: value.website,
      logo: value.logo && RegistrationMapper.toImage(value.logo),
    };
  }

  static toRegistrationBusinessDetails(value: BusinessDetailsDTO): BusinessDetails {
    return {
      name: value.name,
      website: value.website || undefined,
      logo: (value.logo && RegistrationMapper.toRegistrationImage(value.logo)) || undefined,
    };
  }

  static toImage(value: Image): ImageDTO {
    return {
      url: value.url,
      type: RegistrationMapper.toImageType(value.type),
      category: RegistrationMapper.toImageCategory(value.category),
      height: value.height,
      width: value.width,
    };
  }

  static toRegistrationImage(value: ImageDTO): Image {
    return {
      url: value.url,
      type: value.type,
      category: value.category,
      height: value.height || undefined,
      width: value.width || undefined,
    };
  }

  static toRole(value: 'CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP'): Role {
    switch (value) {
      case 'CPO':
        return Role.CPO;
      case 'EMSP':
        return Role.EMSP;
      case 'HUB':
        return Role.HUB;
      case 'NAP':
        return Role.NAP;
      case 'NSP':
        return Role.NSP;
      case 'SCSP':
        return Role.SCSP;
    }
  }

  static toRoleString(value: Role): 'CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP' {
    switch (value) {
      case Role.CPO:
        return 'CPO';
      case Role.EMSP:
        return 'EMSP';
      case Role.HUB:
        return 'HUB';
      case Role.NAP:
        return 'NAP';
      case Role.NSP:
        return 'NSP';
      case Role.SCSP:
        return 'SCSP';
      default:
        throw new Error(`Unknown Role ${value}`);
    }
  }

  static toImageType(value: string): ImageType {
    switch (value) {
      case 'jpeg':
        return ImageType.jpeg;
      case 'jpg':
        return ImageType.jpg;
      case 'png':
        return ImageType.png;
      case 'svg':
        return ImageType.svg;
      default:
        throw new Error(`Unknown image type ${value}`);
    }
  }

  static toImageCategory(value: string): ImageCategory {
    switch (value) {
      case 'CHARGER':
        return ImageCategory.CHARGER;
      case 'ENTRANCE':
        return ImageCategory.ENTRANCE;
      case 'LOCATION':
        return ImageCategory.LOCATION;
      case 'NETWORK':
        return ImageCategory.NETWORK;
      case 'OPERATOR':
        return ImageCategory.OPERATOR;
      case 'OTHER':
        return ImageCategory.OTHER;
      case 'OWNER':
        return ImageCategory.OWNER;
      default:
        throw new Error(`Unknown image category ${value}`);
    }
  }

  static toVersionNumber(value: OCPIVersionNumberEnumType): VersionNumber {
    switch (value) {
      case OCPIVersionNumberEnum['2.2.1']:
        return VersionNumber.TWO_DOT_TWO_DOT_ONE;
      default:
        throw new Error(`Unsupported OCPI version ${value}`);
    }
  }

  static toOCPIVersionNumber(value: VersionNumber): OCPIVersionNumberEnumType {
    switch (value) {
      case VersionNumber.TWO_DOT_TWO_DOT_ONE:
        return OCPIVersionNumberEnum['2.2.1'];
      default:
        throw new Error(`Unsupported version ${value}`);
    }
  }

  static toEndpoint(value: Endpoint): BaseEndpoint {
    return {
      identifier: RegistrationMapper.toEndpointIdentifier(value),
      url: value.url,
    };
  }

  static toEndpointIdentifier(value: Endpoint): EndpointIdentifier {
    switch (value.identifier) {
      case ModuleId.Credentials:
        return EndpointIdentifier.CREDENTIALS;
      case ModuleId.Cdrs:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.CDRS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.CDRS_RECEIVER;
        break;
      case ModuleId.Locations:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.LOCATIONS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.LOCATIONS_RECEIVER;
        break;
      case ModuleId.Sessions:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.SESSIONS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.SESSIONS_RECEIVER;
        break;
      case ModuleId.Tariffs:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.TARIFFS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.TARIFFS_RECEIVER;
        break;
      case ModuleId.Tokens:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.TOKENS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.TOKENS_RECEIVER;
        break;
      case ModuleId.Commands:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.COMMANDS_SENDER;
        if (value.role === InterfaceRole.RECEIVER) return EndpointIdentifier.COMMANDS_RECEIVER;
        break;
      case ModuleId.ChargingProfiles:
        if (value.role === InterfaceRole.SENDER) return EndpointIdentifier.CHARGING_PROFILES_SENDER;
        if (value.role === InterfaceRole.RECEIVER)
          return EndpointIdentifier.CHARGING_PROFILES_RECEIVER;
        break;
      default:
        throw new Error(`Unknown module identifier: ${value.identifier}`);
    }
    throw new Error(`Unknown role for module ${value.identifier}: ${value.role}`);
  }

  static toModuleAndRole(value: BaseEndpoint): {
    identifier: ModuleId;
    role: InterfaceRole;
  } {
    switch (value.identifier) {
      case EndpointIdentifier.CREDENTIALS:
        return { identifier: ModuleId.Credentials, role: InterfaceRole.SENDER };
      case EndpointIdentifier.CDRS_SENDER:
        return { identifier: ModuleId.Cdrs, role: InterfaceRole.SENDER };
      case EndpointIdentifier.CDRS_RECEIVER:
        return { identifier: ModuleId.Cdrs, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.LOCATIONS_SENDER:
        return { identifier: ModuleId.Locations, role: InterfaceRole.SENDER };
      case EndpointIdentifier.LOCATIONS_RECEIVER:
        return { identifier: ModuleId.Locations, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.SESSIONS_SENDER:
        return { identifier: ModuleId.Sessions, role: InterfaceRole.SENDER };
      case EndpointIdentifier.SESSIONS_RECEIVER:
        return { identifier: ModuleId.Sessions, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.TARIFFS_SENDER:
        return { identifier: ModuleId.Tariffs, role: InterfaceRole.SENDER };
      case EndpointIdentifier.TARIFFS_RECEIVER:
        return { identifier: ModuleId.Tariffs, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.TOKENS_SENDER:
        return { identifier: ModuleId.Tokens, role: InterfaceRole.SENDER };
      case EndpointIdentifier.TOKENS_RECEIVER:
        return { identifier: ModuleId.Tokens, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.COMMANDS_SENDER:
        return { identifier: ModuleId.Commands, role: InterfaceRole.SENDER };
      case EndpointIdentifier.COMMANDS_RECEIVER:
        return { identifier: ModuleId.Commands, role: InterfaceRole.RECEIVER };
      case EndpointIdentifier.CHARGING_PROFILES_SENDER:
        return {
          identifier: ModuleId.ChargingProfiles,
          role: InterfaceRole.SENDER,
        };
      case EndpointIdentifier.CHARGING_PROFILES_RECEIVER:
        return {
          identifier: ModuleId.ChargingProfiles,
          role: InterfaceRole.RECEIVER,
        };
      default:
        throw new Error(`Unknown endpoint identifier: ${value.identifier}`);
    }
  }
}

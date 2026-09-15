// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  Endpoint as BaseEndpoint,
  BusinessDetails,
  CredentialRole,
  Image,
  OCPIVersionNumberEnumType,
  TenantPartnerDto,
} from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import { RegistrationMapper } from '../../src/mapper/registration-mapper.js';
import type { ImageDTO } from '../../src/model/dto/image-dto.js';
import { EndpointIdentifier } from '../../src/model/endpoint-identifier.js';
import { ImageCategory } from '../../src/model/image-category.js';
import { ImageType } from '../../src/model/image-type.js';
import { InterfaceRole } from '../../src/model/interface-role.js';
import { ModuleId } from '../../src/model/module-id.js';
import { Role } from '../../src/model/role.js';
import { VersionNumber } from '../../src/model/version-number.js';

const URL = 'https://cpo.example.com/ocpi/emsp/2.2.1/cdrs';

function aLogo(): Image {
  return {
    url: 'https://cpo.example.com/logo.png',
    type: 'png',
    category: 'OPERATOR',
    width: 512,
    height: 256,
  };
}

function aBusinessDetails(): BusinessDetails {
  return {
    name: 'Example CPO',
    website: 'https://cpo.example.com',
    logo: aLogo(),
  };
}

function aCredentialRole(role: CredentialRole['role'] = 'CPO'): CredentialRole {
  return { role, businessDetails: aBusinessDetails() };
}

function aTenantPartner(): TenantPartnerDto {
  return {
    countryCode: 'DE',
    partyId: 'MSP',
    partnerProfileOCPI: {
      version: { version: '2.2.1' },
      serverCredentials: {
        token: 'partner-token-123',
        versionsUrl: 'https://cpo.example.com/ocpi/versions',
      },
    },
    tenant: {
      countryCode: 'DE',
      partyId: 'CPO',
      serverProfileOCPI: { credentialsRole: aCredentialRole() },
    },
  } as unknown as TenantPartnerDto;
}

describe('RegistrationMapper.tenantPartnerToCredentialsDto', () => {
  it('takes token/url from the partner server credentials and the single role from the tenant', () => {
    const result = RegistrationMapper.tenantPartnerToCredentialsDto(aTenantPartner());
    expect(result.token).toBe('partner-token-123');
    expect(result.url).toBe('https://cpo.example.com/ocpi/versions');
    expect(result.roles).toHaveLength(1);
    expect(result.roles[0]).toEqual({
      country_code: 'DE',
      party_id: 'CPO',
      role: Role.CPO,
      business_details: {
        name: 'Example CPO',
        website: 'https://cpo.example.com',
        logo: {
          url: 'https://cpo.example.com/logo.png',
          type: ImageType.png,
          category: ImageCategory.OPERATOR,
          width: 512,
          height: 256,
        },
      },
    });
  });
});

describe('RegistrationMapper.toCredentialsRoleDto', () => {
  it('maps an EMSP graphql role to the snake_case DTO', () => {
    const result = RegistrationMapper.toCredentialsRoleDto('NL', 'EMS', aCredentialRole('EMSP'));
    expect(result.country_code).toBe('NL');
    expect(result.party_id).toBe('EMS');
    expect(result.role).toBe(Role.EMSP);
    expect(result.business_details.name).toBe('Example CPO');
  });

  it('leaves website and logo undefined when the business details only carry a name', () => {
    const result = RegistrationMapper.toCredentialsRoleDto('DE', 'CPO', {
      role: 'CPO',
      businessDetails: { name: 'Bare CPO' },
    });
    expect(result.business_details).toEqual({
      name: 'Bare CPO',
      website: undefined,
      logo: undefined,
    });
  });
});

describe('RegistrationMapper.toCredentialsRole', () => {
  it('maps the DTO back to the graphql shape', () => {
    const result = RegistrationMapper.toCredentialsRole({
      role: Role.EMSP,
      party_id: 'EMS',
      country_code: 'NL',
      business_details: {
        name: 'Example MSP',
        website: 'https://msp.example.com',
        logo: {
          url: 'https://msp.example.com/logo.svg',
          type: ImageType.svg,
          category: ImageCategory.OTHER,
          width: 100,
          height: 100,
        },
      },
    });
    expect(result.role).toBe('EMSP');
    expect(result.businessDetails.name).toBe('Example MSP');
    expect(result.businessDetails.logo).toEqual({
      url: 'https://msp.example.com/logo.svg',
      type: 'svg',
      category: 'OTHER',
      width: 100,
      height: 100,
    });
  });
});

describe('RegistrationMapper business details mapping', () => {
  it('omits the logo when the graphql side has none', () => {
    const result = RegistrationMapper.toBusinessDetails({ name: 'No Logo Op' });
    expect(result.name).toBe('No Logo Op');
    expect(result.website).toBeUndefined();
    expect(result.logo).toBeUndefined();
  });

  it('maps a populated logo to a typed ImageDTO', () => {
    const result = RegistrationMapper.toBusinessDetails(aBusinessDetails());
    expect(result.logo?.type).toBe(ImageType.png);
    expect(result.logo?.category).toBe(ImageCategory.OPERATOR);
    expect(result.logo?.width).toBe(512);
  });

  it('normalizes null website and logo from the DTO to undefined', () => {
    const result = RegistrationMapper.toRegistrationBusinessDetails({
      name: 'Nulled Op',
      website: null,
      logo: null,
    });
    expect(result).toEqual({ name: 'Nulled Op', website: undefined, logo: undefined });
  });

  it('keeps website and logo coming from a fully populated DTO', () => {
    const result = RegistrationMapper.toRegistrationBusinessDetails({
      name: 'Full Op',
      website: 'https://full.example.com',
      logo: {
        url: 'https://full.example.com/logo.jpg',
        type: ImageType.jpg,
        category: ImageCategory.NETWORK,
      },
    });
    expect(result.website).toBe('https://full.example.com');
    expect(result.logo?.url).toBe('https://full.example.com/logo.jpg');
  });
});

describe('RegistrationMapper image mapping', () => {
  it('maps a graphql image to enum-typed DTO fields', () => {
    const result = RegistrationMapper.toImage(aLogo());
    expect(result).toEqual({
      url: 'https://cpo.example.com/logo.png',
      type: ImageType.png,
      category: ImageCategory.OPERATOR,
      width: 512,
      height: 256,
    });
  });

  it('rejects an image type outside the OCPI set', () => {
    expect(() => RegistrationMapper.toImage({ ...aLogo(), type: 'gif' })).toThrow(
      'Unknown image type gif',
    );
  });

  it('rejects an image category outside the OCPI set', () => {
    expect(() => RegistrationMapper.toImage({ ...aLogo(), category: 'BANNER' })).toThrow(
      'Unknown image category BANNER',
    );
  });

  it('normalizes null width/height from the DTO to undefined', () => {
    const dto: ImageDTO = {
      url: 'https://cpo.example.com/logo.jpeg',
      type: ImageType.jpeg,
      category: ImageCategory.CHARGER,
      width: null,
      height: null,
    };
    const result = RegistrationMapper.toRegistrationImage(dto);
    expect(result).toEqual({
      url: 'https://cpo.example.com/logo.jpeg',
      type: 'jpeg',
      category: 'CHARGER',
      width: undefined,
      height: undefined,
    });
  });
});

describe('RegistrationMapper role mapping', () => {
  const pairs: Array<['CPO' | 'EMSP' | 'HUB' | 'NAP' | 'NSP' | 'SCSP', Role]> = [
    ['CPO', Role.CPO],
    ['EMSP', Role.EMSP],
    ['HUB', Role.HUB],
    ['NAP', Role.NAP],
    ['NSP', Role.NSP],
    ['SCSP', Role.SCSP],
  ];

  it('round-trips all six graphql role strings', () => {
    for (const [str, role] of pairs) {
      expect(RegistrationMapper.toRole(str)).toBe(role);
      expect(RegistrationMapper.toRoleString(role)).toBe(str);
    }
  });

  it('rejects Role.OTHER, which has no graphql counterpart', () => {
    expect(() => RegistrationMapper.toRoleString(Role.OTHER)).toThrow('Unknown Role OTHER');
  });
});

describe('RegistrationMapper image enum parsing', () => {
  it('parses the four image types', () => {
    expect(RegistrationMapper.toImageType('jpeg')).toBe(ImageType.jpeg);
    expect(RegistrationMapper.toImageType('jpg')).toBe(ImageType.jpg);
    expect(RegistrationMapper.toImageType('png')).toBe(ImageType.png);
    expect(RegistrationMapper.toImageType('svg')).toBe(ImageType.svg);
  });

  it('rejects an unknown image type string', () => {
    expect(() => RegistrationMapper.toImageType('webp')).toThrow('Unknown image type webp');
  });

  it('parses all seven image categories', () => {
    for (const category of Object.values(ImageCategory)) {
      expect(RegistrationMapper.toImageCategory(category)).toBe(category);
    }
  });

  it('rejects an unknown image category string', () => {
    expect(() => RegistrationMapper.toImageCategory('SIGNAGE')).toThrow(
      'Unknown image category SIGNAGE',
    );
  });
});

describe('RegistrationMapper version mapping', () => {
  it('maps 2.2.1 in both directions', () => {
    expect(RegistrationMapper.toVersionNumber('2.2.1')).toBe(VersionNumber.TWO_DOT_TWO_DOT_ONE);
    expect(RegistrationMapper.toOCPIVersionNumber(VersionNumber.TWO_DOT_TWO_DOT_ONE)).toBe('2.2.1');
  });

  it('rejects any other OCPI version', () => {
    expect(() => RegistrationMapper.toVersionNumber('2.2' as OCPIVersionNumberEnumType)).toThrow(
      'Unsupported OCPI version 2.2',
    );
  });

  it('rejects any other VersionNumber', () => {
    expect(() => RegistrationMapper.toOCPIVersionNumber(VersionNumber.TWO_DOT_TWO)).toThrow(
      'Unsupported version 2.2',
    );
  });
});

describe('RegistrationMapper endpoint mapping', () => {
  const wirePairs: Array<[ModuleId, InterfaceRole, EndpointIdentifier]> = [
    [ModuleId.Cdrs, InterfaceRole.SENDER, EndpointIdentifier.CDRS_SENDER],
    [ModuleId.Cdrs, InterfaceRole.RECEIVER, EndpointIdentifier.CDRS_RECEIVER],
    [ModuleId.Locations, InterfaceRole.SENDER, EndpointIdentifier.LOCATIONS_SENDER],
    [ModuleId.Locations, InterfaceRole.RECEIVER, EndpointIdentifier.LOCATIONS_RECEIVER],
    [ModuleId.Sessions, InterfaceRole.SENDER, EndpointIdentifier.SESSIONS_SENDER],
    [ModuleId.Sessions, InterfaceRole.RECEIVER, EndpointIdentifier.SESSIONS_RECEIVER],
    [ModuleId.Tariffs, InterfaceRole.SENDER, EndpointIdentifier.TARIFFS_SENDER],
    [ModuleId.Tariffs, InterfaceRole.RECEIVER, EndpointIdentifier.TARIFFS_RECEIVER],
    [ModuleId.Tokens, InterfaceRole.SENDER, EndpointIdentifier.TOKENS_SENDER],
    [ModuleId.Tokens, InterfaceRole.RECEIVER, EndpointIdentifier.TOKENS_RECEIVER],
    [ModuleId.Commands, InterfaceRole.SENDER, EndpointIdentifier.COMMANDS_SENDER],
    [ModuleId.Commands, InterfaceRole.RECEIVER, EndpointIdentifier.COMMANDS_RECEIVER],
    [ModuleId.ChargingProfiles, InterfaceRole.SENDER, EndpointIdentifier.CHARGING_PROFILES_SENDER],
    [
      ModuleId.ChargingProfiles,
      InterfaceRole.RECEIVER,
      EndpointIdentifier.CHARGING_PROFILES_RECEIVER,
    ],
  ];

  it('serializes the identifier as module_ROLE', () => {
    const result = RegistrationMapper.toEndpoint({
      identifier: ModuleId.Cdrs,
      role: InterfaceRole.SENDER,
      url: URL,
    });
    expect(result.identifier).toBe('cdrs_SENDER');
    expect(result.url).toBe(URL);
  });

  it('round-trips every module/role pair through toEndpoint and toModuleAndRole', () => {
    for (const [identifier, role, wire] of wirePairs) {
      const endpoint = RegistrationMapper.toEndpoint({ identifier, role, url: URL });
      expect(endpoint.identifier).toBe(wire);
      expect(RegistrationMapper.toModuleAndRole(endpoint)).toEqual({ identifier, role });
    }
  });

  it('maps credentials without a role suffix regardless of interface role', () => {
    for (const role of [InterfaceRole.SENDER, InterfaceRole.RECEIVER]) {
      expect(
        RegistrationMapper.toEndpointIdentifier({
          identifier: ModuleId.Credentials,
          role,
          url: URL,
        }),
      ).toBe(EndpointIdentifier.CREDENTIALS);
    }
  });

  // credentials has no role on the wire, so the reverse mapping picks SENDER
  it('maps the credentials identifier back to a SENDER module', () => {
    const result = RegistrationMapper.toModuleAndRole({
      identifier: EndpointIdentifier.CREDENTIALS,
      url: URL,
    });
    expect(result).toEqual({ identifier: ModuleId.Credentials, role: InterfaceRole.SENDER });
  });

  it('rejects a module with no OCPI endpoint identifier', () => {
    expect(() =>
      RegistrationMapper.toEndpointIdentifier({
        identifier: ModuleId.Hubclientinfo,
        role: InterfaceRole.SENDER,
        url: URL,
      }),
    ).toThrow('Unknown module identifier: hubclientinfo');
  });

  it('rejects a known module with an unknown role', () => {
    expect(() =>
      RegistrationMapper.toEndpointIdentifier({
        identifier: ModuleId.Cdrs,
        role: 'OBSERVER' as InterfaceRole,
        url: URL,
      }),
    ).toThrow('Unknown role for module cdrs: OBSERVER');
  });

  it('rejects an unknown endpoint identifier on the way back', () => {
    const endpoint: BaseEndpoint = { identifier: 'hubclientinfo', url: URL };
    expect(() => RegistrationMapper.toModuleAndRole(endpoint)).toThrow(
      'Unknown endpoint identifier: hubclientinfo',
    );
  });
});

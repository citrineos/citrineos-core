// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/base';
import type {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import { VariableAttribute } from '@citrineos/data';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { calculateCheckDigit } from './emaidCheckDigitCalculator.js';
import { getNumberOfFractionDigit } from './parser.js';

/**
 * Validate a language tag is an RFC-5646 tag, see: {@link https://tools.ietf.org/html/rfc5646},
 * example: US English is: "en-US"
 *
 * @param languageTag
 * @returns {boolean} true if the languageTag is an RFC-5646 tag
 */
export function validateLanguageTag(languageTag: string): boolean {
  if (!languageTag.trim()) {
    console.log('Empty language tag');
    return false;
  }
  return /^((?:(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?:([A-Za-z]{2,3}(-(?:[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?)|[A-Za-z]{4}|[A-Za-z]{5,8})(-(?:[A-Za-z]{4}))?(-(?:[A-Za-z]{2}|[0-9]{3}))?(-(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*(-(?:[0-9A-WY-Za-wy-z](-[A-Za-z0-9]{2,8})+))*(-(?:x(-[A-Za-z0-9]{1,8})+))?)|(?:x(-[A-Za-z0-9]{1,8})+))$/.test(
    languageTag,
  );
}

/**
 * Validate constraints of ChargingProfileType defined in OCPP 2.0.1
 *
 * @param chargingProfileType ChargingProfileType from the request
 * @param tenantId tenant id the profile belongs to
 * @param stationId station id
 * @param deviceModelRepository deviceModelRepository
 * @param chargingProfileRepository chargingProfileRepository
 * @param transactionEventRepository transactionEventRepository
 * @param logger logger
 * @param evseId evse id
 */
export async function validateChargingProfileType(
  chargingProfileType: OCPP2_0_1.ChargingProfileType,
  tenantId: number,
  stationId: string,
  deviceModelRepository: IDeviceModelRepository,
  chargingProfileRepository: IChargingProfileRepository,
  transactionEventRepository: ITransactionEventRepository,
  logger: Logger<ILogObj>,
  evseId?: number | null,
): Promise<void> {
  if (chargingProfileType.stackLevel < 0) {
    throw new Error('Lowest Stack level is 0');
  }

  if (
    chargingProfileType.chargingProfilePurpose ===
      OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationMaxProfile &&
    evseId !== 0
  ) {
    throw new Error('When chargingProfilePurpose is ChargingStationMaxProfile, evseId SHALL be 0');
  }

  if (
    chargingProfileType.chargingProfilePurpose !==
      OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile &&
    chargingProfileType.transactionId
  ) {
    throw new Error(
      'transactionId SHALL only be included when ChargingProfilePurpose is set to TxProfile.',
    );
  }

  let receivedChargingNeeds;
  if (chargingProfileType.transactionId && evseId) {
    const transaction = await transactionEventRepository.readTransactionByStationIdAndTransactionId(
      tenantId,
      stationId,
      chargingProfileType.transactionId,
    );
    if (!transaction) {
      throw new Error(
        `Transaction ${chargingProfileType.transactionId} not found on station ${stationId}.`,
      );
    }
    const evse = await deviceModelRepository.findEvseByIdAndConnectorId(tenantId, evseId, null);
    if (!evse) {
      throw new Error(`Evse ${evseId} not found.`);
    }
    logger.info(`Found evse: ${JSON.stringify(evse)}`);
    receivedChargingNeeds =
      await chargingProfileRepository.findChargingNeedsByEvseDBIdAndTransactionDBId(
        tenantId,
        evse.databaseId,
        transaction.id,
      );
    logger.info(`Found ChargingNeeds: ${JSON.stringify(receivedChargingNeeds)}`);
  }

  const periodsPerSchedules: VariableAttribute[] = await deviceModelRepository.readAllByQuerystring(
    tenantId,
    {
      tenantId: tenantId,
      stationId: stationId,
      component_name: 'SmartChargingCtrlr',
      variable_name: 'PeriodsPerSchedule',
      type: OCPP2_0_1.AttributeEnumType.Actual,
    },
  );
  logger.info(`Found PeriodsPerSchedule: ${JSON.stringify(periodsPerSchedules)}`);
  let periodsPerSchedule;
  if (periodsPerSchedules.length > 0 && periodsPerSchedules[0].value) {
    periodsPerSchedule = Number(periodsPerSchedules[0].value);
  }
  for (const chargingSchedule of chargingProfileType.chargingSchedule) {
    if (
      chargingSchedule.minChargingRate &&
      getNumberOfFractionDigit(chargingSchedule.minChargingRate) > 1
    ) {
      throw new Error(
        `chargingSchedule ${chargingSchedule.id}: minChargingRate accepts at most one digit fraction (e.g. 8.1).`,
      );
    }
    if (periodsPerSchedule && chargingSchedule.chargingSchedulePeriod.length > periodsPerSchedule) {
      throw new Error(
        `ChargingSchedule ${chargingSchedule.id}: The number of chargingSchedulePeriod SHALL not exceed ${periodsPerSchedule}.`,
      );
    }

    for (const chargingSchedulePeriod of chargingSchedule.chargingSchedulePeriod) {
      if (getNumberOfFractionDigit(chargingSchedulePeriod.limit) > 1) {
        throw new Error(
          `ChargingSchedule ${chargingSchedule.id}: chargingSchedulePeriod limit accepts at most one digit fraction (e.g. 8.1).`,
        );
      }

      if (receivedChargingNeeds) {
        if (receivedChargingNeeds.acChargingParameters) {
          // EV AC charging
          if (!chargingSchedulePeriod.numberPhases) {
            chargingSchedulePeriod.numberPhases = 3;
          }
        } else if (receivedChargingNeeds.dcChargingParameters) {
          // EV DC charging
          chargingSchedulePeriod.numberPhases = undefined;
        }
      }
    }

    if (chargingSchedule.salesTariff) {
      if (
        receivedChargingNeeds &&
        receivedChargingNeeds.maxScheduleTuples &&
        chargingSchedule.salesTariff.salesTariffEntry.length >
          receivedChargingNeeds.maxScheduleTuples
      ) {
        throw new Error(
          `ChargingSchedule ${chargingSchedule.id}: The number of SalesTariffEntry elements (${chargingSchedule.salesTariff.salesTariffEntry.length}) SHALL not exceed maxScheduleTuples (${receivedChargingNeeds.maxScheduleTuples}).`,
        );
      }

      for (const salesTariffEntry of chargingSchedule.salesTariff.salesTariffEntry) {
        if (salesTariffEntry.consumptionCost) {
          for (const consumptionCost of salesTariffEntry.consumptionCost) {
            if (consumptionCost.cost) {
              for (const cost of consumptionCost.cost) {
                if (
                  cost.amountMultiplier &&
                  (cost.amountMultiplier > 3 || cost.amountMultiplier < -3)
                ) {
                  throw new Error(
                    `ChargingSchedule ${chargingSchedule.id}: amountMultiplier SHALL be in [-3, 3].`,
                  );
                }
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Validate ISO15693 ID token format
 * ISO 15693 UID should be exactly 8 bytes (16 hex characters)
 */
export function validateISO15693IdToken(idToken: string): boolean {
  return !!idToken && idToken.length === 16 && /^[0-9A-Fa-f]+$/.test(idToken);
}

/**
 * Validate ISO14443 ID token format
 * ISO 14443 UID should be 4 or 7 bytes (8 or 14 hex characters)
 */
export function validateISO14443IdToken(idToken: string): boolean {
  return (
    !!idToken && (idToken.length === 8 || idToken.length === 14) && /^[0-9A-Fa-f]+$/.test(idToken)
  );
}

/**
 * Validate identifier string format per OCPP 2.0.1. We expect this validation already from the JSON schema,
 * but we add this extra validation to be sure.
 * Only allows: a-z, A-Z, 0-9, *, -, _, =, :, +, |, @, .
 */
export function validateIdentifierStringIdToken(idToken: string): boolean {
  return !!idToken && /^[a-zA-Z0-9*\-_=:+|@.]+$/.test(idToken);
}

/**
 * Validates an eMAID string according to eMI³ specifications
 * @param emaid - The eMAID string to validate
 * @returns errors - String array with errors, empty if valid
 */
export function validateEMAIDIdToken(emaid: string): string[] {
  const errors: string[] = [];

  // Remove optional separators and convert to uppercase
  const separator = '-';
  let cleanedEmaid = emaid.replace(new RegExp(separator, 'g'), '').toUpperCase();

  // For backwards compatibility with DIN SPEC 91286 and eMAIDs without ID type at position 6
  if (cleanedEmaid.length === 13) {
    // Insert id type 'C'
    cleanedEmaid = cleanedEmaid.substring(0, 5) + 'C' + cleanedEmaid.substring(5);
  } else if (cleanedEmaid.length === 14 && cleanedEmaid.substring(5, 6) !== 'C') {
    // Insert id type 'C' and prune check digit
    cleanedEmaid = cleanedEmaid.substring(0, 5) + 'C' + cleanedEmaid.substring(5, 13);
  }

  // Check overall length (14 or 15 characters without separators)
  if (cleanedEmaid.length < 14 || cleanedEmaid.length > 15) {
    errors.push(`Invalid length: ${cleanedEmaid.length} characters (expected 14 or 15)`);
    return errors;
  }

  // Validate character set (alphanumeric only)
  if (!/^[A-Z0-9]+$/.test(cleanedEmaid)) {
    errors.push(
      'eMAID must contain only alphanumeric characters (and optional hyphens as separators)',
    );
    return errors;
  }

  // Parse components
  const countryCode = cleanedEmaid.substring(0, 2);
  const providerId = cleanedEmaid.substring(2, 5);
  const idType = cleanedEmaid.substring(5, 6);
  const instance = cleanedEmaid.substring(6, 14);
  const checkDigit = cleanedEmaid.length === 15 ? cleanedEmaid.substring(14, 15) : undefined;

  // Validate Country Code (2 letters)
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    errors.push('Country code must be exactly 2 letters');
  }

  // Validate Provider ID (3 alphanumeric)
  if (!/^[A-Z0-9]{3}$/.test(providerId)) {
    errors.push('Provider ID must be exactly 3 alphanumeric characters');
  }

  // Validate ID Type (must be 'C' for Contract)
  if (idType !== 'C') {
    errors.push(`ID Type must be 'C' for Contract (found: '${idType}')`);
  }

  // Validate Instance (8 alphanumeric)
  if (!/^[A-Z0-9]{8}$/.test(instance)) {
    errors.push('Instance must be exactly 8 alphanumeric characters');
  }

  // If check digit is present, validate it
  if (checkDigit !== undefined) {
    try {
      const calculatedCheckDigit = calculateCheckDigit(cleanedEmaid.substring(0, 14));

      if (checkDigit !== calculatedCheckDigit) {
        errors.push(
          `Invalid check digit: expected '${calculatedCheckDigit}', found '${checkDigit}'`,
        );
      }
    } catch (error) {
      errors.push(
        `Check digit calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  return errors;
}

/**
 * Validate NoAuthorization ID token (should be empty)
 */
export function validateNoAuthorizationIdToken(idToken: string): boolean {
  return !idToken || idToken.length === 0;
}

/**
 * Generic validation result for all validators
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * ID token validator - routes to appropriate validator based on type
 * Returns validation result with detailed error message if invalid
 */
export function validateIdToken(
  idTokenType: OCPP2_0_1.IdTokenEnumType,
  idToken: string,
): ValidationResult {
  switch (idTokenType) {
    case OCPP2_0_1.IdTokenEnumType.ISO15693:
      if (validateISO15693IdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'ISO15693 tokens must be exactly 16 hexadecimal characters (0-9, A-F)',
      };

    case OCPP2_0_1.IdTokenEnumType.ISO14443:
      if (validateISO14443IdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'ISO14443 tokens must be either 8 or 14 hexadecimal characters (0-9, A-F)',
      };

    case OCPP2_0_1.IdTokenEnumType.NoAuthorization:
      if (validateNoAuthorizationIdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'NoAuthorization tokens must be empty',
      };

    case OCPP2_0_1.IdTokenEnumType.KeyCode:
      if (validateIdentifierStringIdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'KeyCode tokens must contain only letters, numbers, and characters: * - _ = : + | @ .',
      };

    case OCPP2_0_1.IdTokenEnumType.Local:
      if (validateIdentifierStringIdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'Local tokens must contain only letters, numbers, and characters: * - _ = : + | @ .',
      };

    case OCPP2_0_1.IdTokenEnumType.MacAddress:
      if (validateIdentifierStringIdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'MacAddress tokens must contain only letters, numbers, and characters: * - _ = : + | @ .',
      };

    case OCPP2_0_1.IdTokenEnumType.Central:
      if (validateIdentifierStringIdToken(idToken)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'Central tokens must contain only letters, numbers, and characters: * - _ = : + | @ .',
      };

    case OCPP2_0_1.IdTokenEnumType.eMAID: {
      const errors = validateEMAIDIdToken(idToken);
      if (errors.length === 0) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'eMAID tokens must follow the eMI3 format: ' + errors.join(', '),
      };
    }
    default:
      return {
        isValid: true, // IdTokenType is already validated by JSON schema, so types not listed here are considered valid
      };
  }
}

/**
 * Validate ASCII content - only printable ASCII allowed (characters 32-126)
 * @param content Content string to validate
 * @returns {boolean} true if content contains only printable ASCII characters
 */
export function validateASCIIContent(content: string): boolean {
  if (!content) return true; // Empty content is valid
  // Printable ASCII: space (32) through tilde (126)
  return /^[\x20-\x7E]*$/.test(content);
}

/**
 * Validate HTML content - checks for basic HTML structure validity
 * @param content Content string to validate
 * @returns {boolean} true if content appears to be valid HTML
 */
export function validateHTMLContent(content: string): boolean {
  if (!content) return true; // Empty content is valid

  // Basic HTML validation: check for properly matched tags
  // This is a simplified check - real HTML validation would require a full parser
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const tags: string[] = [];
  let hasTags = false;
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    hasTags = true;

    // Skip self-closing tags and void elements
    const voidElements = [
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ];
    if (tag.endsWith('/>') || voidElements.includes(tagName)) {
      continue;
    }

    if (tag.startsWith('</')) {
      // Closing tag
      if (tags.length === 0 || tags[tags.length - 1] !== tagName) {
        return false; // Mismatched closing tag
      }
      tags.pop();
    } else {
      // Opening tag
      tags.push(tagName);
    }
  }

  if (!hasTags) return false; // No HTML tags found
  // All tags should be closed
  return tags.length === 0;
}

/**
 * Validate URI content - checks if content is a valid URI
 * @param content Content string to validate
 * @returns {boolean} true if content is a valid URI
 */
export function validateURIContent(content: string): boolean {
  if (!content) return false; // Empty URI is not valid

  try {
    // Try to parse as URL - will throw if invalid
    new URL(content);
    return true;
  } catch {
    // If absolute URL parsing fails, check if it's a valid relative URI
    // A relative URI should at least not contain invalid characters
    // and should follow basic URI syntax
    const uriPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:|^\/|^[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]+$/;
    return uriPattern.test(content);
  }
}

/**
 * Validate UTF-8 content - in JavaScript, strings are already UTF-16 encoded
 * This function checks for invalid surrogate pairs and control characters
 * @param content Content string to validate
 * @returns {boolean} true if content is valid UTF-8
 */
export function validateUTF8Content(content: string): boolean {
  if (!content) return true; // Empty content is valid

  // Check for unpaired surrogate characters which indicate invalid UTF-16/UTF-8
  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);

    // Check for high surrogate without low surrogate
    if (charCode >= 0xd800 && charCode <= 0xdbff) {
      if (i + 1 >= content.length) {
        return false; // High surrogate at end of string
      }
      const nextCharCode = content.charCodeAt(i + 1);
      if (nextCharCode < 0xdc00 || nextCharCode > 0xdfff) {
        return false; // High surrogate not followed by low surrogate
      }
      i++; // Skip the low surrogate
    }
    // Check for low surrogate without high surrogate
    else if (charCode >= 0xdc00 && charCode <= 0xdfff) {
      return false; // Low surrogate without preceding high surrogate
    }
  }

  return true;
}

/**
 * Message content validator - routes to appropriate validator based on format
 * Returns validation result with detailed error message if invalid
 * @param format Message format type (ASCII, HTML, URI, UTF8)
 * @param content Message content to validate
 * @returns {ValidationResult} Validation result with error message if invalid
 */
export function validateMessageContent(
  format: OCPP2_0_1.MessageFormatEnumType,
  content: string,
): ValidationResult {
  switch (format) {
    case OCPP2_0_1.MessageFormatEnumType.ASCII:
      if (validateASCIIContent(content)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'ASCII format requires content to contain only printable ASCII characters (space through tilde)',
      };

    case OCPP2_0_1.MessageFormatEnumType.HTML:
      if (validateHTMLContent(content)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'HTML format requires properly matched opening and closing tags',
      };

    case OCPP2_0_1.MessageFormatEnumType.URI:
      if (validateURIContent(content)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage: 'URI format requires a valid URI that the Charging Station can download',
      };

    case OCPP2_0_1.MessageFormatEnumType.UTF8:
      if (validateUTF8Content(content)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        errorMessage:
          'UTF8 format requires valid UTF-8 encoded content without unpaired surrogate characters',
      };

    default:
      return {
        isValid: false,
        errorMessage: `Unknown message format: ${format}`,
      };
  }
}

/**
 * Validate a complete MessageContentType object
 * Convenience function that validates both language tag (if present) and content against format
 * @param messageContent MessageContentType object to validate
 * @returns {ValidationResult} Validation result with error message if invalid
 */
export function validateMessageContentType(
  messageContent: OCPP2_0_1.MessageContentType,
): ValidationResult {
  // Validate language tag if present
  if (messageContent.language != null && !validateLanguageTag(messageContent.language)) {
    return {
      isValid: false,
      errorMessage: `Invalid language tag: ${messageContent.language}. Must be an RFC-5646 language tag (e.g., "en-US")`,
    };
  }

  // Validate content against format
  return validateMessageContent(messageContent.format, messageContent.content);
}

/**
 * Validate PEM-encoded Certificate Signing Request (CSR)
 * According to RFC 2986, CSR must be PEM-encoded with proper headers and valid base64 content
 * @param csr CSR string to validate
 * @returns {ValidationResult} Validation result with error message if invalid
 */
export function validatePEMEncodedCSR(csr: string): ValidationResult {
  if (!csr || !csr.trim()) {
    return {
      isValid: false,
      errorMessage: 'CSR cannot be empty',
    };
  }

  const trimmedCSR = csr.trim();

  // Check for PEM headers
  const beginHeader = '-----BEGIN CERTIFICATE REQUEST-----';
  const endHeader = '-----END CERTIFICATE REQUEST-----';

  if (!trimmedCSR.includes(beginHeader)) {
    return {
      isValid: false,
      errorMessage: 'CSR must contain BEGIN CERTIFICATE REQUEST header',
    };
  }

  if (!trimmedCSR.includes(endHeader)) {
    return {
      isValid: false,
      errorMessage: 'CSR must contain END CERTIFICATE REQUEST header',
    };
  }

  // Extract content between headers
  const beginIndex = trimmedCSR.indexOf(beginHeader) + beginHeader.length;
  const endIndex = trimmedCSR.indexOf(endHeader);

  if (beginIndex >= endIndex) {
    return {
      isValid: false,
      errorMessage: 'CSR headers are in wrong order',
    };
  }

  const content = trimmedCSR.substring(beginIndex, endIndex).trim();

  // Check that there's actual content
  if (content.replace(/\s/g, '').length === 0) {
    return {
      isValid: false,
      errorMessage: 'CSR content is empty',
    };
  }

  // Validate base64 content (allows A-Z, a-z, 0-9, +, /, =, and whitespace)
  const base64Pattern = /^[A-Za-z0-9+/=\s]+$/;
  if (!base64Pattern.test(content)) {
    return {
      isValid: false,
      errorMessage: 'CSR content contains invalid characters for base64 encoding',
    };
  }

  return { isValid: true };
}

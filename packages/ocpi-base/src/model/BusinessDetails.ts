// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import type { BusinessDetailsDTO } from './DTO/BusinessDetailsDTO.js';
import { fromImageDTO, ImageSchema, toImageDTO } from './Image.js';

export const BusinessDetailsSchema = z.object({
  name: z.string().max(100),
  website: z.string().url().nullable().optional(),
  logo: ImageSchema.nullable().optional(),
});

export type BusinessDetails = z.infer<typeof BusinessDetailsSchema>;

export const toBusinessDetailsDTO = (businessDetails: BusinessDetails) => {
  return {
    name: businessDetails.name,
    website: businessDetails.website,
    logo: businessDetails.logo ? toImageDTO(businessDetails.logo) : undefined,
  };
};

export const fromBusinessDetailsDTO = (businessDetailsDTO: BusinessDetailsDTO): BusinessDetails => {
  const record: any = {
    name: businessDetailsDTO.name,
    website: businessDetailsDTO.website,
  };
  const businessDetails: BusinessDetails = record;
  if (businessDetailsDTO.logo) {
    businessDetails.logo = fromImageDTO(businessDetailsDTO.logo);
  }
  return businessDetails;
};

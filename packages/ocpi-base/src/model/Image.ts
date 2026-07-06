// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ImageCategory } from './ImageCategory.js';
import type { ImageDTO } from './DTO/ImageDTO.js';
import { ImageType } from './ImageType.js';

import { z } from 'zod';

export const ImageSchema = z.object({
  url: z.string().url(),
  thumbnail: z.string().url().nullable().optional(),
  category: z.nativeEnum(ImageCategory),
  type: z.nativeEnum(ImageType),
  width: z.number().int().max(99999).nullable().optional(),
  height: z.number().int().max(99999).nullable().optional(),
});

export type Image = z.infer<typeof ImageSchema>;

export const toImageDTO = (image: Image) => {
  return {
    url: image.url,
    thumbnail: image.thumbnail,
    category: image.category,
    type: image.type,
    width: image.width,
    height: image.height,
  };
};

export const fromImageDTO = (imageDTO: ImageDTO): Image => {
  return {
    url: imageDTO.url,
    thumbnail: imageDTO.thumbnail,
    category: imageDTO.category,
    type: imageDTO.type,
    width: imageDTO.width,
    height: imageDTO.height,
  };
};

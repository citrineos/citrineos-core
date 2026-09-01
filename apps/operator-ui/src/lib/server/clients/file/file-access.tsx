// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  fetchFileCloudStorage,
  generatePresignedGetUrlIfExistsCloudStorage,
  generatePresignedPutUrlCloudStorage,
} from './cloud-storage';
import { fetchFileS3, generatePresignedGetUrlIfExistsS3, generatePresignedPutUrlS3 } from './s3';
import { isGcp } from '@lib/server/clients/file/is-gcp';

export const generatePresignedPutUrl = isGcp
  ? generatePresignedPutUrlCloudStorage
  : generatePresignedPutUrlS3;

export const generatePresignedGetUrlIfExists = isGcp
  ? generatePresignedGetUrlIfExistsCloudStorage
  : generatePresignedGetUrlIfExistsS3;

export const fetchFile = isGcp ? fetchFileCloudStorage : fetchFileS3;

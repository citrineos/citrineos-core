// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { fetchFile } from '@lib/server/clients/file/file-access';
import config from '@lib/utils/config';
import { BucketType } from '@lib/utils/enums';
import { authedAction, type ActionResult } from '@lib/utils/action-guard';
import { S3_BUCKET_FILE_CONFIG, S3_BUCKET_FILE_CORE_CONFIG } from '@lib/utils/consts';

const ALLOWED_FILE_KEYS: ReadonlySet<string> = new Set([
  `${BucketType.CORE}:${S3_BUCKET_FILE_CORE_CONFIG}`,
  `${'undefined'}:${S3_BUCKET_FILE_CONFIG}`,
]);

export async function fetchFileAction(
  fileKey: string,
  bucketType?: BucketType,
): Promise<ActionResult<any>> {
  return authedAction<any>(async (_session) => {
    if (!fileKey) {
      throw new Error('Missing file key');
    }

    const bucketKey = `${bucketType ?? 'undefined'}:${fileKey}`;
    if (!ALLOWED_FILE_KEYS.has(bucketKey)) {
      throw new Error('File not found');
    }

    const bucket =
      bucketType === BucketType.CORE
        ? config.fileStorageType === 'gcp'
          ? config.gcpCloudStorageCoreBucketName
          : config.awsS3CoreBucketName
        : config.fileStorageType === 'gcp'
          ? config.gcpCloudStorageBucketName
          : config.awsS3BucketName;

    try {
      return await fetchFile(fileKey, bucket);
    } catch (err: any) {
      console.error(`Failed to fetch file`, { fileKey, bucket, err });
      throw new Error('File not found');
    }
  });
}

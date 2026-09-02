// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Storage } from '@google-cloud/storage';
import config from '@lib/utils/config';

const storage = new Storage();
const primaryBucket = config.gcpCloudStorageBucketName;

const ensureBucket = (bucket?: string) => {
  if (!bucket) {
    throw new Error('GCP Cloud Storage bucket name is not configured');
  }
  return bucket;
};

const isNotFound = (err: any) =>
  err?.code === 404 ||
  (typeof err?.message === 'string' &&
    (err.message.includes('No such object') || err.message.includes('Not Found')));

export const generatePresignedPutUrlCloudStorage = async (
  fileName: string,
  contentType: string,
) => {
  console.log(
    'Generating presigned from Cloud Storage PUT URL for filename and content type',
    fileName,
    contentType,
  );
  const bucket = storage.bucket(ensureBucket(primaryBucket));
  const file = bucket.file(fileName);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 10 * 60 * 1000,
    contentType,
  });
  return { url, key: fileName };
};

export const generatePresignedGetUrlIfExistsCloudStorage = async (fileKey: string) => {
  console.log('Generating presigned from Cloud Storage ET URL for file key', fileKey);
  try {
    const bucket = storage.bucket(ensureBucket(primaryBucket));
    const file = bucket.file(fileKey);
    const [exists] = await file.exists();
    console.log('File exists?', exists);
    if (!exists) return null;
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 10 * 60 * 1000,
    });
    return url;
  } catch (err: any) {
    if (isNotFound(err)) {
      console.warn(`File ${fileKey} not found`);
      return null;
    }
    throw err;
  }
};

export const fetchFileCloudStorage = async (fileKey: string, bucket?: string) => {
  console.log('Fetching file from Cloud Storage with key', fileKey);
  const targetBucket = storage.bucket(ensureBucket(bucket || primaryBucket));
  const file = targetBucket.file(fileKey);
  const [contents] = await file.download();
  return JSON.parse(contents.toString('utf-8'));
};

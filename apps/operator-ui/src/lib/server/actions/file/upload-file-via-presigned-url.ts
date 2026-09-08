// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { authedAction, type ActionResult } from '@lib/utils/action-guard';

/*
 * Uploads a file to S3 bucket using a presigned URL
 * @param file - The file to upload
 * @param fileName - The name of the file. If it is undefined, the original file name will be used
 * @returns The key of the uploaded file
 */

import { generatePresignedPutUrl } from '@lib/server/clients/file/file-access';
import config from '@lib/utils/config';

export async function uploadFileViaPresignedUrl(
  file: File,
  fileName?: string,
): Promise<ActionResult<string>> {
  if (!config.allowImageUpload) {
    throw new Error('Image upload is disabled');
  }
  return authedAction<string>(async (_session) => {
    // Get signed URL
    const { url, key } = await generatePresignedPutUrl(fileName || file.name, file.type);

    // Upload file using signed URL
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!uploadRes.ok) {
      throw new Error('Failed to upload file');
    }

    return key;
  });
}

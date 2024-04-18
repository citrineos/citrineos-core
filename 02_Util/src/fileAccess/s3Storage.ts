// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {IFileAccess} from "@citrineos/base";

export class S3Storage implements IFileAccess {
    getFile(id: string): Promise<Buffer> {
        // TODO: implement the logic
        throw new Error("Not yet implemented.")
    }

    uploadFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
        // TODO: implement the logic
        throw new Error("Not yet implemented.")
    }
}
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IFileAccess, SystemConfig } from "@citrineos/base";
import { authentication, RestClient, createDirectus, rest, staticToken, readAssetArrayBuffer } from "@directus/sdk";
import { Logger, ILogObj } from "tslog";
import { Schema } from "../util/directus";

export class DirectusFiles implements IFileAccess {
    private _client: RestClient<Schema>;
    private _config: SystemConfig;
    private _logger: Logger<ILogObj>;

    private readonly _directusUrl: string;

    constructor(config: SystemConfig, logger?: Logger<ILogObj>, client?: RestClient<Schema>) {
        this._config = config;
        this._logger = logger ? logger.getSubLogger({name: this.constructor.name}) : new Logger<ILogObj>({name: this.constructor.name});

        this._directusUrl = `http://${this._config.util.directus?.host}:${this._config.util.directus?.port}`;

        if (client) {
            this._client = client;
        } else {
            let client;
            if (this._config.util.directus?.token) { // Auth with static token
                client = createDirectus(this._directusUrl).with(staticToken(this._config.util.directus?.token)).with(rest());
            } else if (this._config.util.directus?.username && this._config.util.directus?.password) { // Auth with username and password
                client = createDirectus<Schema>(this._directusUrl).with(authentication()).with(rest());
                this._logger.info(`Logging into Directus as ${this._config.util.directus.username}`);
                client.login(this._config.util.directus.username, this._config.util.directus.password);
            } else { // No auth
                client = createDirectus<Schema>(this._directusUrl).with(rest());
            }
            this._client = client;
        }
    }

    async getFile(id: string): Promise<Buffer> {
        this._logger.info(`Get file ${id}`);
        try {
            const result = await this._client.request(readAssetArrayBuffer(id));
            return Buffer.from(result);
        } catch (error) {
            this._logger.error('Get file failed: ', error);
            throw new Error(`Get file ${id} failed`)
        }
    }

    async uploadFile(filePath: string, content: Buffer): Promise<string> {
        throw new Error("Not yet implemented.")
    }
}
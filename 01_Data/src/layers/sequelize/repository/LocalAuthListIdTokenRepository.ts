import {Sequelize} from "sequelize-typescript";
import {ILogObj, Logger} from "tslog";
import {SystemConfig} from "@citrineos/base";
import {SequelizeRepository} from "./Base";
import {IdTokenVersion} from "../model/LocalAuthList";
import {IdToken} from "../model/Authorization";

export class LocalAuthListIdTokenRepository extends SequelizeRepository<IdTokenVersion> {
    private _logger?: Logger<ILogObj>;

    constructor(config: SystemConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
        super(config, IdTokenVersion.MODEL_NAME, logger, sequelizeInstance);
    }

    public async getAll(versionDatabaseId: string): Promise<IdTokenVersion[]> {
        return await IdTokenVersion.findAll({
            where: {
                versionDatabaseId: versionDatabaseId
            }
        })
    }

    /**
     * Updates or inserts an ID token for the given station.
     * @param stationId - The ID of the station.
     * @param idTokenDatabaseId - The ID of the ID token in the database.
     * @returns A promise that resolves when the operation is complete.
     */
    public async createOrUpdate(stationId: string, idTokenDatabaseId: number): Promise<void> {
        try {
            await IdTokenVersion.upsert({
                stationId: stationId,
                idTokenDatabaseId: idTokenDatabaseId,
            });
        } catch (error) {
            // Handle or log the error as appropriate
            this._logger?.error('Failed to update or insert ID token', error);
            throw error;
        }
    }

    public async deleteAll(stationId: string): Promise<void> {
        await IdTokenVersion.destroy({
            where: {
                stationId: stationId
            }
        });
    }
}

import {Sequelize} from "sequelize-typescript";
import {ILogObj, Logger} from "tslog";
import {SystemConfig} from "@citrineos/base";
import {SequelizeRepository} from "./Base";
import {LocalAuthListVersion} from "../model/LocalAuthList";

export class LocalAuthListVersionRepository extends SequelizeRepository<LocalAuthListVersion> {
    constructor(config: SystemConfig, readonly _logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
        super(config, LocalAuthListVersion.MODEL_NAME, _logger, sequelizeInstance);
    }

    public async getVersion(stationId: string): Promise<LocalAuthListVersion | null> {
        return await LocalAuthListVersion.findOne({
            where: { stationId }
        });
    }

    /**
     * Increments the version number for the given station ID.
     * If no version record is found, creates one with an initial version.
     * @param stationId - The ID of the station.
     * @returns A promise that resolves to the updated version number.
     */
    public async incrementVersion(stationId: string): Promise<number> {
        try {
            // Fetch the current version for the given stationId
            let currentVersionRecord = await LocalAuthListVersion.findOne({
                where: { stationId }
            });

            if (currentVersionRecord) {
                const newVersion = currentVersionRecord.version + 1;

                // Update the version in the database
                await LocalAuthListVersion.update(
                    { version: newVersion },
                    { where: { stationId } }
                );

                return newVersion;
            } else {
                // If no record is found, create a new one with initial version 1
                const newVersion = 1;

                await LocalAuthListVersion.create({
                    stationId,
                    version: newVersion
                });

                return newVersion;
            }
        } catch (error) {
            // Handle or log the error as appropriate
            this._logger?.error('Failed to increment version', error);
            throw error;
        }
    }
}

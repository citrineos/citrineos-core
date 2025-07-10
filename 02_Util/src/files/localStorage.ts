import fs from 'fs';
import path from 'path';
import { ConfigStore, SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

export class LocalStorage implements ConfigStore {
  protected readonly _logger: Logger<ILogObj>;
  private defaultFilePath: string;
  private configFileName: string;
  private configDir: string | undefined;

  constructor(
    defaultFilePath: string,
    configFileName: string,
    configDir?: string,
    logger?: Logger<ILogObj>,
  ) {
    this.defaultFilePath = defaultFilePath;
    this.configFileName = configFileName;
    this.configDir = configDir;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async saveFile(fileName: string, content: Buffer, filePath?: string): Promise<string> {
    const absoluteFilePath = path.join(
      process.cwd(),
      filePath ? filePath : this.defaultFilePath,
      fileName,
    );
    this._logger.debug(`Saving file to ${absoluteFilePath}`);
    fs.writeFileSync(absoluteFilePath, content, 'utf-8');
    return absoluteFilePath;
  }

  async getFile(id: string, filePath?: string): Promise<string | undefined> {
    const absoluteFilePath = path.join(
      process.cwd(),
      filePath ? filePath : this.defaultFilePath,
      id,
    );
    this._logger.debug(`Getting file from ${absoluteFilePath}`);
    if (!fs.existsSync(absoluteFilePath)) {
      return;
    }
    return fs.readFileSync(absoluteFilePath, 'utf-8');
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const configString = await this.getFile(this.configFileName, this.configDir);
      if (!configString) return null;
      return JSON.parse(configString) as SystemConfig;
    } catch (error) {
      this._logger.error('Error fetching config from local storage:', error);
      return null;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      await this.saveFile(
        this.configFileName,
        Buffer.from(JSON.stringify(config, null, 2)),
        this.configDir,
      );
      this._logger.info('Config saved locally.');
    } catch (error) {
      this._logger.error('Error saving config to local storage:', error);
    }
  }
}

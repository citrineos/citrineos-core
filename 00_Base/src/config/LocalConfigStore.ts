import fs from 'fs';
import path from 'path';
import {ConfigStore} from "./ConfigStore";
import {SystemConfig} from "./types";

export class LocalConfigStore implements ConfigStore {
  private fileName: string;
  private configDir: string;

  constructor(fileName: string, configDir: string) {
    this.fileName = fileName;
    this.configDir = configDir;
  }

  async fetchConfig(): Promise<SystemConfig | null> {
    try {
      const filePath = path.join(this.configDir, `/${this.fileName}`);
      if (fs.existsSync(filePath)) {
        console.log("Config fetched from local storage.");
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
      return null;
    } catch (error) {
      console.error('Error fetching config from local storage:', error);
      return null;
    }
  }

  async saveConfig(config: SystemConfig): Promise<void> {
    try {
      const filePath = path.join(this.configDir, `/${this.fileName}`);
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('Config saved locally.');
    } catch (error) {
      console.error('Error saving config to local storage:', error);
    }
  }
}

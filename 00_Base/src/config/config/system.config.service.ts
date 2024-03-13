import {singleton} from "tsyringe";
import {SystemConfig} from "../types";
import {systemConfig} from "./";

@singleton()
export class SystemConfigService {

  systemConfig: SystemConfig

  constructor() {
    this.systemConfig = systemConfig;
  }
}
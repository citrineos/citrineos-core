import { ILogObj, Logger } from 'tslog';

export abstract class Scheduler {
  protected readonly _logger: Logger<ILogObj>;

  private _registry: Map<string, NodeJS.Timeout> = new Map();

  constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  protected schedule(key: string, task: () => void, intervalSeconds: number): void {
    if (this._isAlreadyRegistered(key)) {
      this._logger.debug(`Skipping task registration for ${key} as it is already registered`);
      return;
    }
    this._logger.debug(`Registering scheduled task for ${key}`);
    this._register(
      key,
      setInterval(() => task(), intervalSeconds * 1000),
    );
  }

  protected unschedule(key: string) {
    this._logger.debug(`Unregistering scheduled task for ${key}`);
    this._unregister(key);
  }

  private _register(key: string, timeout: NodeJS.Timeout) {
    this._registry.set(key, timeout);
  }

  private _unregister(key: string) {
    clearInterval(this._registry.get(key));
    this._registry.delete(key);
  }

  private _isAlreadyRegistered(key: string) {
    return this._registry.has(key);
  }
}

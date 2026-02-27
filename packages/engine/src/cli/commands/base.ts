import { Command } from 'commander';
import type { MapperConfig } from '../utils/config-mapper.js';
import { getMapperConfig } from '../utils/config-mapper.js';
import { ViteLauncher } from '../utils/vite-launcher.js';

export abstract class BaseCommand {
  protected abstract get name(): string;
  protected abstract get description(): string;
  protected config: MapperConfig;
  protected launcher: ViteLauncher;

  constructor() {
    this.config = getMapperConfig();
    this.launcher = new ViteLauncher();
  }

  public register(program: Command) {
    const cmd = program.command(this.name).description(this.description);
    this.setupOptions(cmd);
    cmd.action((...args: any[]) => this.run(...args));
  }

  protected setupOptions(cmd: Command): void {}
  public abstract run(...args: any[]): Promise<void>;
}

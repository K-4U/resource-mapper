import { describe, it, expect, vi } from 'vitest';
import { Command } from 'commander';
import { BaseCommand } from './base.js';

class DummyCommand extends BaseCommand {
  protected get name() { return 'dummy'; }
  protected get description() { return 'Dummy command for testing.'; }
  public run = vi.fn(async (...args: any[]) => {});
}

describe('BaseCommand', () => {
  it('registers command with correct name and description', () => {
    const program = new Command();
    const cmd = new DummyCommand();
    cmd.register(program);
    const sub = program.commands.find((c: Command) => c.name() === 'dummy');
    expect(sub).toBeDefined();
    expect(sub?.description()).toBe('Dummy command for testing.');
  });

  it('calls run when command is executed via Commander with correct args', async () => {
    const program = new Command();
    const cmd = new DummyCommand();
    cmd.register(program);
    await program.parseAsync(['node', 'test', 'dummy', 'foo', 'bar']);
    const call = cmd.run.mock.calls[0];
    expect(call[0]).toEqual(['foo', 'bar']);
  });
});

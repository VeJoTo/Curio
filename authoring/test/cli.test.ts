import { describe, expect, it } from 'vitest';
import { buildProgram } from '../src/cli.js';

describe('curio-author CLI', () => {
  it('prints help text including "seed"', () => {
    const program = buildProgram();
    const help = program.helpInformation();
    expect(help).toContain('curio-author');
    expect(help).toContain('seed');
  });

  it('declares program version', () => {
    const program = buildProgram();
    expect(program.version()).toBe('0.0.0');
  });

  it('seed command requires a topic argument', () => {
    const program = buildProgram();
    const seed = program.commands.find((c) => c.name() === 'seed');
    expect(seed).toBeDefined();
    expect(seed!.usage()).toContain('<topic>');
  });
});

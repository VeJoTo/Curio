import { Command } from 'commander';

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('curio-author')
    .description('Curio AI-assisted topic authoring CLI')
    .version('0.0.0');

  program
    .command('seed')
    .description('expand a seed phrase into a draft topic')
    .argument('<topic>', 'the topic seed phrase')
    .action((_topic: string) => {
      // Implementation lands in the Authoring plan (Plan 3).
      throw new Error('Not implemented in foundation plan');
    });

  return program;
}

// Entry point — guarded so tests can import without running argv parsing.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  buildProgram().parse(process.argv);
}

#!/usr/bin/env node
import {Command} from 'commander';
import {BuildCommand, DevCommand, ValidateCommand} from './cli/commands/index.js';

const program = new Command();
program.name('mapper').description('A CLI tool for Resource Mapper').version('1.0.0');

[new DevCommand(), new BuildCommand(), new ValidateCommand()].forEach(c => c.register(program));

if (process.argv.length === 2) {
    program.help();
}

program.parse(process.argv);

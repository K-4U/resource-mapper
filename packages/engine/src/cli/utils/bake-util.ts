import path from 'node:path';
import fs from 'node:fs';
import { runBake } from '../../scripts/bake-logic.js';
import {logger} from "./logger.js";

export function getDataDir() {
  return path.resolve(process.cwd(), 'data'); //Todo: Make configurable.
}
export function getOutputDir() {
  return path.resolve(process.cwd(), '.mapper'); //TODO: Make this configurable.
}
export function getOutputPath() {
  return path.join(getOutputDir(), 'data.json');
}

export async function bakeOrExit() {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    logger.error('[mapper-engine] ERROR: Missing ./data directory. Please create a data folder with YAML files.');
    process.exit(1);
  }
  await runBake({
    dataDir,
    outputPath: getOutputPath(),
  } as any);
}


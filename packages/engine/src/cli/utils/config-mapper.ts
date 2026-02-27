import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

export const MapperConfigSchema = z.object({
  build: z.object({
    outDir: z.string().default('dist'),
  }).default({ outDir: 'dist' }),
  site: z.object({
    title: z.string().default('Resource Mapper'),
    subtitle: z.string().default("Architecture Atlas"),
    logo: z.string().optional(),
  }).default({ title: 'Resource Mapper', subtitle: 'Architecture Atlas' }),
});

export type MapperConfig = z.infer<typeof MapperConfigSchema>;

export function getMapperConfig(): MapperConfig {
  const configPath = path.resolve(process.cwd(), 'mapper.config.json');
  let raw = '{}';
  if (fs.existsSync(configPath)) {
    raw = fs.readFileSync(configPath, 'utf-8');
  }
  const parsed = JSON.parse(raw);
  return MapperConfigSchema.parse(parsed);
}


import { ExecutorContext } from '@nrwl/devkit';
import { readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { NormalizedBuilderOptions } from './models';

export default function updatePackageJson(
  options: NormalizedBuilderOptions,
  context: ExecutorContext
) {
  const mainFile = basename(options.main).replace(/\.[tj]s$/, '');
  const typingsFile = `${mainFile}.d.ts`;
  const mainJsFile = `${mainFile}.js`;
  const packageJson: Record<string, unknown> = JSON.parse(readFileSync(join(context.root, options.packageJson)).toString());

  if (!packageJson.main) {
    packageJson.main = `${options.relativeMainFileOutput}${mainJsFile}`;
  }

  if (!packageJson.typings) {
    packageJson.typings = `${options.relativeMainFileOutput}${typingsFile}`;
  }

  writeFileSync(`${options.outputPath}/package.json`, JSON.stringify(packageJson));
}

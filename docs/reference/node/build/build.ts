import { ExecutorContext } from '@nrwl/devkit';
import { runWebpack } from '@nrwl/node/src/utils/run-webpack';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  createTmpTsConfig
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
import { resolve } from 'path';
import { eachValueFrom } from 'rxjs-for-await';
import { map, tap } from 'rxjs/operators';
import { OUT_FILENAME } from './utils/config';
import { generatePackageJson } from './utils/generate-package-json';
import { getNodeWebpackConfig } from './utils/node.config';
import { normalizeBuildOptions } from './utils/normalize';
import { BuildNodeBuilderOptions } from './utils/types';

try {
  require('dotenv').config();
} catch (e) {}

export type NodeBuildEvent = {
  outfile: string;
  success: boolean;
};

export async function* buildExecutor(
  rawOptions: BuildNodeBuilderOptions,
  context: ExecutorContext
) {
  const { sourceRoot, root } = context.workspace.projects[context.projectName];

  if (!sourceRoot) {
    throw new Error(`${context.projectName} does not have a sourceRoot.`);
  }

  if (!root) {
    throw new Error(`${context.projectName} does not have a root.`);
  }

  const options = normalizeBuildOptions(
    rawOptions,
    context.root,
    sourceRoot,
    root
  );
  const projGraph = await createProjectGraphAsync();
  if (!options.buildLibsFromSource) {
    const { target, dependencies } = calculateProjectDependencies(
      projGraph,
      context.root,
      context.projectName,
      context.targetName,
      context.configurationName
    );
    options.tsConfig = createTmpTsConfig(
      options.tsConfig,
      context.root,
      target.data.root,
      dependencies
    );

    if (
      !checkDependentProjectsHaveBeenBuilt(
        context.root,
        context.projectName,
        context.targetName,
        dependencies
      )
    ) {
      return { success: false } as any;
    }
  }

  if (options.generatePackageJson) {
    generatePackageJson(context.projectName, projGraph, options);
  }

  const config = options.webpackConfig.reduce((currentConfig, plugin) => {
    return require(plugin)(currentConfig, {
      options,
      configuration: context.configurationName
    });
  }, getNodeWebpackConfig(options));

  return yield* eachValueFrom(
    runWebpack(config).pipe(
      tap((stats) => {
        console.info(stats.toString(config.stats));
      }),
      map((stats) => {
        return {
          success: !stats.hasErrors(),
          outfile: resolve(context.root, options.outputPath, OUT_FILENAME)
        } as NodeBuildEvent;
      })
    )
  );
}

export default buildExecutor;

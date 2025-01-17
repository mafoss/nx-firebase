import { ExecutorContext } from '@nrwl/devkit';
import { buildExecutor } from '@nrwl/node/src/executors/build/build.impl';
import {
  createTmpTsConfig,
  DependentBuildableProjectNode
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
import {
  compileTypeScript,
  compileTypeScriptWatcher
} from '@nrwl/workspace/src/utilities/typescript/compilation';
import { join } from 'path';
import type {
  CustomTransformers,
  Program,
  SourceFile,
  TransformerFactory
} from 'typescript';
import { loadTsPlugins } from '../../../../../utils/load-ts-plugins';
import { NormalizedBuilderOptions } from './models';

export default async function compileTypeScriptFiles(
  options: NormalizedBuilderOptions,
  context: ExecutorContext,
  libRoot: string,
  projectDependencies: DependentBuildableProjectNode[],
  postCompleteAction: () => void | Promise<void>
) {

  let tsConfigPath = join(context.root, options.tsConfig);
  if (projectDependencies.length > 0) {
    tsConfigPath = createTmpTsConfig(
      tsConfigPath,
      context.root,
      libRoot,
      projectDependencies
    );
  }

  const { compilerPluginHooks } = loadTsPlugins(options.tsPlugins);

  const getCustomTransformers = (program: Program): CustomTransformers => ({
    before: compilerPluginHooks.beforeHooks.map(
      (hook) => hook(program) as TransformerFactory<SourceFile>
    ),
    after: compilerPluginHooks.afterHooks.map(
      (hook) => hook(program) as TransformerFactory<SourceFile>
    ),
    afterDeclarations: compilerPluginHooks.afterDeclarationsHooks.map(
      (hook) => hook(program) as TransformerFactory<SourceFile>
    )
  });

  const tcsOptions = {
    outputPath: options.normalizedOutputPath,
    projectName: context.projectName,
    projectRoot: libRoot,
    tsConfig: tsConfigPath,
    deleteOutputPath: options.deleteOutputPath,
    rootDir: options.srcRootForCompilationRoot,
    watch: options.watch,
    sourceMap:false,
    removeComments:true,
    getCustomTransformers
  };


/**
 * Use node builder from 
 */
  async function buildWithNrwlBuilder() {
    return buildExecutor({
      outputPath: options.normalizedOutputPath,
      projectRoot: libRoot,
      tsConfig: tsConfigPath,
      watch: options.watch,
      sourceMap:false,
      externalDependencies: projectDependencies.map(res => res.name),
      main: options.main,
      fileReplacements: []
    },context).return({ success: true });
  }


  return buildWithNrwlBuilder();
  

  if (options.watch) {
    return compileTypeScriptWatcher(tcsOptions, async (d) => {
      // Means tsc found 0 errors, in watch mode. https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
      if (d.code === 6194) {
        await postCompleteAction();
      }
    });
  } else {
    const result = compileTypeScript(tcsOptions);
    await postCompleteAction();
    return result;
  }
}




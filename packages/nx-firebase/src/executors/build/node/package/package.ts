import { ExecutorContext } from '@nrwl/devkit';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';
import { copyAssetFiles } from '@nrwl/workspace/src/utilities/assets';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  updateBuildableProjectPackageJsonDependencies
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
import addCliWrapper from './utils/cli';
import compileTypeScriptFiles from './utils/compile-typescript-files';
import { NodePackageBuilderOptions } from './utils/models';
import normalizeOptions from './utils/normalize-options';
import updatePackageJson from './utils/update-package-json';

export async function packageExecutor(
  options: NodePackageBuilderOptions,
  context: ExecutorContext
) {
  const libRoot = context.workspace.projects[context.projectName].root;
  const projectGraph = await createProjectGraphAsync('4.0');
  const normalizedOptions = normalizeOptions(options, context, libRoot);
  const { target, dependencies } = calculateProjectDependencies(
    projectGraph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName
  );
  const dependentsBuilt = checkDependentProjectsHaveBeenBuilt(
    context.root,
    context.projectName,
    context.targetName,
    dependencies
  );
  if (!dependentsBuilt) {
    throw new Error();
  }

  const result = await compileTypeScriptFiles(
    normalizedOptions,
    context,
    libRoot,
    dependencies,
    async () =>
      await updatePackageAndCopyAssets(
        normalizedOptions,
        context,
        target,
        dependencies
      )
  );

  if (options.cli) {
    addCliWrapper(normalizedOptions, context);
  }

  return {
    ...(result as { success: boolean }),
    outputPath: normalizedOptions.outputPath
  };
}

async function updatePackageAndCopyAssets(
  options,
  context,
  target,
  dependencies
) {
  await copyAssetFiles(options.files);

  updatePackageJson(options, context);
  if (
    dependencies.length > 0 &&
    options.updateBuildableProjectDepsInPackageJson
  ) {
    updateBuildableProjectPackageJsonDependencies(
      context.root,
      context.projectName,
      context.targetName,
      context.configurationName,
      target,
      dependencies,
      options.buildableProjectDepsInPackageJsonType
    );
  }
}

export default packageExecutor;

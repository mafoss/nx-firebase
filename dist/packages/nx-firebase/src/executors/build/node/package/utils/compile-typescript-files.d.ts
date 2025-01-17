import { ExecutorContext } from '@nrwl/devkit';
import { DependentBuildableProjectNode } from '@nrwl/workspace/src/utilities/buildable-libs-utils';
import { NormalizedBuilderOptions } from './models';
export default function compileTypeScriptFiles(options: NormalizedBuilderOptions, context: ExecutorContext, libRoot: string, projectDependencies: DependentBuildableProjectNode[], postCompleteAction: () => void | Promise<void>): Promise<IteratorResult<import("@nrwl/node/src/executors/build/build.impl").NodeBuildEvent, any> | import("typescript").WatchOfConfigFile<import("typescript").BuilderProgram> | {
    success: boolean;
}>;

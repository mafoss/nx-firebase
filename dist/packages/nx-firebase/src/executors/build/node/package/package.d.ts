import { ExecutorContext } from '@nrwl/devkit';
import { NodePackageBuilderOptions } from './utils/models';
export declare function packageExecutor(options: NodePackageBuilderOptions, context: ExecutorContext): Promise<{
    outputPath: string;
    success: boolean;
}>;
export default packageExecutor;

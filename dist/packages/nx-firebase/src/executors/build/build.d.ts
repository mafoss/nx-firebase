import { ExecutorContext } from '@nrwl/devkit';
import '../../utils/e2ePatch';
import { FirebaseBuildExecutorSchema } from './schema';
/**
 * Custom Firebase Functions "Application" nx build executor
 * Based on @nrwl/node:package executor
 *
 * - Builds the current application as a Typescript package library for Firebase functions
 * - Copies any dependent libraries to the dist folder
 * - Auto generates the firebase functions package.json
 * - Updates the firebase functions package.json to convert library dependency references to local file references
 *
 * After building, the project can be deployed using the firebase CLI as usual
 *
 * @param options
 * @param context
 * @returns build success/failure outcome
 */
export default function runExecutor(options: FirebaseBuildExecutorSchema, context: ExecutorContext): Promise<{
    success: any;
    outputPath: string;
}>;

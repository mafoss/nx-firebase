import { ExecutorContext } from '@nrwl/devkit';
import { FirebaseExecutorSchema } from './schema';
/**
 * Experimental executor to wrap Firebase CLI with the --config <config> option auto-added for convenience
 * Not yet convinced this is actually adding value
 * @param options
 * @param context
 * @returns
 */
export default function runExecutor(options: FirebaseExecutorSchema, context: ExecutorContext): Promise<{
    success: boolean;
}>;

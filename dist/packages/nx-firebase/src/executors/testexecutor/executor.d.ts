import { TestexecutorExecutorSchema } from './schema';
export default function runExecutor(options: TestexecutorExecutorSchema): Promise<{
    success: boolean;
}>;

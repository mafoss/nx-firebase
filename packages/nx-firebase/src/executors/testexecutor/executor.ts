import { TestexecutorExecutorSchema } from './schema';

export default async function runExecutor(
  options: TestexecutorExecutorSchema,
) {
  console.log('Executor ran for Testexecutor', options)
  return {
    success: true
  }
}


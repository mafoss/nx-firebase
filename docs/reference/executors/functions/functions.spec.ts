import { FunctionsExecutorSchema } from './schema';
import executor from './functions';

const options: FunctionsExecutorSchema = {};

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options, {} as any);
    expect(output.success).toBe(true);
  });
});

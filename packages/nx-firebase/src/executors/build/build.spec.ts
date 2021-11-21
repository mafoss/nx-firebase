import { FirebaseBuildExecutorSchema } from './schema';
import executor from './build';

const options: Partial<FirebaseBuildExecutorSchema> = {};

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options as any, {} as any);
    expect(output.success).toBe(true);
  });
});

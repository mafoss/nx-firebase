import { FirebaseExecutorSchema } from './schema';
import executor from './firebase';

const options: FirebaseExecutorSchema = {} as any;

describe('Build Executor', () => {
  it('can run', async () => {
    const output = await executor(options, {} as any);
    expect(output.success).toBe(true);
  });
});

import { teardown } from './mongo-memory';

export default async function globalTeardown(): Promise<void> {
  await teardown();
}

import { setup } from './mongo-memory';

export default async function globalSetup(): Promise<void> {
  await setup();
}

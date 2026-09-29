import 'reflect-metadata';
import { clearCollections, connectTestDatabase, disconnectTestDatabase } from './mongo-memory';

beforeAll(async () => {
  await connectTestDatabase();
});

// Each test starts from an empty database, so ordering never matters.
afterEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await disconnectTestDatabase();
});

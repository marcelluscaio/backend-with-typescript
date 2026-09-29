import fs from 'fs';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../../src/infra/database/mongoose-connection';

const URI_FILE = path.join(os.tmpdir(), 'task-manager-test-mongo-uri');

let memoryServer: MongoMemoryServer | undefined;

/**
 * Boots an in-process MongoDB so `npm test` needs no external server. The
 * URI is handed to the workers through a temp file, because globalSetup runs
 * in a different process than the test files.
 */
export async function setup(): Promise<void> {
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri();
  process.env.MONGO_URI = uri;
  fs.writeFileSync(URI_FILE, uri, 'utf8');
}

export async function teardown(): Promise<void> {
  await memoryServer?.stop();
  if (fs.existsSync(URI_FILE)) {
    fs.unlinkSync(URI_FILE);
  }
}

export function readMemoryServerUri(): string {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  if (!fs.existsSync(URI_FILE)) {
    throw new Error('MongoDB em memória não foi iniciado pelo globalSetup do Jest');
  }
  return fs.readFileSync(URI_FILE, 'utf8');
}

export async function connectTestDatabase(): Promise<void> {
  await connectDatabase({ uri: readMemoryServerUri(), dbName: 'task_manager_test' });
}

export async function disconnectTestDatabase(): Promise<void> {
  await disconnectDatabase();
}

export async function clearCollections(): Promise<void> {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

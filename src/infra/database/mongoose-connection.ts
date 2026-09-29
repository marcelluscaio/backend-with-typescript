import mongoose from 'mongoose';
import { env } from '../../config/env';
import { logger } from '../../services/logger.service';

export interface ConnectOptions {
  uri?: string;
  dbName?: string;
}

/**
 * Single entry point for the database lifecycle. Nothing above this module
 * opens or closes a connection, so the bootstrap owns it end to end.
 */
export async function connectDatabase(options: ConnectOptions = {}): Promise<void> {
  if (isDatabaseConnected()) {
    return;
  }

  const uri = options.uri ?? env.mongoUri;
  const dbName = options.dbName ?? env.mongoDbName;

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
  logger.info('Conexão com o MongoDB estabelecida', { dbName });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }
  await mongoose.disconnect();
  logger.info('Conexão com o MongoDB encerrada');
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

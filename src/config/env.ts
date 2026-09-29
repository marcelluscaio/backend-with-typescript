import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
  mongoUri: string;
  mongoDbName: string;
}

function readEnv(): EnvConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    nodeEnv: process.env.NODE_ENV ?? 'development',
    mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
    mongoDbName: process.env.MONGO_DB_NAME ?? 'task_manager',
  };
}

export const env = readEnv();

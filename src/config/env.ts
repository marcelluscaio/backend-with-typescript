import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
}

function readEnv(): EnvConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}

export const env = readEnv();

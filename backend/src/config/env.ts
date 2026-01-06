import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  CLIENT_URL: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  EMAIL_FROM: string;
  ANTHROPIC_API_KEY: string;
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  WEBHOOK_SECRET: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const raw = process.env[key];
  const value = (raw === undefined || raw === '') ? defaultValue : raw;
  if (value === undefined || value === null) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  if ((raw === undefined || raw === '') && defaultValue !== undefined) {
    console.warn(`Using default value for ${key}; set it in your .env for production`);
  }
  return value;
};

export const config: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '5000'), 10),
  CLIENT_URL: getEnvVar('CLIENT_URL', 'http://localhost:3000'),
  MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/workflow-automation'),
  REDIS_URL: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
  JWT_ACCESS_SECRET: getEnvVar('JWT_ACCESS_SECRET', 'dev-access-secret'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  JWT_ACCESS_EXPIRY: getEnvVar('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnvVar('JWT_REFRESH_EXPIRY', '7d'),
  SMTP_HOST: getEnvVar('SMTP_HOST', 'localhost'),
  SMTP_PORT: parseInt(getEnvVar('SMTP_PORT', '587'), 10),
  SMTP_USER: getEnvVar('SMTP_USER', 'user'),
  SMTP_PASSWORD: getEnvVar('SMTP_PASSWORD', 'pass'),
  EMAIL_FROM: getEnvVar('EMAIL_FROM', 'noreply@localhost'),
  ANTHROPIC_API_KEY: getEnvVar('ANTHROPIC_API_KEY', ''),
  BCRYPT_ROUNDS: parseInt(getEnvVar('BCRYPT_ROUNDS', '12'), 10),
  RATE_LIMIT_WINDOW_MS: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '60000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  WEBHOOK_SECRET: getEnvVar('WEBHOOK_SECRET', 'dev-webhook-secret'),
};

export default config;
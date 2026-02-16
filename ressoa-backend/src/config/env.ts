import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  // S3/MinIO - optional until Story 3.2 (Upload)
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  // External APIs - STT & LLM (Stories 4.2, 5.x)
  // OpenAI Whisper API key (Story 4.2 - required for STT primary provider)
  OPENAI_API_KEY: z.string().optional(),
  // Anthropic Claude API key (Epic 5 - required for pedagogical analysis)
  ANTHROPIC_API_KEY: z.string().optional(),
  // Google Cloud Service Account JSON (Story 4.2 - required for STT fallback)
  // Format: stringified JSON of service account credentials
  GOOGLE_CLOUD_CREDENTIALS: z.string().optional(),
  // Groq API key (Story 14.2 - Groq Whisper STT)
  GROQ_API_KEY: z.string().optional(),
  // Google Gemini API key (Story 14.3 - Gemini Flash LLM)
  GEMINI_API_KEY: z.string().optional(),
  // STT Provider Configuration (Story 4.1)
  STT_PRIMARY_PROVIDER: z
    .enum(['WHISPER', 'GOOGLE', 'AZURE', 'GROQ_WHISPER'])
    .default('WHISPER'),
  STT_FALLBACK_PROVIDER: z
    .enum(['WHISPER', 'GOOGLE', 'AZURE', 'GROQ_WHISPER'])
    .default('GOOGLE'),
  // AWS S3 for audio downloads (Story 4.1)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  // Email Service - Story 1.5 (Password Recovery)
  EMAIL_PROVIDER: z.enum(['sendgrid', 'ses']).default('sendgrid'),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

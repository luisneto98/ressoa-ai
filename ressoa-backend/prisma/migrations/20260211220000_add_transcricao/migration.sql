-- CreateEnum: ProviderSTT (initial values; GROQ_WHISPER added in 20260214200000)
CREATE TYPE "ProviderSTT" AS ENUM ('WHISPER', 'GOOGLE', 'AZURE', 'MANUAL');

-- CreateTable: transcricao (initial schema; altered in 20260212000000_add_analise_entity)
CREATE TABLE "transcricao" (
    "id" TEXT NOT NULL,
    "aula_id" TEXT,
    "escola_id" TEXT,
    "texto" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'WHISPER',
    "idioma" TEXT,
    "duracao_segundos" INTEGER,
    "confianca" DOUBLE PRECISION,
    "custo_usd" DOUBLE PRECISION,
    "tempo_processamento_ms" INTEGER,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcricao_pkey" PRIMARY KEY ("id")
);

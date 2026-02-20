-- CreateEnum: ProviderLLM (missing from 20260211235549_add_prompt_entity which was a no-op)
CREATE TYPE "ProviderLLM" AS ENUM ('CLAUDE_SONNET', 'CLAUDE_HAIKU', 'GPT4_TURBO', 'GPT4_MINI', 'GEMINI_PRO', 'GEMINI_FLASH');

-- CreateTable: prompt
CREATE TABLE "prompt" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "variaveis" JSONB,
    "modelo_sugerido" "ProviderLLM",
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "ab_testing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_nome_versao_key" ON "prompt"("nome", "versao");

-- CreateIndex
CREATE INDEX "prompt_nome_ativo_idx" ON "prompt"("nome", "ativo");

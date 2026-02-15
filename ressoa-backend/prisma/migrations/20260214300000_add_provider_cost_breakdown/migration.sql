-- AlterTable: Add provider cost breakdown fields to Analise (Story 14.4)
ALTER TABLE "analise" ADD COLUMN "provider_stt" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_stt_usd" DOUBLE PRECISION;
ALTER TABLE "analise" ADD COLUMN "provider_llm_cobertura" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_llm_cobertura_usd" DOUBLE PRECISION;
ALTER TABLE "analise" ADD COLUMN "provider_llm_qualitativa" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_llm_qualitativa_usd" DOUBLE PRECISION;
ALTER TABLE "analise" ADD COLUMN "provider_llm_relatorio" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_llm_relatorio_usd" DOUBLE PRECISION;
ALTER TABLE "analise" ADD COLUMN "provider_llm_exercicios" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_llm_exercicios_usd" DOUBLE PRECISION;
ALTER TABLE "analise" ADD COLUMN "provider_llm_alertas" TEXT;
ALTER TABLE "analise" ADD COLUMN "custo_llm_alertas_usd" DOUBLE PRECISION;

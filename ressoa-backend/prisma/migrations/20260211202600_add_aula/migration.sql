-- CreateEnum
CREATE TYPE "TipoEntrada" AS ENUM ('AUDIO', 'TRANSCRICAO', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusProcessamento" AS ENUM ('CRIADA', 'UPLOAD_PROGRESSO', 'AGUARDANDO_TRANSCRICAO', 'TRANSCRITA', 'ANALISANDO', 'ANALISADA', 'APROVADA', 'REJEITADA', 'ERRO');

-- CreateTable
CREATE TABLE "aula" (
    "id" TEXT NOT NULL,
    "escola_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "turma_id" TEXT NOT NULL,
    "planejamento_id" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo_entrada" "TipoEntrada" NOT NULL,
    "status_processamento" "StatusProcessamento" NOT NULL DEFAULT 'CRIADA',
    "arquivo_url" TEXT,
    "arquivo_tamanho" INTEGER,
    "transcricao_id" TEXT,
    "analise_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "aula_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aula_escola_id_professor_id_data_idx" ON "aula"("escola_id", "professor_id", "data");

-- CreateIndex
CREATE INDEX "aula_status_processamento_idx" ON "aula"("status_processamento");

-- CreateIndex
CREATE INDEX "aula_turma_id_data_idx" ON "aula"("turma_id", "data");

-- CreateIndex
CREATE INDEX "aula_deleted_at_idx" ON "aula"("deleted_at");

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "aula_planejamento_id_fkey" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

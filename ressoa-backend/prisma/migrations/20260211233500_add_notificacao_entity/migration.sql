-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('TRANSCRICAO_PRONTA', 'ANALISE_PRONTA', 'ERRO_PROCESSAMENTO', 'SISTEMA');

-- AlterTable perfil_usuario - Add notificacoes_email field
ALTER TABLE "perfil_usuario" ADD COLUMN "notificacoes_email" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable Notificacao
CREATE TABLE "notificacao" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacao_usuario_id_lida_created_at_idx" ON "notificacao"("usuario_id", "lida", "created_at");

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

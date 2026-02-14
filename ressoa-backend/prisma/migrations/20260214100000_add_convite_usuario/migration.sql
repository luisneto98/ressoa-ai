-- CreateEnum: StatusConvite
CREATE TYPE "StatusConvite" AS ENUM ('pendente', 'aceito', 'expirado', 'cancelado');

-- CreateEnum: TipoConvite
CREATE TYPE "TipoConvite" AS ENUM ('professor', 'coordenador', 'diretor');

-- CreateTable: convite_usuario (Story 13.11)
CREATE TABLE "convite_usuario" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nome_completo" VARCHAR(200) NOT NULL,
    "tipo_usuario" "TipoConvite" NOT NULL,
    "escola_id" TEXT NOT NULL,
    "criado_por" TEXT,
    "token" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "aceito_em" TIMESTAMP(3),
    "status" "StatusConvite" NOT NULL DEFAULT 'pendente',
    "dados_extras" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convite_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convite_usuario_token_key" ON "convite_usuario"("token");
CREATE INDEX "convite_usuario_email_escola_id_idx" ON "convite_usuario"("email", "escola_id");
CREATE INDEX "convite_usuario_status_expira_em_idx" ON "convite_usuario"("status", "expira_em");
CREATE INDEX "convite_usuario_escola_id_status_idx" ON "convite_usuario"("escola_id", "status");

-- AddForeignKey
ALTER TABLE "convite_usuario" ADD CONSTRAINT "convite_usuario_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convite_usuario" ADD CONSTRAINT "convite_usuario_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

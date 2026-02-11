-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('PROFESSOR', 'COORDENADOR', 'DIRETOR');

-- CreateTable
CREATE TABLE "escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "escola_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "role" "RoleUsuario" NOT NULL DEFAULT 'PROFESSOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfil_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escola_cnpj_key" ON "escola"("cnpj");

-- CreateIndex
CREATE INDEX "usuario_escola_id_idx" ON "usuario"("escola_id");

-- CreateIndex
CREATE INDEX "usuario_email_idx" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_escola_id_key" ON "usuario"("email", "escola_id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_usuario_usuario_id_key" ON "perfil_usuario"("usuario_id");

-- CreateIndex
CREATE INDEX "perfil_usuario_usuario_id_idx" ON "perfil_usuario"("usuario_id");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_usuario" ADD CONSTRAINT "perfil_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

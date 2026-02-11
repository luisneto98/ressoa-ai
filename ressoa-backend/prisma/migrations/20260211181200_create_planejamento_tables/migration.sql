-- CreateEnum
CREATE TYPE "Serie" AS ENUM ('SEXTO_ANO', 'SETIMO_ANO', 'OITAVO_ANO', 'NONO_ANO');

-- CreateTable
CREATE TABLE "turma" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "serie" "Serie" NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "escola_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planejamento" (
    "id" TEXT NOT NULL,
    "turma_id" TEXT NOT NULL,
    "bimestre" INTEGER NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "escola_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,
    "validado_coordenacao" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planejamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planejamento_habilidade" (
    "id" TEXT NOT NULL,
    "planejamento_id" TEXT NOT NULL,
    "habilidade_id" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "aulas_previstas" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planejamento_habilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turma_escola_id_idx" ON "turma"("escola_id");

-- CreateIndex
CREATE INDEX "turma_professor_id_idx" ON "turma"("professor_id");

-- CreateIndex
CREATE INDEX "turma_ano_letivo_disciplina_idx" ON "turma"("ano_letivo", "disciplina");

-- CreateIndex
CREATE INDEX "planejamento_escola_id_idx" ON "planejamento"("escola_id");

-- CreateIndex
CREATE INDEX "planejamento_professor_id_idx" ON "planejamento"("professor_id");

-- CreateIndex
CREATE INDEX "planejamento_turma_id_idx" ON "planejamento"("turma_id");

-- CreateIndex
CREATE INDEX "planejamento_ano_letivo_bimestre_idx" ON "planejamento"("ano_letivo", "bimestre");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_turma_id_bimestre_ano_letivo_key" ON "planejamento"("turma_id", "bimestre", "ano_letivo");

-- CreateIndex
CREATE INDEX "planejamento_habilidade_planejamento_id_idx" ON "planejamento_habilidade"("planejamento_id");

-- CreateIndex
CREATE INDEX "planejamento_habilidade_habilidade_id_idx" ON "planejamento_habilidade"("habilidade_id");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_habilidade_planejamento_id_habilidade_id_key" ON "planejamento_habilidade"("planejamento_id", "habilidade_id");

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento" ADD CONSTRAINT "planejamento_escola_id_fkey" FOREIGN KEY ("escola_id") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento" ADD CONSTRAINT "planejamento_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento" ADD CONSTRAINT "planejamento_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_habilidade" ADD CONSTRAINT "planejamento_habilidade_planejamento_id_fkey" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_habilidade" ADD CONSTRAINT "planejamento_habilidade_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

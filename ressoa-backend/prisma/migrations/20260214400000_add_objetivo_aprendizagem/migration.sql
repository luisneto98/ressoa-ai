-- CreateEnum: NivelBloom (Bloom's Taxonomy - Story 11.1)
CREATE TYPE "NivelBloom" AS ENUM ('LEMBRAR', 'ENTENDER', 'APLICAR', 'ANALISAR', 'AVALIAR', 'CRIAR');

-- CreateEnum: TipoFonte (Story 11.1)
CREATE TYPE "TipoFonte" AS ENUM ('BNCC', 'CUSTOM', 'CEFR', 'SENAC');

-- CreateTable: objetivo_aprendizagem (Story 11.1)
CREATE TABLE "objetivo_aprendizagem" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "nivel_cognitivo" "NivelBloom" NOT NULL,
    "tipo_fonte" "TipoFonte" NOT NULL,
    "habilidade_bncc_id" TEXT,
    "turma_id" TEXT,
    "area_conhecimento" TEXT,
    "criterios_evidencia" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contexto_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objetivo_aprendizagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: planejamento_objetivo (Story 11.3)
CREATE TABLE "planejamento_objetivo" (
    "id" TEXT NOT NULL,
    "planejamento_id" TEXT NOT NULL,
    "objetivo_id" TEXT NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "aulas_previstas" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planejamento_objetivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "objetivo_aprendizagem_turma_id_codigo_key" ON "objetivo_aprendizagem"("turma_id", "codigo");

-- CreateIndex
CREATE INDEX "objetivo_aprendizagem_tipo_fonte_turma_id_created_at_idx" ON "objetivo_aprendizagem"("tipo_fonte", "turma_id", "created_at");

-- CreateIndex
CREATE INDEX "objetivo_aprendizagem_habilidade_bncc_id_idx" ON "objetivo_aprendizagem"("habilidade_bncc_id");

-- CreateIndex
CREATE UNIQUE INDEX "planejamento_objetivo_planejamento_id_objetivo_id_key" ON "planejamento_objetivo"("planejamento_id", "objetivo_id");

-- CreateIndex
CREATE INDEX "planejamento_objetivo_planejamento_id_idx" ON "planejamento_objetivo"("planejamento_id");

-- CreateIndex
CREATE INDEX "planejamento_objetivo_objetivo_id_idx" ON "planejamento_objetivo"("objetivo_id");

-- AddForeignKey
ALTER TABLE "objetivo_aprendizagem" ADD CONSTRAINT "objetivo_aprendizagem_habilidade_bncc_id_fkey" FOREIGN KEY ("habilidade_bncc_id") REFERENCES "habilidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivo_aprendizagem" ADD CONSTRAINT "objetivo_aprendizagem_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_objetivo" ADD CONSTRAINT "planejamento_objetivo_planejamento_id_fkey" FOREIGN KEY ("planejamento_id") REFERENCES "planejamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planejamento_objetivo" ADD CONSTRAINT "planejamento_objetivo_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivo_aprendizagem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

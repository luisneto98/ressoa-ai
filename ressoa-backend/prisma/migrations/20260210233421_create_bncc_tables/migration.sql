-- CreateTable
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilidades" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "ano_inicio" INTEGER NOT NULL,
    "ano_fim" INTEGER,
    "unidade_tematica" TEXT,
    "objeto_conhecimento" TEXT,
    "versao_bncc" TEXT NOT NULL DEFAULT '2018',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilidades_anos" (
    "id" TEXT NOT NULL,
    "habilidade_id" TEXT NOT NULL,
    "ano_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilidades_anos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_codigo_key" ON "disciplinas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "anos_codigo_key" ON "anos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "habilidades_codigo_key" ON "habilidades"("codigo");

-- CreateIndex
CREATE INDEX "habilidades_disciplina_ano_inicio_idx" ON "habilidades"("disciplina", "ano_inicio");

-- CreateIndex
CREATE INDEX "habilidades_codigo_idx" ON "habilidades"("codigo");

-- CreateIndex
CREATE INDEX "habilidades_ativa_idx" ON "habilidades"("ativa");

-- CreateIndex
CREATE INDEX "habilidades_anos_ano_id_idx" ON "habilidades_anos"("ano_id");

-- CreateIndex
CREATE UNIQUE INDEX "habilidades_anos_habilidade_id_ano_id_key" ON "habilidades_anos"("habilidade_id", "ano_id");

-- AddForeignKey
ALTER TABLE "habilidades_anos" ADD CONSTRAINT "habilidades_anos_habilidade_id_fkey" FOREIGN KEY ("habilidade_id") REFERENCES "habilidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilidades_anos" ADD CONSTRAINT "habilidades_anos_ano_id_fkey" FOREIGN KEY ("ano_id") REFERENCES "anos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

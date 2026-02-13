-- CreateIndex
CREATE INDEX "turma_escola_id_tipo_ensino_idx" ON "turma"("escola_id", "tipo_ensino");

-- CreateIndex
CREATE INDEX "turma_escola_id_tipo_ensino_serie_idx" ON "turma"("escola_id", "tipo_ensino", "serie");

-- CreateIndex
CREATE INDEX "turma_escola_id_tipo_ensino_ano_letivo_idx" ON "turma"("escola_id", "tipo_ensino", "ano_letivo");

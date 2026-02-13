-- CreateIndex
CREATE INDEX "habilidades_tipo_ensino_disciplina_ativa_idx" ON "habilidades"("tipo_ensino", "disciplina", "ativa");

-- CreateIndex
CREATE INDEX "habilidades_tipo_ensino_ano_inicio_ano_fim_idx" ON "habilidades"("tipo_ensino", "ano_inicio", "ano_fim");

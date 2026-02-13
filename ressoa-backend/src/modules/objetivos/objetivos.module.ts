import { Module } from '@nestjs/common';
import { ObjetivosService } from './objetivos.service';
import { ObjetivosController } from './objetivos.controller';
import { ObjetivosCustomController } from './objetivos-custom.controller';

/**
 * Módulo de Objetivos de Aprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 * Story 11.4: Backend — CRUD de Objetivos Customizados
 *
 * Fornece abstração genérica para BNCC e objetivos customizados
 * Controllers:
 * - ObjetivosController: CRUD genérico (Story 11.1)
 * - ObjetivosCustomController: Nested routes /turmas/:turma_id/objetivos (Story 11.4)
 */
@Module({
  providers: [ObjetivosService],
  controllers: [ObjetivosController, ObjetivosCustomController],
  exports: [ObjetivosService],
})
export class ObjetivosModule {}

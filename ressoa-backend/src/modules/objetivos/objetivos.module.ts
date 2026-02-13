import { Module } from '@nestjs/common';
import { ObjetivosService } from './objetivos.service';
import { ObjetivosController } from './objetivos.controller';

/**
 * Módulo de Objetivos de Aprendizagem
 * Story 11.1: Backend — Modelo de Dados - Objetivos de Aprendizagem
 *
 * Fornece abstração genérica para BNCC e objetivos customizados
 */
@Module({
  providers: [ObjetivosService],
  controllers: [ObjetivosController],
  exports: [ObjetivosService],
})
export class ObjetivosModule {}

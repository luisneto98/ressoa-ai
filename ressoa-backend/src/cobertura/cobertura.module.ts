// src/cobertura/cobertura.module.ts
// Story 7.1: Module for cobertura_bimestral materialized view management

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CoberturaService } from './cobertura.service';
import { RefreshCoberturaProcessor } from '../jobs/refresh-cobertura.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'refresh-cobertura-queue',
    }),
  ],
  providers: [CoberturaService, RefreshCoberturaProcessor],
  exports: [CoberturaService],
})
export class CoberturaModule {}

import { Module } from '@nestjs/common';
import {
  DashboardCoordenadorController,
  DashboardDiretorController,
} from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardCoordenadorController, DashboardDiretorController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

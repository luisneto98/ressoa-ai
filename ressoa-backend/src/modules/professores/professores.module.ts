import { Module } from '@nestjs/common';
import { ProfessoresController } from './professores.controller';
import { ProfessoresService } from './professores.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessoresController],
  providers: [ProfessoresService],
  exports: [ProfessoresService],
})
export class ProfessoresModule {}

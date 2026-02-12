import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CoberturaModule } from '../../cobertura/cobertura.module';

@Module({
  imports: [PrismaModule, AuthModule, CoberturaModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

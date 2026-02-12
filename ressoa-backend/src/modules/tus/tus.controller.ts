import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TusService } from './tus.service';

@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TusController {
  constructor(private readonly tusService: TusService) {}

  @All('*')
  @Roles('PROFESSOR') // ✅ Upload é exclusivo do professor
  async handleTus(@Req() req: Request, @Res() res: Response) {
    const server = this.tusService.getServer();
    return server.handle(req, res);
  }
}

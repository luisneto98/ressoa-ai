import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TusService } from './tus.service';

@Controller('api/v1/uploads')
export class TusController {
  constructor(private readonly tusService: TusService) {}

  @All('*')
  @UseGuards(JwtAuthGuard) // ✅ Autenticação obrigatória
  async handleTus(@Req() req: Request, @Res() res: Response) {
    const server = this.tusService.getServer();
    return server.handle(req, res);
  }
}

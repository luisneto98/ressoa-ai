import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsEnum } from 'class-validator';
import { StatusProcessamento } from '@prisma/client';
import { CreateAulaDto } from './create-aula.dto';

export class UpdateAulaDto extends PartialType(CreateAulaDto) {
  @IsOptional()
  @IsEnum(StatusProcessamento, {
    message:
      'status_processamento deve ser um valor válido do enum StatusProcessamento',
  })
  status_processamento?: StatusProcessamento;
}

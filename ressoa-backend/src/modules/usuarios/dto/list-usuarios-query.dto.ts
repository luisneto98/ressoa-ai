import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoleUsuario } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsuariosQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser no mínimo 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1, { message: 'limit deve ser no mínimo 1' })
  @Max(100, { message: 'limit deve ser no máximo 100' })
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Busca por nome ou email (2-100 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'search deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'search deve ter no máximo 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({ enum: RoleUsuario })
  @IsOptional()
  @IsEnum(RoleUsuario, {
    message:
      'role deve ser um dos valores: PROFESSOR, COORDENADOR, DIRETOR, ADMIN',
  })
  role?: RoleUsuario;

  @ApiPropertyOptional({ description: 'Filtro por escola (apenas Admin)' })
  @IsOptional()
  @IsUUID('4', { message: 'escola_id deve ser um UUID válido' })
  escola_id?: string;
}

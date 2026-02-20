import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { TipoEntrada } from '@prisma/client';

export class IniciarProcessamentoDto {
  @ApiProperty({ enum: TipoEntrada, description: 'Tipo de entrada para início do processamento' })
  @IsEnum(TipoEntrada, { message: 'tipo_entrada deve ser AUDIO, TRANSCRICAO ou MANUAL' })
  tipo_entrada!: TipoEntrada;

  @ApiPropertyOptional({ description: 'Obrigatório se tipo_entrada === TRANSCRICAO' })
  @ValidateIf((o: IniciarProcessamentoDto) => o.tipo_entrada === TipoEntrada.TRANSCRICAO)
  @IsString({ message: 'transcricao_texto é obrigatório quando tipo_entrada é TRANSCRICAO' })
  @IsNotEmpty({ message: 'transcricao_texto não pode ser vazio' })
  transcricao_texto?: string;

  @ApiPropertyOptional({ description: 'Obrigatório se tipo_entrada === MANUAL' })
  @ValidateIf((o: IniciarProcessamentoDto) => o.tipo_entrada === TipoEntrada.MANUAL)
  @IsString({ message: 'resumo é obrigatório quando tipo_entrada é MANUAL' })
  @IsNotEmpty({ message: 'resumo não pode ser vazio' })
  resumo?: string;
}

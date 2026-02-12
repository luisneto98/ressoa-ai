import { IsString, MinLength } from 'class-validator';

export class EditarRelatorioDto {
  @IsString()
  @MinLength(10, { message: 'Relatório deve ter ao menos 10 caracteres' })
  relatorio_editado!: string; // Markdown ou HTML (TipTap output)
}

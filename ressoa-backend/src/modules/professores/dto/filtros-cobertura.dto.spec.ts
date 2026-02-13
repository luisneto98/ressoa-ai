import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { FiltrosCoberturaDto } from './filtros-cobertura.dto';

describe('FiltrosCoberturaDto - Story 11.8 AC5', () => {
  it('should accept valid curriculo_tipo BNCC', async () => {
    const dto = plainToClass(FiltrosCoberturaDto, {
      curriculo_tipo: 'BNCC',
      bimestre: '1',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.curriculo_tipo).toBe('BNCC');
  });

  it('should accept valid curriculo_tipo CUSTOM', async () => {
    const dto = plainToClass(FiltrosCoberturaDto, {
      curriculo_tipo: 'CUSTOM',
      bimestre: '1',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.curriculo_tipo).toBe('CUSTOM');
  });

  it('should allow curriculo_tipo to be undefined (TODOS default)', async () => {
    const dto = plainToClass(FiltrosCoberturaDto, {
      bimestre: '1',
      disciplina: 'MATEMATICA',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.curriculo_tipo).toBeUndefined();
  });

  it('should reject invalid curriculo_tipo value', async () => {
    const dto = plainToClass(FiltrosCoberturaDto, {
      curriculo_tipo: 'INVALID',
      bimestre: '1',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const curriculoError = errors.find((e) => e.property === 'curriculo_tipo');
    expect(curriculoError).toBeDefined();
    expect(curriculoError?.constraints?.isIn).toContain('BNCC');
  });

  it('should accept all valid filters together', async () => {
    const dto = plainToClass(FiltrosCoberturaDto, {
      turma_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      disciplina: 'MATEMATICA',
      bimestre: '2',
      curriculo_tipo: 'CUSTOM',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.curriculo_tipo).toBe('CUSTOM');
    expect(dto.disciplina).toBe('MATEMATICA');
    expect(dto.bimestre).toBe(2); // Transformed to number
  });
});

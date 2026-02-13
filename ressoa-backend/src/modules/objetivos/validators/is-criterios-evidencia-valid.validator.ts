import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for criterios_evidencia array
 * Story 11.4: Backend — CRUD de Objetivos Customizados (AC2, Validação 6)
 *
 * Validates that:
 * - Each criteria string is between 10-200 characters
 * - Prevents very short, non-descriptive criteria like "OK", "Sim", etc.
 *
 * Example usage in DTO:
 * ```typescript
 * @Validate(IsCriteriosEvidenciaValid)
 * criterios_evidencia: string[];
 * ```
 */
@ValidatorConstraint({ name: 'IsCriteriosEvidenciaValid', async: false })
export class IsCriteriosEvidenciaValid implements ValidatorConstraintInterface {
  validate(criterios: any, args: ValidationArguments): boolean {
    // Check if criterios is an array
    if (!Array.isArray(criterios)) {
      return false;
    }

    // Validate each criterion
    for (const criterio of criterios) {
      // Must be a string
      if (typeof criterio !== 'string') {
        return false;
      }

      // Must be between 10 and 200 characters
      const length = criterio.trim().length;
      if (length < 10 || length > 200) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Cada critério de evidência deve ter entre 10 e 200 caracteres';
  }
}

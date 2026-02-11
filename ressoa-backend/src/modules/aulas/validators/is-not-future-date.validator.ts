import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Skip if empty (let @IsDateString handle it)
          const inputDate = new Date(value);
          const now = new Date();
          return inputDate <= now;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Data da aula não pode estar no futuro';
        },
      },
    });
  };
}

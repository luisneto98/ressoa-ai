import { Roles, ROLES_KEY } from './roles.decorator';
import { RoleUsuario } from '@prisma/client';
import { Reflector } from '@nestjs/core';

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set correct metadata with ROLES_KEY for single role', () => {
    class TestClass {
      @Roles(RoleUsuario.PROFESSOR)
      testMethod() {}
    }

    const metadata = reflector.get(ROLES_KEY, TestClass.prototype.testMethod);
    expect(metadata).toEqual([RoleUsuario.PROFESSOR]);
  });

  it('should set correct metadata for multiple roles', () => {
    class TestClass {
      @Roles(RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
      testMethod() {}
    }

    const metadata = reflector.get(ROLES_KEY, TestClass.prototype.testMethod);
    expect(metadata).toEqual([RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR]);
  });

  it('should set correct metadata for all three roles', () => {
    class TestClass {
      @Roles(
        RoleUsuario.PROFESSOR,
        RoleUsuario.COORDENADOR,
        RoleUsuario.DIRETOR,
      )
      testMethod() {}
    }

    const metadata = reflector.get(ROLES_KEY, TestClass.prototype.testMethod);
    expect(metadata).toEqual([
      RoleUsuario.PROFESSOR,
      RoleUsuario.COORDENADOR,
      RoleUsuario.DIRETOR,
    ]);
  });

  it('should work at class level', () => {
    @Roles(RoleUsuario.COORDENADOR)
    class TestClass {}

    const metadata = reflector.get(ROLES_KEY, TestClass);
    expect(metadata).toEqual([RoleUsuario.COORDENADOR]);
  });

  it('should export ROLES_KEY constant with correct value', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});

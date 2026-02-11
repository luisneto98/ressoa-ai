import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { Reflector } from '@nestjs/core';

describe('Public Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  it('should set metadata with IS_PUBLIC_KEY to true', () => {
    class TestClass {
      @Public()
      testMethod() {}
    }

    const metadata = reflector.get(
      IS_PUBLIC_KEY,
      TestClass.prototype.testMethod,
    );
    expect(metadata).toBe(true);
  });

  it('should work at class level', () => {
    @Public()
    class TestClass {}

    const metadata = reflector.get(IS_PUBLIC_KEY, TestClass);
    expect(metadata).toBe(true);
  });

  it('should work on multiple methods independently', () => {
    class TestClass {
      @Public()
      publicMethod() {}

      privateMethod() {} // No decorator
    }

    const publicMetadata = reflector.get(
      IS_PUBLIC_KEY,
      TestClass.prototype.publicMethod,
    );
    const privateMetadata = reflector.get(
      IS_PUBLIC_KEY,
      TestClass.prototype.privateMethod,
    );

    expect(publicMetadata).toBe(true);
    expect(privateMetadata).toBeUndefined();
  });

  it('should export IS_PUBLIC_KEY constant with correct value', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});

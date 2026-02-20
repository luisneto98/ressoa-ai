import {
  STT_PROMPTS,
  STT_PROMPT_MAX_LENGTH,
  resolveSttPromptKey,
} from './stt-prompts';

describe('STT Prompts', () => {
  describe('STT_PROMPTS', () => {
    it('should have all required discipline keys', () => {
      expect(STT_PROMPTS).toHaveProperty('matematica');
      expect(STT_PROMPTS).toHaveProperty('lingua_portuguesa');
      expect(STT_PROMPTS).toHaveProperty('ciencias');
      expect(STT_PROMPTS).toHaveProperty('default');
    });

    it.each(Object.entries(STT_PROMPTS))(
      'prompt "%s" should not exceed 800 characters',
      (_key, prompt) => {
        expect(prompt.length).toBeLessThanOrEqual(STT_PROMPT_MAX_LENGTH);
      },
    );

    it.each(Object.entries(STT_PROMPTS))(
      'prompt "%s" should not be empty',
      (_key, prompt) => {
        expect(prompt.trim().length).toBeGreaterThan(0);
      },
    );
  });

  describe('resolveSttPromptKey', () => {
    it('should map "Matemática" to "matematica"', () => {
      expect(resolveSttPromptKey('Matemática')).toBe('matematica');
    });

    it('should map "MATEMÁTICA" to "matematica" (case insensitive)', () => {
      expect(resolveSttPromptKey('MATEMÁTICA')).toBe('matematica');
    });

    it('should map "Língua Portuguesa" to "lingua_portuguesa"', () => {
      expect(resolveSttPromptKey('Língua Portuguesa')).toBe(
        'lingua_portuguesa',
      );
    });

    it('should map "Português" to "lingua_portuguesa"', () => {
      expect(resolveSttPromptKey('Português')).toBe('lingua_portuguesa');
    });

    it('should map "Ciências" to "ciencias"', () => {
      expect(resolveSttPromptKey('Ciências')).toBe('ciencias');
    });

    it('should map "ciencias" to "ciencias" (without accent)', () => {
      expect(resolveSttPromptKey('ciencias')).toBe('ciencias');
    });

    it('should map "Ciências da Natureza" to "ciencias"', () => {
      expect(resolveSttPromptKey('Ciências da Natureza')).toBe('ciencias');
    });

    it('should return "default" for unknown disciplines', () => {
      expect(resolveSttPromptKey('História')).toBe('default');
      expect(resolveSttPromptKey('Geografia')).toBe('default');
      expect(resolveSttPromptKey('Educação Física')).toBe('default');
    });

    it('should return "default" for empty string', () => {
      expect(resolveSttPromptKey('')).toBe('default');
    });
  });
});

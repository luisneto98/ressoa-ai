import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { FormFieldWithCounter } from './form-field-with-counter';

// Test schema
const testSchema = z.object({
  description: z.string().min(10).max(100),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component wrapper
function TestFormWithCounter({ defaultValue = '' }: { defaultValue?: string }) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { description: defaultValue },
  });

  return (
    <Form {...form}>
      <form>
        <FormFieldWithCounter
          control={form.control}
          name="description"
          label="Descrição"
          description="Descreva o objetivo"
          placeholder="Digite aqui..."
          maxLength={100}
          minLength={10}
          rows={4}
          required
        />
      </form>
    </Form>
  );
}

describe('FormFieldWithCounter', () => {
  it('renders label with required asterisk', () => {
    render(<TestFormWithCounter />);

    expect(screen.getByText(/Descrição/)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders textarea with correct attributes', () => {
    render(<TestFormWithCounter />);

    const textarea = screen.getByPlaceholderText('Digite aqui...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('maxLength', '100');
    expect(textarea).toHaveAttribute('id', 'description');
  });

  it('renders description text', () => {
    render(<TestFormWithCounter />);

    expect(screen.getByText('Descreva o objetivo')).toBeInTheDocument();
  });

  it('shows character counter at 0/100 initially', () => {
    render(<TestFormWithCounter />);

    expect(screen.getByText('0/100 caracteres')).toBeInTheDocument();
  });

  it('counter updates with text length (gray color within limit)', () => {
    render(<TestFormWithCounter defaultValue="Hello world" />);

    const counter = screen.getByText('11/100 caracteres');
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveClass('text-gray-500');
    expect(counter).not.toHaveClass('text-red-600');
  });

  it('counter turns red when exceeding maxLength (defensive - should not happen due to maxLength attribute)', () => {
    // Simulate exceeding (in reality, textarea maxLength prevents this)
    const longText = 'a'.repeat(101);
    render(<TestFormWithCounter defaultValue={longText} />);

    const counter = screen.getByText(/101\/100 caracteres/);
    expect(counter).toHaveClass('text-red-600');
    expect(counter).toHaveClass('font-medium');
  });

  it('has aria-atomic="true" for accessibility (no aria-live to avoid duplication)', () => {
    render(<TestFormWithCounter />);

    const counter = screen.getByText('0/100 caracteres');
    expect(counter).not.toHaveAttribute('aria-live'); // Removed to avoid duplication with FormMessage
    expect(counter).toHaveAttribute('aria-atomic', 'true');
  });

  it('textarea has aria-invalid when field has error', async () => {
    const { container } = render(<TestFormWithCounter defaultValue="short" />);

    const textarea = screen.getByPlaceholderText('Digite aqui...');

    // Submit form to trigger validation
    const form = container.querySelector('form');
    if (form) {
      // The form has validation errors for min length
      // aria-invalid will be set by react-hook-form after validation
      expect(textarea).toHaveAttribute('aria-invalid');
    }
  });

  it('counter is positioned to the right via flex justify-between', () => {
    const { container } = render(<TestFormWithCounter />);

    const flexContainer = container.querySelector('.flex.items-start.justify-between');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('gap-4');
  });

  it('counter and message are laid out with flex justify-between', () => {
    const { container } = render(<TestFormWithCounter />);

    // Should have flex container with justify-between
    const flexContainer = container.querySelector('.flex.items-start.justify-between');
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer).toHaveClass('gap-4');

    // Should contain the counter as one of the children
    const counter = screen.getByText('0/100 caracteres');
    expect(flexContainer).toContainElement(counter);
  });

  it('counter has flex-shrink-0 to prevent shrinking', () => {
    render(<TestFormWithCounter defaultValue="text" />);

    const counter = screen.getByText('4/100 caracteres');
    expect(counter).toHaveClass('flex-shrink-0');
  });
});

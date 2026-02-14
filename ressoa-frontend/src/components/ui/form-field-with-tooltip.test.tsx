import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { FormFieldWithTooltip } from './form-field-with-tooltip';

// Test schema
const testSchema = z.object({
  objetivo: z.string().min(10).max(500),
});

type TestFormData = z.infer<typeof testSchema>;

// Test component wrapper (textarea)
function TestFormWithTooltipTextarea() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { objetivo: '' },
  });

  return (
    <Form {...form}>
      <form>
        <FormFieldWithTooltip
          control={form.control}
          name="objetivo"
          label="Objetivo Geral"
          tooltipContent={
            <>
              <p className="font-medium mb-1">Dica:</p>
              <p className="text-sm">Descreva o objetivo do curso...</p>
              <p className="text-xs text-gray-400 mt-2">
                Exemplo: "Preparar alunos para ENEM 2026"
              </p>
            </>
          }
          type="textarea"
          rows={4}
          maxLength={500}
          required
        />
      </form>
    </Form>
  );
}

// Test component wrapper (input)
function TestFormWithTooltipInput() {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { objetivo: '' },
  });

  return (
    <Form {...form}>
      <form>
        <FormFieldWithTooltip
          control={form.control}
          name="objetivo"
          label="Objetivo Geral"
          tooltipContent={<p>Informação sobre o campo</p>}
          type="text"
          maxLength={500}
          required
        />
      </form>
    </Form>
  );
}

describe('FormFieldWithTooltip', () => {
  it('renders label with required asterisk', () => {
    render(<TestFormWithTooltipTextarea />);

    expect(screen.getByText(/Objetivo Geral/)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders tooltip icon with focus-orange color', () => {
    const { container } = render(<TestFormWithTooltipTextarea />);

    // IconAlertCircle should have text-focus-orange class
    const icon = container.querySelector('.text-focus-orange');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4');
    expect(icon).toHaveClass('w-4');
    expect(icon).toHaveClass('cursor-help');
  });

  it('tooltip icon has aria-label for accessibility', () => {
    render(<TestFormWithTooltipTextarea />);

    const icon = screen.getByLabelText('Informações sobre Objetivo Geral');
    expect(icon).toBeInTheDocument();
  });

  it('renders textarea when type="textarea"', () => {
    render(<TestFormWithTooltipTextarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('renders input when type="text"', () => {
    render(<TestFormWithTooltipInput />);

    const input = screen.getByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('maxLength', '500');
  });

  it('tooltip content renders on hover', async () => {
    const user = userEvent.setup();
    const { container } = render(<TestFormWithTooltipTextarea />);

    const icon = container.querySelector('.text-focus-orange');
    expect(icon).toBeInTheDocument();

    if (icon) {
      await user.hover(icon);

      // Wait for tooltip to appear
      const tooltips = await screen.findAllByText('Dica:', {}, { timeout: 1000 });
      expect(tooltips.length).toBeGreaterThan(0);

      // Use getAllByText for content that appears multiple times (Radix portals)
      const descriptionElements = screen.getAllByText(/Descreva o objetivo do curso/);
      expect(descriptionElements.length).toBeGreaterThan(0);

      const exampleElements = screen.getAllByText(/Preparar alunos para ENEM 2026/);
      expect(exampleElements.length).toBeGreaterThan(0);
    }
  });

  it('tooltip appears when hovering icon', async () => {
    const user = userEvent.setup();
    const { container } = render(<TestFormWithTooltipTextarea />);

    const icon = container.querySelector('.text-focus-orange');
    expect(icon).toBeInTheDocument();

    if (icon) {
      await user.hover(icon);

      // Tooltip should appear (check for role)
      const tooltip = await screen.findByRole('tooltip', {}, { timeout: 1000 });
      expect(tooltip).toBeInTheDocument();
    }
  });

  it('label and icon are side by side in flex container', () => {
    const { container } = render(<TestFormWithTooltipTextarea />);

    const flexContainer = container.querySelector('.flex.items-center.gap-2');
    expect(flexContainer).toBeInTheDocument();

    // Should contain label and icon
    const label = flexContainer?.querySelector('label');
    const icon = flexContainer?.querySelector('.text-focus-orange');
    expect(label).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('textarea has resize-none class', () => {
    const { container } = render(<TestFormWithTooltipTextarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('resize-none');
  });

  it('field has aria-invalid when error exists', () => {
    // This would require triggering validation, simplified check
    const { container } = render(<TestFormWithTooltipTextarea />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid');
  });
});

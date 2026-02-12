// Simple toast hook using sonner (already installed via Toaster in App.tsx)
import { toast as sonnerToast } from 'sonner';

export const useToast = () => {
  const toast = ({
    title,
    description,
    variant,
  }: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    const message = title || description || '';

    if (variant === 'destructive') {
      sonnerToast.error(message, { description: title ? description : undefined });
    } else {
      sonnerToast.success(message, { description: title ? description : undefined });
    }
  };

  return { toast };
};

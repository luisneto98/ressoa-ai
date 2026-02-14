import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useToast } from './use-toast';

/**
 * Hook for exporting PDF documents with loading states and error handling
 *
 * Usage:
 * ```tsx
 * const { exportPDF, isGenerating } = usePdfExport();
 *
 * const handleExport = async () => {
 *   await exportPDF(
 *     <MyPDFDocument data={data} />,
 *     'filename.pdf'
 *   );
 * };
 * ```
 */
export function usePdfExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  /**
   * Generate and download a PDF document
   * @param pdfDocument - React-PDF Document component
   * @param filename - Name of the file to download
   */
  const exportPDF = async (pdfDocument: React.ReactElement<any>, filename: string) => {
    setIsGenerating(true);

    try {
      // Generate PDF blob
      const blob = await pdf(pdfDocument).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;

      // Trigger download
      window.document.body.appendChild(link);
      link.click();

      // Cleanup
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success toast
      toast({
        title: 'PDF exportado com sucesso!',
        description: `Arquivo ${filename} foi baixado.`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);

      // Error toast
      toast({
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    exportPDF,
    isGenerating,
  };
}

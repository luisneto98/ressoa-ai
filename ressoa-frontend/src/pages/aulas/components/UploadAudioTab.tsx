import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as tus from 'tus-js-client';
import { toast } from 'sonner';
import { IconUpload, IconX, IconHeadphones } from '@tabler/icons-react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AulaFormFields, commonFormSchema } from './AulaFormFields';
import { UploadProgressBar } from './UploadProgressBar';
import { ProcessingStatus } from '@/components/ui/processing-status';
import { UploadErrorCard } from './UploadErrorCard';
import { createAula } from '@/api/aulas';
import { useAuthStore } from '@/stores/auth.store';
import {
  formatFileSize,
  isValidAudioFormat,
  isValidFileSize,
} from '@/lib/upload-utils';

// Constants
const TUS_UPLOAD_ENDPOINT = `${import.meta.env.VITE_API_URL}/uploads`;

// Form schema for upload audio tab
const uploadAudioSchema = commonFormSchema.extend({});
type UploadAudioFormData = z.infer<typeof uploadAudioSchema>;

type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'completed' | 'error';

// Helper: Map upload status to ProcessingStatus step (1-4)
const getCurrentStep = (status: UploadStatus): 1 | 2 | 3 | 4 => {
  switch (status) {
    case 'uploading':
      return 1;
    case 'transcribing':
      return 2;
    case 'analyzing':
      return 3;
    case 'completed':
      return 4;
    default:
      return 1;
  }
};

export function UploadAudioTab() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const form = useForm<UploadAudioFormData>({
    resolver: zodResolver(uploadAudioSchema),
    defaultValues: {
      turma_id: '',
      data: '',
      planejamento_id: '',
    },
  });

  // File & upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<tus.Upload | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [errorType, setErrorType] = useState<'file-corrupt' | 'network-timeout' | 'invalid-format' | 'generic'>('generic');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Track upload speed calculation
  const uploadTrackingRef = useRef({
    startTime: 0,
    previousBytes: 0,
    previousTime: 0,
    sampleCount: 0, // Track number of speed samples (for cold start handling)
  });

  // Navigation guard: Warn user if upload in progress AND cleanup on unmount
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStatus === 'uploading') {
        e.preventDefault();
        e.returnValue = 'Upload em andamento. Deseja cancelar?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: abort upload on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentUpload && uploadStatus === 'uploading') {
        currentUpload.abort();
        console.log('Upload aborted on component unmount');
      }
    };
  }, [uploadStatus, currentUpload]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    // Validate format
    if (!isValidAudioFormat(file)) {
      toast.error('Formato não suportado. Use mp3, wav, m4a ou webm');
      return;
    }

    // Validate size
    if (!isValidFileSize(file)) {
      toast.error('Arquivo muito grande. Máximo: 2GB');
      return;
    }

    setSelectedFile(file);
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cancel upload
  const handleCancelUpload = () => {
    if (currentUpload) {
      currentUpload.abort();
      setCurrentUpload(null);
      setUploadStatus('idle');
      setUploadProgress(0);
      setUploadSpeed(0);
      setTimeRemaining(null);
      toast.info('Upload cancelado');
    }
  };

  // Main upload handler
  const handleUpload = async (formData: UploadAudioFormData) => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo de áudio');
      return;
    }

    if (!user || !accessToken) {
      toast.error('Usuário não autenticado');
      navigate('/login');
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Step 1: Create aula in backend
      const aula = await createAula({
        turma_id: formData.turma_id,
        data: formData.data,
        planejamento_id: formData.planejamento_id || undefined,
        tipo_entrada: 'AUDIO',
      });

      // Step 2: Initialize TUS upload
      const upload = new tus.Upload(selectedFile, {
        endpoint: TUS_UPLOAD_ENDPOINT,
        metadata: {
          filename: selectedFile.name,
          filetype: selectedFile.type,
          aula_id: aula.id,
          escola_id: aula.escola_id,
          professor_id: aula.professor_id,
          turma_id: formData.turma_id,
          data: formData.data,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        retryDelays: [0, 1000, 3000, 5000], // Retry with backoff
        onError: (error) => {
          console.error('Upload error:', error);

          // Determine error type based on error message
          let detectedErrorType: typeof errorType = 'generic';
          if (error.message.includes('timeout') || error.message.includes('network')) {
            detectedErrorType = 'network-timeout';
          } else if (error.message.includes('format') || error.message.includes('unsupported') || error.message.includes('mime')) {
            detectedErrorType = 'invalid-format';
          } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
            detectedErrorType = 'file-corrupt';
          }

          setErrorType(detectedErrorType);
          setUploadStatus('error');

          // Show empathetic toast (not harsh red alert)
          if (detectedErrorType === 'network-timeout') {
            toast.error('Upload interrompido. Tente novamente.');
          } else if (detectedErrorType === 'invalid-format') {
            toast.error('Formato de arquivo não suportado.');
          } else {
            toast.error('Não conseguimos processar o arquivo.');
          }
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress(percentage);

          // Calculate speed and time remaining
          const currentTime = Date.now();
          if (uploadTrackingRef.current.startTime === 0) {
            uploadTrackingRef.current.startTime = currentTime;
            uploadTrackingRef.current.previousTime = currentTime;
            uploadTrackingRef.current.previousBytes = 0;
          }

          const deltaBytes = bytesUploaded - uploadTrackingRef.current.previousBytes;
          const deltaTime = (currentTime - uploadTrackingRef.current.previousTime) / 1000;

          if (deltaTime > 0) {
            const speed = deltaBytes / deltaTime;
            uploadTrackingRef.current.sampleCount += 1;

            // Only show speed/time after 3 samples (cold start mitigation)
            if (uploadTrackingRef.current.sampleCount >= 3 && speed > 0) {
              setUploadSpeed(speed);
              const remaining = (bytesTotal - bytesUploaded) / speed;
              // Prevent Infinity if speed is very low
              setTimeRemaining(isFinite(remaining) ? remaining : null);
            }

            uploadTrackingRef.current.previousBytes = bytesUploaded;
            uploadTrackingRef.current.previousTime = currentTime;
          }
        },
        onSuccess: () => {
          toast.success('Upload concluído! Transcrição em andamento...');
          setUploadStatus('transcribing');

          // Reset tracking
          uploadTrackingRef.current = {
            startTime: 0,
            previousBytes: 0,
            previousTime: 0,
            sampleCount: 0,
          };

          // Redirect after short delay
          setTimeout(() => {
            navigate('/minhas-aulas');
          }, 1500);
        },
      });

      // Start upload
      upload.start();
      setCurrentUpload(upload);
    } catch (error) {
      console.error('Error creating aula:', error);
      toast.error('Erro ao criar aula. Tente novamente.');
      setUploadStatus('error');
    }
  };

  const isFormValid = form.formState.isValid && selectedFile !== null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-6">
        {/* Common form fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <AulaFormFields form={form} />
          </CardContent>
        </Card>

        {/* Drag-and-drop zone */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${isDragging || isHovering ? 'border-tech-blue animate-pulse-subtle' : 'border-gray-300'}
                ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onMouseEnter={() => uploadStatus === 'idle' && setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => uploadStatus === 'idle' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Área de upload de áudio. Arraste arquivo ou pressione Enter para selecionar"
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && uploadStatus === 'idle') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.webm"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={uploadStatus === 'uploading'}
              />

              {!selectedFile && uploadStatus === 'idle' && (
                <div className="space-y-4">
                  <IconUpload
                    className={`mx-auto h-12 w-12 transition-all duration-200 ${
                      isDragging || isHovering ? 'text-tech-blue transform scale-105' : 'text-gray-400'
                    }`}
                  />
                  <div>
                    <p className="text-lg font-medium text-deep-navy">
                      Arraste áudio aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Formatos aceitos: MP3, WAV, M4A, WebM (máximo 2GB)
                    </p>
                  </div>
                </div>
              )}

              {selectedFile && uploadStatus === 'idle' && (
                <div className="space-y-4">
                  <IconHeadphones className="mx-auto h-12 w-12 text-tech-blue" />
                  <div>
                    <p className="text-lg font-medium text-deep-navy">{selectedFile.name}</p>
                    <Badge variant="secondary" className="mt-2">
                      {formatFileSize(selectedFile.size)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                  >
                    <IconX className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              )}

              {uploadStatus === 'uploading' && (
                <div className="space-y-4">
                  <Loader2 className="mx-auto h-12 w-12 text-tech-blue animate-spin" />
                  <div className="w-full">
                    <p className="text-lg font-medium text-deep-navy mb-3">Enviando...</p>
                    <UploadProgressBar
                      progress={uploadProgress}
                      uploadSpeed={uploadSpeed}
                      timeRemaining={timeRemaining}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelUpload();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {uploadStatus === 'completed' && (
                <div className="space-y-4">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <p className="text-lg font-medium text-deep-navy">Upload concluído!</p>
                  <p className="text-sm text-muted-foreground">Redirecionando...</p>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* Error Card - shown on upload failure (outside dropzone) */}
        {uploadStatus === 'error' && (
          <UploadErrorCard
            className="mt-6"
            errorType={errorType}
            onRetry={() => {
              setUploadStatus('idle');
              setUploadProgress(0);
              // If we have the file, retry upload directly
              if (selectedFile) {
                form.handleSubmit(handleUpload)();
              }
            }}
            onChooseAnother={() => {
              setUploadStatus('idle');
              setUploadProgress(0);
              handleRemoveFile();
            }}
            onManualEntry={() => {
              // Navigate to manual entry tab (future: use proper navigation callback)
              // TODO: Replace with onNavigateToManual callback from parent component
              const manualTab = document.querySelector('[value="manual"]') as HTMLElement;
              if (manualTab) {
                manualTab.click();
              } else {
                console.warn('Manual tab not found - navigation failed');
              }
            }}
          />
        )}

        {/* Processing Status - shown during upload/transcription/analysis */}
        {(uploadStatus === 'uploading' || uploadStatus === 'transcribing' || uploadStatus === 'analyzing' || uploadStatus === 'completed') && (
          <div className="mt-6">
            <ProcessingStatus currentStep={getCurrentStep(uploadStatus)} />

            {/* ARIA live region for screen readers */}
            <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
              {uploadStatus === 'uploading' && `Enviando ${uploadProgress}%`}
              {uploadStatus === 'transcribing' && 'Transcrevendo áudio...'}
              {uploadStatus === 'analyzing' && 'Analisando conteúdo...'}
              {uploadStatus === 'completed' && 'Upload concluído com sucesso!'}
            </div>
          </div>
        )}

        {/* Submit button */}
        {uploadStatus === 'idle' && (
          <Button
            type="submit"
            className="w-full h-11"
            disabled={!isFormValid}
          >
            Iniciar Upload
          </Button>
        )}
      </form>
    </Form>
  );
}

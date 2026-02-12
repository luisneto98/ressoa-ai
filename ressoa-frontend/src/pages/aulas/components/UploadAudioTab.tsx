import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as tus from 'tus-js-client';
import { toast } from 'sonner';
import { Headphones, X, Upload, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AulaFormFields, commonFormSchema } from './AulaFormFields';
import { createAula } from '@/api/aulas';
import { useAuthStore } from '@/stores/auth.store';
import {
  formatUploadSpeed,
  formatTimeRemaining,
  formatFileSize,
  isValidAudioFormat,
  isValidFileSize,
} from '@/lib/upload-utils';

// Form schema for upload audio tab
const uploadAudioSchema = commonFormSchema.extend({});
type UploadAudioFormData = z.infer<typeof uploadAudioSchema>;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

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

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Track upload speed calculation
  const uploadTrackingRef = useRef({
    startTime: 0,
    previousBytes: 0,
    previousTime: 0,
  });

  // Navigation guard: Warn user if upload in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadStatus === 'uploading') {
        e.preventDefault();
        e.returnValue = 'Upload em andamento. Deseja cancelar?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadStatus]);

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
        endpoint: `${import.meta.env.VITE_API_URL}/api/v1/uploads`,
        metadata: {
          filename: selectedFile.name,
          filetype: selectedFile.type,
          aula_id: aula.id,
          escola_id: user.escola_id,
          professor_id: user.id,
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
          toast.error(`Erro no upload: ${error.message}`);
          setUploadStatus('error');
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
            setUploadSpeed(speed);

            const remaining = (bytesTotal - bytesUploaded) / speed;
            setTimeRemaining(remaining);

            uploadTrackingRef.current.previousBytes = bytesUploaded;
            uploadTrackingRef.current.previousTime = currentTime;
          }
        },
        onSuccess: () => {
          toast.success('Upload concluído! Transcrição em andamento...');
          setUploadStatus('success');

          // Reset tracking
          uploadTrackingRef.current = {
            startTime: 0,
            previousBytes: 0,
            previousTime: 0,
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
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-cyan-ai bg-cyan-ai/10' : 'border-gray-300 hover:border-tech-blue'}
                ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              // eslint-disable-next-line react-hooks/refs
              onClick={() => uploadStatus === 'idle' && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Área de upload de áudio. Arraste arquivo ou pressione Enter para selecionar"
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && uploadStatus === 'idle') {
                  e.preventDefault();
                  // eslint-disable-next-line react-hooks/refs
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
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
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
                  <Headphones className="mx-auto h-12 w-12 text-tech-blue" />
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
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              )}

              {uploadStatus === 'uploading' && (
                <div className="space-y-4">
                  <Loader2 className="mx-auto h-12 w-12 text-tech-blue animate-spin" />
                  <div>
                    <p className="text-lg font-medium text-deep-navy">
                      Enviando: {uploadProgress}%
                    </p>
                    <Progress value={uploadProgress} className="mt-2 h-2" />
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {uploadSpeed > 0 && <p>{formatUploadSpeed(uploadSpeed)}</p>}
                      {timeRemaining !== null && timeRemaining > 0 && (
                        <p>{formatTimeRemaining(timeRemaining)} restantes</p>
                      )}
                    </div>
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

              {uploadStatus === 'success' && (
                <div className="space-y-4">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <p className="text-lg font-medium text-deep-navy">Upload concluído!</p>
                  <p className="text-sm text-muted-foreground">Redirecionando...</p>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="space-y-4">
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <p className="text-lg font-medium text-deep-navy">
                    Erro no upload. Tente novamente.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadStatus('idle');
                      setUploadProgress(0);
                    }}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

// Formatar velocidade de upload
export const formatUploadSpeed = (bytesPerSecond: number): string => {
  const mbps = bytesPerSecond / (1024 * 1024);
  if (mbps < 1) {
    const kbps = bytesPerSecond / 1024;
    return `${kbps.toFixed(1)} KB/s`;
  }
  return `${mbps.toFixed(2)} MB/s`;
};

// Formatar tempo restante
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `~${minutes} minuto${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  return `~${hours}h ${minutes % 60}min`;
};

// Calcular velocidade de upload (média móvel)
export const calculateUploadSpeed = (
  bytesUploaded: number,
  _startTime: number,
  previousBytes: number,
  previousTime: number
): number => {
  const currentTime = Date.now();
  const deltaBytes = bytesUploaded - previousBytes;
  const deltaTime = (currentTime - previousTime) / 1000; // seconds

  if (deltaTime === 0) return 0;
  return deltaBytes / deltaTime;
};

// Formatar tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  }
  return `${mb.toFixed(2)} MB`;
};

// Validar formato de áudio
export const isValidAudioFormat = (file: File): boolean => {
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/webm', 'audio/mp4'];
  return allowedTypes.includes(file.type);
};

// Validar tamanho máximo (2GB)
export const isValidFileSize = (file: File, maxSizeBytes = 2 * 1024 * 1024 * 1024): boolean => {
  return file.size > 0 && file.size <= maxSizeBytes;
};

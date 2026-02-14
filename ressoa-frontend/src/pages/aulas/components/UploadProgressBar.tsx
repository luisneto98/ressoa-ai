import * as React from 'react';
import { cn } from '@/lib/utils';

export interface UploadProgressBarProps extends React.ComponentProps<'div'> {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Upload speed in bytes/second (optional) */
  uploadSpeed?: number;
  /** Estimated time remaining in seconds (optional) */
  timeRemaining?: number | null;
}

/**
 * UploadProgressBar - Gradient animated progress bar for file uploads
 *
 * Features:
 * - Animated gradient (Tech Blue → Cyan AI → Tech Blue)
 * - Percentage display
 * - Optional time remaining estimate (shown only if >30s)
 * - Smooth transitions
 * - Respects prefers-reduced-motion
 *
 * @example
 * <UploadProgressBar progress={45} uploadSpeed={5242880} timeRemaining={120} />
 */
export function UploadProgressBar({
  className,
  progress,
  uploadSpeed,
  timeRemaining,
  ...props
}: UploadProgressBarProps) {
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `~${Math.ceil(seconds)}s`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  const formatUploadSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    }
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const showTimeRemaining = timeRemaining !== null && timeRemaining !== undefined && timeRemaining > 30;

  return (
    <div className={cn('w-full space-y-2', className)} {...props}>
      {/* Progress bar container */}
      <div className="flex items-center gap-3">
        {/* Animated gradient bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-tech-blue via-cyan-ai to-tech-blue animate-gradient-x transition-all duration-200"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundSize: '200% 100%',
            }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Percentage text */}
        <span className="ml-3 text-sm font-medium text-gray-700 whitespace-nowrap min-w-[3ch]">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Upload metadata (speed and time remaining) */}
      {(uploadSpeed || showTimeRemaining) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500">
          {uploadSpeed && uploadSpeed > 0 && (
            <span>{formatUploadSpeed(uploadSpeed)}</span>
          )}
          {showTimeRemaining && (
            <span className="sm:before:content-['•'] sm:before:mr-3">
              {formatTimeRemaining(timeRemaining!)} restantes
            </span>
          )}
        </div>
      )}
    </div>
  );
}

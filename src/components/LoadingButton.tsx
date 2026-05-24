import React, { useState, useCallback } from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Duration in ms before loading state auto-resets. Default: 1500ms */
  loadingDuration?: number;
  /** Content shown while loading. Defaults to a spinner. */
  loadingContent?: React.ReactNode;
  /** Wrap an async onClick — button stays loading until the promise resolves */
  onClickAsync?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  /** External loading state */
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Drop-in replacement for <button>.
 * Shows a spinner on click, then restores normal state automatically.
 *
 * Usage (sync, auto-reset after 1.5s):
 *   <LoadingButton onClick={handler}>Add to Cart</LoadingButton>
 *
 * Usage (async, stays loading until promise resolves):
 *   <LoadingButton onClickAsync={asyncHandler}>Pay Now</LoadingButton>
 */
export function LoadingButton({
  children,
  className = '',
  loadingDuration = 1500,
  loadingContent,
  onClickAsync,
  onClick,
  disabled,
  loading: externalLoading,
  ...rest
}: LoadingButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading) return;
      if (externalLoading === undefined) setInternalLoading(true);

      if (onClickAsync) {
        try {
          await onClickAsync(e);
        } finally {
          if (externalLoading === undefined) setInternalLoading(false);
        }
      } else {
        onClick?.(e);
        if (externalLoading === undefined) {
          setTimeout(() => setInternalLoading(false), loadingDuration);
        }
      }
    },
    [loading, externalLoading, onClick, onClickAsync, loadingDuration]
  );

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`relative overflow-hidden transition-all ${className} ${loading ? 'cursor-not-allowed opacity-90' : ''}`}
    >
      {/* Spinner overlay */}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${loading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {loadingContent ?? (
          <span className="flex items-center gap-2">
            <Spinner />
          </span>
        )}
      </span>

      {/* Original content fades out while loading */}
      <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
}

/** Inline animated SVG spinner — no extra deps */
function Spinner({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export default LoadingButton;

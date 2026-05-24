import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  link?: { label: string; href: string };
  exiting: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, link?: { label: string; href: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    // Mark as exiting to trigger slide-out
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove from DOM after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 420);
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'success',
    link?: { label: string; href: string }
  ) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, link, exiting: false }]);
    // Auto-dismiss after 3 seconds
    setTimeout(() => dismiss(id), 3000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ─── Toast Container (renders portal-like at root) ─── */
const TYPE_CONFIG = {
  success: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-orange-500',
    border: 'border-orange-400',
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
};

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      style={{ maxWidth: '380px', width: 'calc(100vw - 48px)' }}
    >
      {toasts.map(toast => {
        const cfg = TYPE_CONFIG[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 text-white shadow-2xl border
              ${cfg.bg} ${cfg.border}
              transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${toast.exiting
                ? 'translate-x-[120%] opacity-0'
                : 'translate-x-0 opacity-100'
              }
            `}
          >
            {/* Icon */}
            <span className="mt-0.5">{cfg.icon}</span>

            {/* Message */}
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>

            {/* Optional link */}
            {toast.link && (
              <a
                href={toast.link.href}
                className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap opacity-90 hover:opacity-100 transition-opacity"
              >
                {toast.link.label}
              </a>
            )}

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-1 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

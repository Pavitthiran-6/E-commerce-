import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  href: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType, action?: ToastAction) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, action }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500 mt-0.5" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-orange-500';
      case 'info': return 'border-blue-500';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`flex items-start gap-3 bg-white border-l-4 ${getBorderColor(toast.type)} shadow-lg rounded-r-lg p-4 min-w-[300px] max-w-sm animate-slide-in-right`}
          >
            {getIcon(toast.type)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{toast.message}</p>
              {toast.action && (
                <Link 
                  to={toast.action.href} 
                  className="inline-block mt-1 text-xs font-semibold text-amber-600 hover:text-amber-800 underline transition-colors"
                >
                  {toast.action.label}
                </Link>
              )}
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition-colors self-start mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

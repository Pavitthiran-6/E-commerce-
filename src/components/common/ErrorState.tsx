import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Something went wrong. Please try again.', 
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 ${className}`}>
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Oops! Error occurred</h3>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;

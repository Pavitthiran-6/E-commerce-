import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-2xl border border-gray-100 ${className}`}>
      {icon && (
        <div className="w-20 h-20 bg-white text-gray-400 rounded-full flex items-center justify-center shadow-sm mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      {message && <p className="text-gray-500 mb-8 max-w-md">{message}</p>}
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

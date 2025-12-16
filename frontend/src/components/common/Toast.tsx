import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);
  }, []);

  return (
    <div
      className={`flex items-center bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80 transform transition-all z-50 duration-300 ease-in-out ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
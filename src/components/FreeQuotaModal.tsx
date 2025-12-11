import React from 'react';

interface FreeQuotaModalProps {
  onClose: () => void;
}

const FreeQuotaModal: React.FC<FreeQuotaModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-5">
        <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
          무료 제공 소진 안내
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          무료 제공분이 모두 소진되었습니다.<br/>
          이후부터는 건당 요금이 부과됩니다.
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default FreeQuotaModal;


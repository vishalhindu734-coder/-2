import React, { useState } from 'react';
import { ICON_LIST, LucideIcon } from '../icons';
import { Search, X } from 'lucide-react';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  onClose: () => void;
  currentIcon?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose, currentIcon }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = ICON_LIST.filter(icon => 
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] p-6 space-y-6 shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[80vh]">
        <header className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold dark:text-white">आइकॉन चुनें</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            autoFocus
            type="text" 
            placeholder="खोजें..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 dark:text-white p-4 pl-12 rounded-2xl border dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 p-2">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                onClick={() => onSelect(iconName)}
                className={`
                  aspect-square flex items-center justify-center rounded-2xl transition-all active:scale-90
                  ${currentIcon === iconName 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700'}
                `}
              >
                <LucideIcon name={iconName} size={24} />
                <span className="sr-only">{iconName}</span>
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium">कोई आइकॉन नहीं मिला</div>
          )}
        </div>
      </div>
    </div>
  );
};

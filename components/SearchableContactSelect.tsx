import React, { useState, useRef, useEffect } from 'react';
import { Contact } from '../types';

interface SearchableContactSelectProps {
  contacts: Contact[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export const SearchableContactSelect: React.FC<SearchableContactSelectProps> = ({ contacts, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find(c => c.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = search
    ? contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search)))
    : contacts.slice(0, 50);

  return (
    <div className="relative w-full sm:w-64" ref={containerRef}>
      <button
        type="button"
        className="px-3 py-2 border rounded-lg bg-white text-sm font-medium w-full text-left outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px]"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
      >
        <div className="truncate">{selectedContact ? `${selectedContact.name} ${selectedContact.phone ? '('+selectedContact.phone+')' : ''}` : '-- No Contact --'}</div>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl flex flex-col" style={{ maxHeight: '300px' }}>
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full px-2 py-1.5 bg-gray-50 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 h-[250px] max-h-[250px] pb-2 shadow-inner">
            <div
              className={`px-3 py-2 cursor-pointer text-sm text-gray-500 hover:bg-gray-100 ${!value ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              -- No Contact --
            </div>
            {filtered.map(c => {
              const isSelected = c.id === value;
              return (
                <div
                  key={c.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 border-t ${isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : ''}`}
                  onClick={() => {
                    onChange(c.id);
                    setIsOpen(false);
                  }}
                >
                  <div className="text-sm truncate font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500 truncate mt-0.5 font-sans">
                    {[c.phone, c.volunteerProfile?.currentResponsibility].filter(Boolean).join(' • ')}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
               <div className="px-3 py-4 text-center text-sm text-gray-500">No matches found.</div>
            )}
            {!search && contacts.length > 50 && (
               <div className="px-3 py-2 border-t text-xs text-center text-gray-400 italic">Type to search more contacts...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

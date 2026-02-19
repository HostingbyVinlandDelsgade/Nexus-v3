import React, { useState } from 'react';
import { Search, Check, Building2, User, Phone } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import Modal from '../ui/Modal';

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplierId: string) => void;
  selectedId: string;
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({ isOpen, onClose, onSelect, selectedId }) => {
  const { suppliers } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Supplier" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search suppliers by name or contact person..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Supplier List */}
        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No suppliers found.
            </div>
          ) : (
            filteredSuppliers.map((supplier) => {
              const isSelected = selectedId === supplier.id;
              return (
                <button
                  key={supplier.id}
                  onClick={() => {
                    onSelect(supplier.id);
                    onClose();
                  }}
                  className={`flex items-start justify-between p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-gray-100 hover:border-indigo-200 bg-white'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={18} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                      <h3 className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {supplier.name}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-1.5">
                        <User size={14} />
                        <span>{supplier.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} />
                        <span>{supplier.phone}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2 truncate">
                        {supplier.address}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="bg-indigo-600 text-white p-1 rounded-full">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SupplierSelectionModal;
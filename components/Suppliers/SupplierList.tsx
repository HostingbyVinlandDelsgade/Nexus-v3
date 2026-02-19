import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Supplier, MovementType } from '../../types';
import { Plus, Building2, Phone, Mail, MapPin, Search, Edit2, Eye, CircleDot, DollarSign, Package } from 'lucide-react';
import Modal from '../ui/Modal';

const SupplierList: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, items, movements } = useInventory();
  
  // State for List View
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Form Modal (Add/Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Supplier>>({ status: 'Active' });

  // State for Details Modal (View)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | undefined>(undefined);

  // --- Form Handlers ---
  const handleOpenAdd = () => {
    setEditingSupplier(undefined);
    setFormData({ status: 'Active' });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData as Omit<Supplier, 'id'>);
    }
    setIsFormModalOpen(false);
  };

  // --- View Details Logic ---
  const handleOpenView = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setIsViewModalOpen(true);
  };

  // Get Items provided by this supplier
  const supplierItems = viewingSupplier 
    ? items.filter(i => i.supplierId === viewingSupplier.id) 
    : [];

  // Get Transaction History (Inbound movements for items from this supplier)
  const supplierTransactions = viewingSupplier
    ? movements
        .filter(m => {
             const item = items.find(i => i.id === m.itemId);
             // We check if the item currently belongs to supplier, and if movement is IN (Purchase)
             // Note: In a complex system, movements would snapshot the supplier at the time.
             return item?.supplierId === viewingSupplier.id && m.type === MovementType.IN;
        })
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const totalValueSupplied = supplierItems.reduce((acc, curr) => acc + (curr.quantity * curr.wholesalePrice), 0);

  // --- Filtering ---
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Suppliers</h2>
        
        <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
            >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Supplier</span>
            <span className="sm:hidden">Add</span>
            </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No suppliers found matching your search.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        supplier.status === 'Active' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                        <CircleDot size={8} className={supplier.status === 'Active' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'} />
                        {supplier.status || 'Active'}
                    </span>
                </div>

                <div className="flex items-center gap-3 mb-4 pr-16">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 truncate">{supplier.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{supplier.contactPerson}</p>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <a href={`mailto:${supplier.email}`} className="hover:text-indigo-600 transition-colors truncate">{supplier.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 h-10 overflow-hidden">
                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-50">
                    <button 
                        onClick={() => handleOpenView(supplier)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                        <Eye size={16} />
                        View
                    </button>
                    <button 
                        onClick={() => handleOpenEdit(supplier)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-sm font-medium"
                    >
                        <Edit2 size={16} />
                        Edit
                    </button>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* --- ADD / EDIT MODAL --- */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex justify-between gap-4">
             <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
             </div>
             <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    value={formData.status || 'Active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
             </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.contactPerson || ''}
              onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                required
                type="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW DETAILS MODAL --- */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={viewingSupplier?.name || 'Supplier Details'}
        maxWidth="max-w-4xl"
      >
        {viewingSupplier && (
            <div className="flex flex-col h-[600px] overflow-hidden">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-1">
                            <Package size={14} />
                            Items Supplied
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{supplierItems.length}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                         <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-1">
                            <DollarSign size={14} />
                            Current Asset Value
                        </div>
                        <div className="text-2xl font-bold text-green-600">₱{totalValueSupplied.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-1">
                            <CircleDot size={14} />
                            Status
                        </div>
                        <div className={`text-lg font-bold ${viewingSupplier.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                            {viewingSupplier.status || 'Active'}
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden min-h-0">
                    {/* Left Col: Contact Info & Items */}
                    <div className="flex flex-col gap-6 overflow-y-auto pr-2">
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Building2 size={16} className="text-indigo-600"/> Contact Information
                            </h4>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-400">Contact:</span>
                                    <span className="col-span-2 font-medium">{viewingSupplier.contactPerson}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-400">Email:</span>
                                    <span className="col-span-2">{viewingSupplier.email}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-400">Phone:</span>
                                    <span className="col-span-2">{viewingSupplier.phone}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-gray-400">Address:</span>
                                    <span className="col-span-2">{viewingSupplier.address}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Supplied Items</h4>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2">Item</th>
                                            <th className="px-3 py-2 text-right">Cost</th>
                                            <th className="px-3 py-2 text-center">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {supplierItems.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-2">
                                                    <div className="font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500">{item.sku}</div>
                                                </td>
                                                <td className="px-3 py-2 text-right">₱{item.wholesalePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td className="px-3 py-2 text-center">{item.quantity}</td>
                                            </tr>
                                        ))}
                                        {supplierItems.length === 0 && (
                                            <tr><td colSpan={3} className="p-4 text-center text-gray-400">No items linked.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Transaction History */}
                    <div className="flex flex-col overflow-hidden">
                        <h4 className="font-semibold text-gray-800 mb-3">Recent Purchase History</h4>
                         <div className="flex-1 border border-gray-200 rounded-lg overflow-y-auto bg-gray-50/30">
                            {supplierTransactions.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No inbound transactions found for this supplier.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {supplierTransactions.map(t => {
                                        const item = items.find(i => i.id === t.itemId);
                                        return (
                                            <div key={t.id} className="p-3 hover:bg-white transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</span>
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+ {t.quantity}</span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">{item?.name || 'Unknown Item'}</div>
                                                <div className="text-xs text-gray-500">{t.reason}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        )}
      </Modal>

    </div>
  );
};

export default SupplierList;
import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { InventoryItem } from '../../types';
import { Plus, Edit2, Trash2, Search, Filter, AlertCircle, TrendingUp, TrendingDown, Minus, Activity, Image as ImageIcon, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import ItemForm from './ItemForm';

const InventoryList: React.FC = () => {
  const { items, deleteItem, getSupplierName, categories } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterSpeed, setFilterSpeed] = useState<string>('All');
  
  // State for Image Preview Gallery
  const [viewingGallery, setViewingGallery] = useState<{name: string, images: string[]} | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesSpeed = filterSpeed === 'All' || item.movementSpeed === filterSpeed;
    
    return matchesSearch && matchesCategory && matchesSpeed;
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
    }
  };

  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleViewImages = (item: InventoryItem) => {
      // Determine list of images
      const images = (item.images && item.images.length > 0) 
        ? item.images 
        : (item.imageUrl ? [item.imageUrl] : []);
      
      if (images.length > 0) {
          setViewingGallery({ name: item.name, images });
          setCurrentImageIndex(0);
      }
  };

  const nextImage = () => {
      if (!viewingGallery) return;
      setCurrentImageIndex((prev) => (prev + 1) % viewingGallery.images.length);
  };

  const prevImage = () => {
      if (!viewingGallery) return;
      setCurrentImageIndex((prev) => (prev - 1 + viewingGallery.images.length) % viewingGallery.images.length);
  };

  const getSpeedBadge = (speed: string) => {
    switch (speed) {
        case 'Fast': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"><TrendingUp size={12}/> Fast</span>;
        case 'Slow': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800"><TrendingDown size={12}/> Slow</span>;
        default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"><Minus size={12}/> Normal</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Inventory Items
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer min-w-[140px]"
             >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          {/* Speed Filter */}
          <div className="relative">
             <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <select
                value={filterSpeed}
                onChange={(e) => setFilterSpeed(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white cursor-pointer min-w-[140px]"
             >
                <option value="All">All Speeds</option>
                <option value="Fast">Fast Moving</option>
                <option value="Normal">Normal</option>
                <option value="Slow">Slow Moving</option>
             </select>
          </div>

          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Speed</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4 text-right">Unit Cost</th>
              <th className="px-6 py-4 text-right">Wholesale</th>
              <th className="px-6 py-4 text-right">Retail</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredItems.length === 0 ? (
                <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No items found matching your search.
                    </td>
                </tr>
            ) : filteredItems.map((item) => {
              const isLowStock = item.quantity <= item.minStockLevel;
              const hasImages = (item.images && item.images.length > 0) || item.imageUrl;
              const displayImage = (item.images && item.images.length > 0) ? item.images[0] : item.imageUrl;

              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                      <div 
                        className={`group/img relative w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 ${hasImages ? 'cursor-pointer' : ''}`}
                        onClick={() => hasImages && handleViewImages(item)}
                      >
                          {displayImage ? (
                              <>
                                <img 
                                    src={displayImage} 
                                    alt="" 
                                    className={`w-full h-full ${item.imageFit === 'contain' ? 'object-contain p-0.5' : 'object-cover'}`} 
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <Eye size={16} className="text-white" />
                                </div>
                              </>
                          ) : (
                              <ImageIcon size={16} className="text-gray-300" />
                          )}
                      </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getSpeedBadge(item.movementSpeed)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                        <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{item.costUnit || 'pcs'}</span>
                        {isLowStock && (
                            <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium mt-1">
                                <AlertCircle size={10} /> Low Stock
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-500 text-sm">
                    ₱{(item.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600 text-sm">
                    ₱{item.wholesalePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-green-600 text-sm">
                    ₱{item.retailPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getSupplierName(item.supplierId)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Item Details' : 'Add New Item'}
      >
        <ItemForm initialData={editingItem} onClose={() => setIsModalOpen(false)} />
      </Modal>

      {/* Image Preview Carousel Modal */}
      <Modal 
        isOpen={!!viewingGallery} 
        onClose={() => setViewingGallery(null)}
        title={viewingGallery?.name || 'Product Image'}
        maxWidth="max-w-xl"
      >
        <div className="relative flex flex-col items-center">
            <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg p-2 overflow-hidden relative" style={{ minHeight: '300px' }}>
                {viewingGallery && viewingGallery.images.length > 0 && (
                    <img 
                        src={viewingGallery.images[currentImageIndex]} 
                        alt={`View ${currentImageIndex + 1}`} 
                        className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm transition-opacity duration-200" 
                    />
                )}
                
                {/* Carousel Controls */}
                {viewingGallery && viewingGallery.images.length > 1 && (
                    <>
                        <button 
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-md transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>
            
            {/* Dots / Counter */}
            {viewingGallery && viewingGallery.images.length > 1 && (
                <div className="flex gap-2 mt-4">
                    {viewingGallery.images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                idx === currentImageIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        />
                    ))}
                </div>
            )}
            
            <div className="w-full mt-4 flex justify-end">
                <button
                    onClick={() => setViewingGallery(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryList;
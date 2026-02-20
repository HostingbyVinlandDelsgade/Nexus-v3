import React, { useState, useEffect } from 'react';
import { InventoryItem, MovementType } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { Search, Loader2, Sparkles, Save, History, Box, ArrowRightLeft, Settings, Plus, Trash2, ChevronLeft, Image as ImageIcon, ExternalLink, X, Upload } from 'lucide-react';
import SupplierSelectionModal from '../Suppliers/SupplierSelectionModal';
import { generateItemDescription } from '../../services/geminiService';

interface ItemFormProps {
  initialData?: InventoryItem;
  onClose: () => void;
}

// Helper to safely convert string input to number or undefined
const toNumber = (val: string): number => {
  if (val === '') return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// Helper to convert Google Drive viewer links to direct image links
const processImageUrl = (url: string) => {
    if (!url) return '';
    // Handle Google Drive Links
    // Ex: https://drive.google.com/file/d/14zOncXzjQ8SrBj_UCzPK9srJOKqsf4bp/view?usp=drivesdk
    if (url.includes('drive.google.com') && url.includes('/d/')) {
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            // Use the thumbnail API which is reliable for embedding high-res images
            return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
        }
    }
    return url;
};

const ItemForm: React.FC = ({ initialData, onClose }: ItemFormProps) => {
  const { addItem, updateItem, getSupplierName, addMovement, movements, categories, addCategory, deleteCategory } = useInventory();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'stock'>('details');
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isManagingImages, setIsManagingImages] = useState(false);
  
  // Local state for form fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costUnit, setCostUnit] = useState('pcs');
  const [quantity, setQuantity] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [movementSpeed, setMovementSpeed] = useState<'Fast' | 'Normal' | 'Slow'>('Normal');
  const [supplierId, setSupplierId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // Multiple Images State
  const [images, setImages] = useState<string[]>(['']);

  // Stock Adjustment State
  const [adjType, setAdjType] = useState<MovementType>(MovementType.IN);
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Category Management Input
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setSku(initialData.sku);
      setName(initialData.name);
      setCategory(initialData.category);
      setCostUnit(initialData.costUnit || 'pcs');
      setQuantity(initialData.quantity.toString());
      setMinStockLevel(initialData.minStockLevel.toString());
      setUnitCost(initialData.unitCost?.toString() || '0');
      setWholesalePrice(initialData.wholesalePrice.toString());
      setRetailPrice(initialData.retailPrice.toString());
      setMovementSpeed(initialData.movementSpeed);
      setSupplierId(initialData.supplierId);
      setLocation(initialData.location);
      setDescription(initialData.description);
      
      // Initialize images
      if (initialData.images && initialData.images.length > 0) {
        setImages(initialData.images);
      } else if (initialData.imageUrl) {
        setImages([processImageUrl(initialData.imageUrl)]);
      } else {
        setImages(['']);
      }
    } else {
      // Defaults for new item
      setQuantity('0');
      setMinStockLevel('5');
      setCostUnit('pcs');
      setImages(['']);
      if (categories.length > 0) setCategory(categories[0]);
    }
  }, [initialData, categories]);

  // Ensure category is valid if categories change
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
        setCategory(categories[0]);
    }
  }, [categories, category]);

  // Handle Main Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !supplierId) {
      alert("Please fill in all required fields (Name, SKU, Supplier)");
      return;
    }

    // Filter out empty image strings
    const validImages = images.filter(img => img.trim() !== '');

    const itemData = {
      sku,
      name,
      category: category || 'General',
      costUnit,
      quantity: toNumber(quantity),
      minStockLevel: toNumber(minStockLevel),
      unitCost: toNumber(unitCost),
      wholesalePrice: toNumber(wholesalePrice),
      retailPrice: toNumber(retailPrice),
      movementSpeed,
      supplierId,
      location,
      description,
      imageUrl: validImages[0] || '', // Primary image for backward compatibility
      images: validImages, // Store all images
    };

    if (initialData && initialData.id) {
      updateItem(initialData.id, itemData);
    } else {
      addItem(itemData);
    }
    onClose();
  };

  const handleImageChange = (index: number, value: string) => {
    const processedUrl = processImageUrl(value);
    const newImages = [...images];
    newImages[index] = processedUrl;
    setImages(newImages);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Add to images
        // If the last image is empty, replace it, otherwise append
        const newImages = [...images];
        if (newImages.length > 0 && newImages[newImages.length - 1] === '') {
            newImages[newImages.length - 1] = base64String;
        } else {
            newImages.push(base64String);
        }
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages.length > 0 ? newImages : ['']);
  };

  // Handle Stock Adjustment Submit
  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData?.id) return;
    
    const qty = toNumber(adjQuantity);
    if (qty <= 0) {
        alert("Quantity must be greater than 0");
        return;
    }

    addMovement({
        itemId: initialData.id,
        type: adjType,
        quantity: qty,
        reason: adjReason || 'Manual Adjustment'
    });

    // Reset Adjustment Form
    setAdjQuantity('');
    setAdjReason('');
    alert("Stock updated successfully!");
    onClose(); 
  };

  const handleGenerateDescription = async () => {
    if (!name) return;
    setIsGeneratingDesc(true);
    const desc = await generateItemDescription(name, category);
    setDescription(desc);
    setIsGeneratingDesc(false);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
        addCategory(newCategoryName.trim());
        setNewCategoryName('');
    }
  };

  // Filter movements for this item
  const itemMovements = initialData ? movements.filter(m => m.itemId === initialData.id) : [];

  // --- RENDER: Category Management View ---
  if (isManagingCategories) {
      return (
          <div className="flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <button onClick={() => setIsManagingCategories(false)} className="p-1 hover:bg-gray-100 rounded-full">
                      <ChevronLeft size={20} />
                  </button>
                  <h3 className="font-bold text-lg text-gray-800">Manage Categories</h3>
              </div>
              
              <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      <Plus size={18} /> Add
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                  <div className="space-y-2">
                      {categories.map(cat => (
                          <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                              <span className="font-medium text-gray-700">{cat}</span>
                              <button 
                                onClick={() => { if(confirm(`Delete category "${cat}"?`)) deleteCategory(cat); }}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // --- RENDER: Image Management View ---
  if (isManagingImages) {
    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <button onClick={() => setIsManagingImages(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Manage Images</h3>
                    <p className="text-xs text-gray-500">Add or remove product image URLs</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                             <div className="flex gap-3 items-start">
                                 <div className="flex-1 space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Image {idx + 1} {idx === 0 ? '(Primary)' : ''}</label>
                                        <button 
                                            type="button" 
                                            onClick={() => removeImageField(idx)} 
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            title="Remove image"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <input 
                                        type="url"
                                        value={img}
                                        onChange={(e) => handleImageChange(idx, e.target.value)}
                                        placeholder={idx === 0 ? "Primary Image URL (e.g. Google Drive)" : "Additional Image URL"}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        autoFocus={idx === images.length - 1 && img === ''} 
                                    />
                                    {idx === 0 && (
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <ExternalLink size={10} /> Supports Google Drive links (Ensure "Anyone with the link" is ON)
                                        </p>
                                    )}
                                    {/* Preview Area Inside Input Card */}
                                    {img && (
                                        <div className="mt-2 h-32 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                                            <img src={img} alt="Preview" className="h-full w-full object-contain" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                        </div>
                                    )}
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-2 mt-4">
                    <button 
                        type="button" 
                        onClick={addImageField} 
                        className="flex-1 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add URL
                    </button>
                    <label className="flex-1 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        <Upload size={18} /> Upload
                    </label>
                </div>
            </div>
            
            <div className="pt-4 mt-auto border-t border-gray-100">
                 <button 
                    onClick={() => setIsManagingImages(false)} 
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    );
  }

  // --- RENDER: Main Item Form ---
  return (
    <div className="flex flex-col h-auto max-h-[85vh]">
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-100 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'details' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Box size={18} />
          Item Details
        </button>
        <button
          type="button"
          disabled={!initialData}
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
            !initialData ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            activeTab === 'stock'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={18} />
          Stock Management
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {/* DETAILS TAB */}
        {activeTab === 'details' && (
            <form id="item-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
            <div className="grid grid-cols-2 gap-4">
                
                {/* Image URLs - Summary View */}
                <div className="col-span-2">
                    <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm font-medium text-gray-700">Product Images</label>
                        <button 
                            type="button"
                            onClick={() => setIsManagingImages(true)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                        >
                            <Settings size={14} /> Manage Images ({images.filter(i => i.trim()).length})
                        </button>
                    </div>
                    
                    {/* Horizontal Scroll of Previews */}
                    <div 
                        className="flex gap-3 overflow-x-auto py-3 px-3 bg-gray-50 rounded-xl border border-gray-200 min-h-[100px] items-center scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                    >
                        {images.filter(i => i.trim()).length > 0 ? (
                            images.filter(i => i.trim()).map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm group cursor-pointer" onClick={() => setIsManagingImages(true)}>
                                    <img src={img} alt={`Img ${idx}`} className="w-full h-full object-cover" />
                                    {idx === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5 font-medium">
                                            PRIMARY
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div 
                                onClick={() => setIsManagingImages(true)}
                                className="w-full flex flex-col items-center justify-center text-gray-400 gap-2 cursor-pointer hover:text-indigo-500 transition-colors py-2"
                            >
                                <div className="p-3 rounded-full bg-white border border-gray-200 shadow-sm">
                                    <ImageIcon size={24} />
                                </div>
                                <span className="text-xs font-medium">No images added yet. Click to manage.</span>
                            </div>
                        )}
                        
                        {images.filter(i => i.trim()).length > 0 && (
                             <button 
                                type="button"
                                onClick={() => setIsManagingImages(true)}
                                className="w-20 h-20 flex-shrink-0 bg-white rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            >
                                <Plus size={24} />
                                <span className="text-[10px] font-medium mt-1">Add</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Name */}
                <div className="col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Wireless Mouse"
                />
                </div>

                {/* SKU */}
                <div className="col-span-1 space-y-1">
                <label className="block text-sm font-medium text-gray-700">SKU *</label>
                <input
                    required
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. WM-001"
                />
                </div>

                {/* Category with Manage Button */}
                <div className="col-span-1 space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <button 
                            type="button"
                            onClick={() => setIsManagingCategories(true)}
                            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            <Settings size={12} />
                        </button>
                    </div>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Supplier Selection */}
                <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <div className={`w-full px-4 py-2 border rounded-lg flex items-center justify-between bg-gray-50 ${!supplierId ? 'text-gray-400' : 'text-gray-900'}`}>
                            <span className="truncate">
                                {supplierId 
                                    ? getSupplierName(supplierId) 
                                    : 'No supplier selected'}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsSupplierModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Search size={18} />
                        <span>Find</span>
                    </button>
                </div>
                </div>

                {/* BUYING SECTION */}
                <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <h3 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
                        Buying Information
                     </h3>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1 space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Unit Cost</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-sans">₱</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={unitCost}
                                    onChange={e => setUnitCost(e.target.value)}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="col-span-1 space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Unit Type</label>
                            <select
                                value={costUnit}
                                onChange={e => setCostUnit(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="pcs">pcs</option>
                                <option value="box">box</option>
                                <option value="sack">sack</option>
                                <option value="kg">kg</option>
                                <option value="pack">pack</option>
                                <option value="roll">roll</option>
                                <option value="unit">unit</option>
                                <option value="set">set</option>
                                <option value="pair">pair</option>
                                <option value="bundle">bundle</option>
                                <option value="can">can</option>
                                <option value="bottle">bottle</option>
                                <option value="liter">liter</option>
                                <option value="meter">meter</option>
                            </select>
                        </div>
                     </div>
                </div>

                {/* SELLING SECTION */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div className="col-span-1 space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Retail Price</label>
                        <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-sans">₱</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={retailPrice}
                                    onChange={e => setRetailPrice(e.target.value)}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                        </div>
                    </div>

                    <div className="col-span-1 space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Wholesale</label>
                        <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-sans">₱</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={wholesalePrice}
                                    onChange={e => setWholesalePrice(e.target.value)}
                                    className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                        </div>
                    </div>
                </div>

                {/* Min Stock */}
                 <div className="col-span-1 space-y-1">
                        <label className="block text-sm font-medium text-gray-700 truncate" title="Minimum Stock Level">Min Stock</label>
                        <input
                            type="number"
                            min="0"
                            value={minStockLevel}
                            onChange={e => setMinStockLevel(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                </div>
                
                {/* Quantity */}
                <div className="col-span-1 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Quantity 
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        disabled={!!initialData}
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${initialData ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                </div>

                 {/* Movement Speed */}
                 <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Movement Speed</label>
                    <select
                        value={movementSpeed}
                        onChange={e => setMovementSpeed(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="Fast">Fast Moving</option>
                        <option value="Normal">Normal</option>
                        <option value="Slow">Slow Moving</option>
                    </select>
                </div>

                <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">Location / Bin</label>
                    <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g. A-12, Warehouse 1"
                    />
                </div>
                
                {/* Description with AI Gen */}
                <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc || !name}
                            className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                        >
                            {isGeneratingDesc ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                            Generate with AI
                        </button>
                    </div>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

            </div>
            </form>
        )}

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
            <div className="space-y-8">
                {/* Stock Adjustment Card */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <ArrowRightLeft size={16} />
                        Update Stock Level
                    </h3>
                    <form onSubmit={handleStockAdjustment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                         <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                            <select 
                                value={adjType}
                                onChange={(e) => setAdjType(e.target.value as MovementType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value={MovementType.IN}>Restock (IN)</option>
                                <option value={MovementType.OUT}>Used / Sold (OUT)</option>
                                <option value={MovementType.ADJUSTMENT}>Correction (SET)</option>
                            </select>
                         </div>
                         <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity ({costUnit})</label>
                            <input 
                                type="number" 
                                min="1"
                                value={adjQuantity}
                                onChange={e => setAdjQuantity(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="0"
                            />
                         </div>
                         <div className="md:col-span-2">
                             <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={adjReason}
                                    onChange={e => setAdjReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                                    placeholder="e.g. Purchase Order #123"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium whitespace-nowrap"
                                >
                                    Update
                                </button>
                             </div>
                         </div>
                    </form>
                </div>

                {/* Stock History Table */}
                <div>
                     <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <History size={16} />
                        Stock History
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3 text-right">Change ({costUnit})</th>
                                    <th className="px-4 py-3">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {itemMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                            No movement history available.
                                        </td>
                                    </tr>
                                ) : (
                                    itemMovements.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
                                        <tr key={m.id}>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                {new Date(m.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    m.type === 'IN' ? 'bg-green-100 text-green-800' :
                                                    m.type === 'OUT' ? 'bg-red-100 text-red-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {m.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium">
                                                {m.type === 'OUT' ? '-' : '+'}{m.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {m.reason}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Footer / Actions - Only show Save for Details tab */}
      {activeTab === 'details' && (
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-auto">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="item-form"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
            >
                <Save size={18} />
                {initialData ? 'Update Details' : 'Save Item'}
            </button>
        </div>
      )}

      {/* Close button for Stock tab */}
      {activeTab === 'stock' && (
           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-auto">
            <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
                Close
            </button>
        </div>
      )}

      <SupplierSelectionModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSelect={(id) => setSupplierId(id)}
        selectedId={supplierId || ''}
      />
    </div>
  );
};

export default ItemForm;
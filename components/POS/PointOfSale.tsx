import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { InventoryItem, MovementType } from '../../types';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, Calculator, PackageX, Info, MapPin, Layers, Building2, Tag, Package, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import ReceiptModal from './ReceiptModal';

interface CartItem extends InventoryItem {
  cartQuantity: number;
  priceType: 'retail' | 'wholesale';
}

const PointOfSale: React.FC = () => {
  const { items, addMovement, addWalletTransaction, getSupplierName, categories, currentUser } = useInventory();
  
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
  
  // View Details Modal State
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Image Preview Gallery State
  const [previewGallery, setPreviewGallery] = useState<{name: string, images: string[]} | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Mobile View State
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    // Only show items with stock
    return matchesSearch && matchesCategory && item.quantity > 0;
  });

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.priceType === 'retail' ? item.retailPrice : item.wholesalePrice;
    return sum + (price * item.cartQuantity);
  }, 0);

  const receivedNum = parseFloat(amountReceived) || 0;
  const change = receivedNum - cartTotal;
  const canCheckout = cart.length > 0 && receivedNum >= cartTotal;

  // Handlers
  const addToCart = (item: InventoryItem, quantityToAdd: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // Check if adding exceeds stock
        const newTotal = existing.cartQuantity + quantityToAdd;
        if (newTotal > item.quantity) {
             // Cap at max stock
             return prev.map(i => i.id === item.id ? { ...i, cartQuantity: item.quantity } : i);
        }
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: newTotal } : i);
      }
      // New item
      const initialQty = Math.min(quantityToAdd, item.quantity);
      return [...prev, { ...item, cartQuantity: initialQty, priceType: 'retail' }]; // Default to Retail
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        // Validate against stock and minimum 1
        if (newQty > item.quantity) return item; 
        if (newQty < 1) return item;
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const handleCartInput = (id: string, val: string) => {
    const qty = parseInt(val);
    if(isNaN(qty) || qty < 1) return;
    
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const finalQty = Math.min(qty, item.quantity);
            return { ...item, cartQuantity: finalQty };
        }
        return item;
    }));
  };

  const togglePriceType = (id: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, priceType: item.priceType === 'retail' ? 'wholesale' : 'retail' };
      }
      return item;
    }));
  };

  const handleCheckout = () => {
    if (!canCheckout) return;

    // 1. Generate Consistent ID
    const transId = Math.random().toString(36).substr(2, 6).toUpperCase();

    // 2. Prepare Data for Receipt & History
    const receiptItems = cart.map(item => ({
        name: item.name,
        quantity: item.cartQuantity,
        price: item.priceType === 'retail' ? item.retailPrice : item.wholesalePrice,
        sku: item.sku
    }));

    const transactionData = {
        transactionId: transId,
        date: new Date().toISOString(),
        items: receiptItems,
        subtotal: cartTotal,
        total: cartTotal,
        cashReceived: receivedNum,
        change: change,
        cashier: currentUser ? currentUser.name : 'Unknown' // Dynamic Cashier Name
    };

    // 3. Process Stock Movements
    cart.forEach(cartItem => {
      addMovement({
        itemId: cartItem.id,
        type: MovementType.OUT,
        quantity: cartItem.cartQuantity,
        reason: `POS Sale - ${cartItem.priceType.toUpperCase()}`
      });
    });

    // 4. Process Wallet Transaction (Pass itemsSnapshot and CUSTOM ID)
    addWalletTransaction(
        cartTotal,
        'SALE',
        `POS Sale: ${cart.length} items`,
        receiptItems, // Items Snapshot
        transId // Custom ID linked to receipt
    );

    // 5. Update UI & Show Receipt
    setLastTransaction(transactionData);
    setShowReceipt(true);
    
    // Reset Cart
    setCart([]);
    setAmountReceived('');
    setIsCheckoutSuccess(true);
    setTimeout(() => setIsCheckoutSuccess(false), 3000);
    // Switch back to products view on mobile after successful checkout
    if (window.innerWidth < 1024) {
        setMobileView('products');
    }
  };

  const handleViewDetails = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    setViewingItem(item);
    setModalQuantity(1);
  };

  const handlePreviewImage = (e: React.MouseEvent, item: InventoryItem) => {
    e.stopPropagation();
    
    const images = (item.images && item.images.length > 0) 
        ? item.images 
        : (item.imageUrl ? [item.imageUrl] : []);

    if (images.length > 0) {
        setPreviewGallery({ name: item.name, images });
        setCurrentImageIndex(0);
    }
  };

  const nextImage = () => {
      if (!previewGallery) return;
      setCurrentImageIndex((prev) => (prev + 1) % previewGallery.images.length);
  };

  const prevImage = () => {
      if (!previewGallery) return;
      setCurrentImageIndex((prev) => (prev - 1 + previewGallery.images.length) % previewGallery.images.length);
  };

  const getItemCartQty = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    return item ? item.cartQuantity : 0;
  };

  const handleQuantityChange = (e: React.MouseEvent, item: InventoryItem, delta: number) => {
    e.stopPropagation();
    const currentQty = getItemCartQty(item.id);
    
    if (currentQty === 0 && delta > 0) {
        addToCart(item, 1);
    } else if (currentQty > 0) {
        if (currentQty + delta <= 0) {
            removeFromCart(item.id);
        } else {
            updateQuantity(item.id, delta);
        }
    }
  };

  const handleManualQuantityInput = (e: React.ChangeEvent<HTMLInputElement>, item: InventoryItem) => {
      const valStr = e.target.value;
      const currentQty = getItemCartQty(item.id);

      if (valStr === '') {
           if (currentQty > 0) removeFromCart(item.id);
           return;
      }
      
      const val = parseInt(valStr);
      if (isNaN(val)) return;
      
      if (val <= 0) {
          if (currentQty > 0) removeFromCart(item.id);
      } else {
          const newQty = Math.min(val, item.quantity);
          
          if (currentQty === 0) {
              addToCart(item, newQty);
          } else {
              const delta = newQty - currentQty;
              if (delta !== 0) updateQuantity(item.id, delta);
          }
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-screen gap-6 overflow-hidden relative">
      
      {/* LEFT: Product Browser */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${mobileView === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header / Search */}
        <div className="p-4 border-b border-gray-100 space-y-4 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Browse Items</h2>
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {filteredItems.length} Products
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                />
             </div>
             <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
             >
                <option value="All">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50 pb-32 lg:pb-4">
          {filteredItems.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <PackageX size={48} className="mb-2 opacity-50"/>
                <p>No products found</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3">
              {filteredItems.map(item => {
                const displayImage = (item.images && item.images.length > 0) ? item.images[0] : item.imageUrl;
                const cartQty = getItemCartQty(item.id);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    role="button"
                    tabIndex={0}
                    className="group flex flex-col bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left relative overflow-hidden h-full cursor-pointer"
                  >
                    {/* Image Section */}
                    <div className="relative w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden group/image">
                        {displayImage ? (
                            <>
                              <img 
                                src={displayImage} 
                                alt={item.name} 
                                className={`w-full h-full ${item.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}`} 
                              />
                            </>
                        ) : (
                            <Package size={32} className="text-gray-300" />
                        )}
                        
                        {/* Info / Details Button - Always Visible */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                            <div 
                                onClick={(e) => handleViewDetails(e, item)}
                                className="bg-white/90 p-1.5 rounded-full text-gray-700 shadow-sm cursor-pointer hover:bg-white hover:text-indigo-600 transition-colors"
                                title="View Details"
                            >
                                <Info size={16} />
                            </div>
                        </div>
                        
                        {/* Center Eye Icon - Visible on Hover */}
                        {displayImage && (
                            <div 
                                onClick={(e) => handlePreviewImage(e, item)}
                                className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity z-10 cursor-pointer"
                                title="View Photo"
                            >
                                <div className="bg-white/90 p-2.5 rounded-full text-gray-700 shadow-md hover:bg-white hover:text-indigo-600 transition-all transform hover:scale-110">
                                    <Eye size={24} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-3 flex flex-col flex-1">
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 leading-tight h-9">{item.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 truncate max-w-[80px]">
                                    {item.category}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {item.quantity} {item.costUnit || 'pcs'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="mt-auto space-y-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-bold text-indigo-600">₱</span>
                                <span className="font-bold text-indigo-600 text-lg">{item.retailPrice.toLocaleString()}</span>
                            </div>

                            {/* Quantity Stepper with Input */}
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-0.5" onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={(e) => handleQuantityChange(e, item, -1)}
                                    disabled={cartQty === 0}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <Minus size={14} />
                                </button>
                                
                                <input 
                                    type="number"
                                    value={cartQty === 0 ? '' : cartQty}
                                    placeholder="0"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleManualQuantityInput(e, item)}
                                    className="w-10 text-center text-sm font-semibold bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0 text-gray-900 placeholder-gray-300"
                                />
                                
                                <button 
                                    onClick={(e) => handleQuantityChange(e, item, 1)}
                                    disabled={cartQty >= item.quantity}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Mobile Floating Cart Button */}
        <div className="fixed bottom-24 left-4 right-4 lg:hidden z-20">
            <button 
                onClick={() => setMobileView('cart')}
                className="w-full bg-indigo-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between font-bold"
            >
                <div className="flex items-center gap-2">
                    <ShoppingCart size={20} />
                    <span>View Cart</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {cart.reduce((acc, i) => acc + i.cartQuantity, 0)} items
                    </span>
                </div>
                <span>₱{cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </button>
        </div>
      </div>

      {/* RIGHT: Cart & Payment (Fixed) */}
      <div className={`w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full ${mobileView === 'products' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Cart Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
           <div className="flex items-center gap-2 text-gray-800">
             <button 
                onClick={() => setMobileView('products')}
                className="lg:hidden p-1 mr-2 hover:bg-gray-200 rounded-full"
             >
                <ChevronLeft size={20} />
             </button>
             <ShoppingCart size={20} />
             <span className="font-bold">Current Order</span>
           </div>
           <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
             {cart.reduce((acc, i) => acc + i.cartQuantity, 0)} items
           </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
               <div className="p-4 bg-gray-50 rounded-full">
                   <ShoppingCart size={32} className="opacity-50" />
               </div>
               <p className="text-sm">Cart is empty</p>
               <p className="text-xs text-gray-300 text-center px-8">Select items from the left to start a sale.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:border-gray-300 transition-colors">
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1 pr-2">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                       <Trash2 size={14} />
                    </button>
                 </div>
                 
                 <div className="flex items-center justify-between gap-2">
                    {/* Quantity Control */}
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                       <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded-l-lg text-gray-600 border-r border-gray-100"><Minus size={14}/></button>
                       <input 
                            type="number" 
                            value={item.cartQuantity} 
                            onChange={(e) => handleCartInput(item.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-10 text-center text-sm font-semibold bg-transparent outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                       <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded-r-lg text-gray-600 border-l border-gray-100"><Plus size={14}/></button>
                    </div>

                    {/* Price Type Toggle */}
                    <button 
                        onClick={() => togglePriceType(item.id)}
                        className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors ${
                            item.priceType === 'retail' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                            : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        }`}
                    >
                        {item.priceType === 'retail' ? 'RETAIL' : 'WHOLESALE'}
                    </button>

                    {/* Line Total */}
                    <div className="text-sm font-bold text-gray-900">
                        ₱{((item.priceType === 'retail' ? item.retailPrice : item.wholesalePrice) * item.cartQuantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                 </div>
                 <div className="text-[10px] text-gray-400 mt-1 text-right">
                    Unit: {item.costUnit || 'pcs'}
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Section */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-4">
           {/* Totals */}
           <div className="space-y-2">
              <div className="flex justify-between text-gray-600 text-sm">
                 <span>Subtotal</span>
                 <span>₱{cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-gray-200">
                 <span>Total</span>
                 <span>₱{cartTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
           </div>

           {/* Input Amount */}
           <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <Banknote size={14} /> Cash Received
                 </label>
                 {receivedNum > 0 && receivedNum < cartTotal && (
                     <span className="text-xs text-red-500 font-medium">Insufficient</span>
                 )}
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-gray-400 font-semibold">₱</span>
                 <input 
                    type="number" 
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
                 />
              </div>
           </div>

           {/* Change Display */}
           <div className={`p-3 rounded-lg flex items-center justify-between border ${
               receivedNum >= cartTotal && cartTotal > 0 ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-100 border-gray-200 text-gray-400'
           }`}>
               <div className="flex items-center gap-2">
                   <Calculator size={18} />
                   <span className="text-sm font-semibold">Change</span>
               </div>
               <span className="text-xl font-bold">
                   ₱{receivedNum >= cartTotal ? change.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
               </span>
           </div>

           {/* Checkout Button */}
           <button
              onClick={handleCheckout}
              disabled={!canCheckout}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${
                 canCheckout 
                 ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md' 
                 : 'bg-gray-300 cursor-not-allowed'
              }`}
           >
              {isCheckoutSuccess ? (
                  <>
                    <CheckCircle size={20} /> Sale Completed!
                  </>
              ) : (
                  <>
                    <CreditCard size={20} /> Complete Sale
                  </>
              )}
           </button>
        </div>
      </div>

      {/* Product Details Modal */}
      <Modal 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        title="Product Details"
        maxWidth="max-w-xl"
      >
        {viewingItem && (
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        {viewingItem.imageUrl && (
                            <img src={viewingItem.imageUrl} className="w-20 h-20 rounded-lg object-cover bg-gray-100 border border-gray-200" alt={viewingItem.name}/>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{viewingItem.name}</h3>
                            <p className="text-sm text-gray-500 font-mono mt-1">SKU: {viewingItem.sku}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        viewingItem.quantity > viewingItem.minStockLevel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {viewingItem.quantity.toLocaleString()} {viewingItem.costUnit || 'pcs'} Available
                    </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                    {viewingItem.description || "No description available for this product."}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Retail Price</p>
                            <p className="text-2xl font-bold text-gray-900">₱{viewingItem.retailPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-purple-600 uppercase mb-1">Unit Cost (Buying)</p>
                            <p className="text-2xl font-bold text-gray-900">₱{viewingItem.wholesalePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                    </div>
                </div>

                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                        <Layers className="text-gray-400" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-medium text-gray-900">{viewingItem.category}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                        <MapPin className="text-gray-400" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-medium text-gray-900">{viewingItem.location || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                        <Tag className="text-gray-400" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Unit</p>
                            <p className="font-medium text-gray-900">{viewingItem.costUnit || 'pcs'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                        <Building2 className="text-gray-400" size={18} />
                        <div>
                            <p className="text-xs text-gray-500">Supplier</p>
                            <p className="font-medium text-gray-900 truncate max-w-[120px]">{getSupplierName(viewingItem.supplierId)}</p>
                        </div>
                    </div>
                </div>

                {/* Quantity Selection for Adding */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="bg-white p-2 rounded-lg text-gray-600 shadow-sm border border-gray-100">
                        <Calculator size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Quantity to Add</p>
                        <div className="flex items-center gap-3 mt-1">
                            <button 
                                onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                                className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Minus size={14} />
                            </button>
                            <input 
                                type="number"
                                value={modalQuantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if(!isNaN(val) && val > 0 && val <= viewingItem.quantity) setModalQuantity(val);
                                }}
                                className="w-16 text-center font-bold text-gray-900 outline-none border-b-2 border-transparent focus:border-indigo-500 bg-transparent transition-colors"
                            />
                            <button 
                                onClick={() => setModalQuantity(Math.min(viewingItem.quantity, modalQuantity + 1))}
                                className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                 <div className="pt-2 flex gap-3">
                    <button 
                        onClick={() => setViewingItem(null)} 
                        className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button 
                        onClick={() => { addToCart(viewingItem, modalQuantity); setViewingItem(null); }}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <ShoppingCart size={18} />
                        Add {modalQuantity > 1 ? `(${modalQuantity})` : ''} to Cart
                    </button>
                 </div>
            </div>
        )}
      </Modal>

      {/* Image Preview Carousel Modal */}
      <Modal 
        isOpen={!!previewGallery} 
        onClose={() => setPreviewGallery(null)}
        title={previewGallery?.name || 'Product Image'}
        maxWidth="max-w-xl"
      >
        <div className="relative flex flex-col items-center">
            <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg p-2 overflow-hidden relative" style={{ minHeight: '300px' }}>
                {previewGallery && previewGallery.images.length > 0 && (
                    <img 
                        src={previewGallery.images[currentImageIndex]} 
                        alt={`Preview ${currentImageIndex + 1}`} 
                        className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm transition-opacity duration-200" 
                    />
                )}
                
                {/* Carousel Controls */}
                {previewGallery && previewGallery.images.length > 1 && (
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
             {previewGallery && previewGallery.images.length > 1 && (
                <div className="flex gap-2 mt-4">
                    {previewGallery.images.map((_, idx) => (
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
                    onClick={() => setPreviewGallery(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      </Modal>

      {/* RECEIPT MODAL */}
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        data={lastTransaction}
      />

    </div>
  );
};

export default PointOfSale;
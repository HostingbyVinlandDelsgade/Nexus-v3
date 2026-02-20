import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { InventoryItem, Supplier, StockMovement, MovementType, Expense, WalletTransaction, WalletTransactionType, ReceiptItem, CompanyInfo, User, UserRole } from '../types';

interface InventoryContextType {
  items: InventoryItem[];
  suppliers: Supplier[];
  movements: StockMovement[];
  expenses: Expense[];
  walletTransactions: WalletTransaction[];
  walletBalance: number;
  categories: string[];
  companyInfo: CompanyInfo;
  users: User[];
  currentUser: User | null;
  
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addMovement: (movement: Omit<StockMovement, 'id' | 'date'>) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  addWalletTransaction: (amount: number, type: WalletTransactionType, reason: string, itemsSnapshot?: ReceiptItem[], customId?: string) => void;
  
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;

  updateCompanyInfo: (info: CompanyInfo) => void;

  getSupplierName: (id: string) => string;
  
  // Settings & User Management
  login: (username: string, password: string) => boolean;
  logout: () => void;
  verifyPasscode: (code: string) => boolean; // Admin passcode for high-level overrides
  updatePasscode: (newCode: string) => void;
  
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;

  exportData: () => void;
  importData: (fileContent: string) => boolean;
  resetSystemData: () => void;
  factoryReset: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Default Data
const DEFAULT_PASSCODE = '0000';
const DEFAULT_CATEGORIES = ['General', 'Electronics', 'Furniture', 'Stationery', 'Raw Materials', 'Food'];
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Nexus Inventory',
  address: '123 Tech Avenue, Silicon City',
  phone: '(02) 8888-1234',
  email: 'admin@nexusinv.com',
  website: 'www.nexusinv.com'
};

const INITIAL_USERS: User[] = [
    { id: 'admin1', username: 'admin', password: 'password', name: 'System Admin', role: 'admin' },
    { id: 'cashier1', username: 'cashier', password: '123', name: 'John Doe', role: 'cashier' }
];

// --- TEST DATA GENERATION ---
const SUP_ID_1 = 'sup_tech_ph';
const SUP_ID_2 = 'sup_office_works';
const ITEM_ID_1 = 'item_mouse';
const ITEM_ID_2 = 'item_kb';
const ITEM_ID_3 = 'item_chair';
const ITEM_ID_4 = 'item_paper';

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: SUP_ID_1,
    name: 'TechDistro Philippines',
    contactPerson: 'Maria Santos',
    email: 'orders@techdistro.ph',
    phone: '0917-555-0123',
    address: '15F Cyberzone Bldg, Makati City',
    status: 'Active'
  },
  {
    id: SUP_ID_2,
    name: 'Office Works Inc.',
    contactPerson: 'Robert Lim',
    email: 'sales@officeworks.com',
    phone: '02-8888-1234',
    address: 'Warehouse 4, Pasig Industrial Park',
    status: 'Active'
  }
];

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: ITEM_ID_1,
    sku: 'LOGI-M220',
    name: 'Logitech Silent Mouse M220',
    category: 'Electronics',
    quantity: 45,
    costUnit: 'pcs',
    minStockLevel: 10,
    unitCost: 350,
    wholesalePrice: 450,
    retailPrice: 899,
    movementSpeed: 'Fast',
    supplierId: SUP_ID_1,
    location: 'Shelf A-01',
    description: 'Compact wireless mouse with silent clicking mechanism. 18-month battery life.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: ITEM_ID_2,
    sku: 'RZR-BLK-WIDOW',
    name: 'Razer BlackWidow V3',
    category: 'Electronics',
    quantity: 8,
    costUnit: 'pcs',
    minStockLevel: 5,
    unitCost: 3200,
    wholesalePrice: 3800,
    retailPrice: 6499,
    movementSpeed: 'Normal',
    supplierId: SUP_ID_1,
    location: 'Shelf A-02',
    description: 'Mechanical gaming keyboard with RGB lighting and Green switches.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: ITEM_ID_3,
    sku: 'FUR-ERGO-CHAIR',
    name: 'ErgoPro Mesh Office Chair',
    category: 'Furniture',
    quantity: 4,
    costUnit: 'pcs',
    minStockLevel: 3,
    unitCost: 3500,
    wholesalePrice: 4500,
    retailPrice: 8999,
    movementSpeed: 'Slow',
    supplierId: SUP_ID_2,
    location: 'Floor Zone B',
    description: 'High-back ergonomic chair with breathable mesh and lumbar support.',
    lastUpdated: new Date().toISOString()
  },
  {
    id: ITEM_ID_4,
    sku: 'PPR-A4-SUB20',
    name: 'A4 Copy Paper (Sub 20) - 500 Sheets',
    category: 'Stationery',
    quantity: 120,
    costUnit: 'ream',
    minStockLevel: 50,
    unitCost: 150,
    wholesalePrice: 180,
    retailPrice: 260,
    movementSpeed: 'Fast',
    supplierId: SUP_ID_2,
    location: 'Rack C-10',
    description: 'Premium multi-purpose copy paper. 70gsm, ultra-white.',
    lastUpdated: new Date().toISOString()
  }
];

// Helper to create dates relative to today
const getDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const INITIAL_MOVEMENTS: StockMovement[] = [
  // Initial Stocking (1 Month Ago)
  { id: 'm1', itemId: ITEM_ID_1, type: MovementType.IN, quantity: 50, date: getDate(30), reason: 'Initial Stock Entry' },
  { id: 'm2', itemId: ITEM_ID_2, type: MovementType.IN, quantity: 10, date: getDate(30), reason: 'Initial Stock Entry' },
  { id: 'm3', itemId: ITEM_ID_3, type: MovementType.IN, quantity: 5, date: getDate(30), reason: 'Initial Stock Entry' },
  { id: 'm4', itemId: ITEM_ID_4, type: MovementType.IN, quantity: 150, date: getDate(30), reason: 'Initial Stock Entry' },
  
  // Recent Sales (This Week)
  { id: 'm5', itemId: ITEM_ID_1, type: MovementType.OUT, quantity: 2, date: getDate(5), reason: 'POS Sale - RETAIL' },
  { id: 'm6', itemId: ITEM_ID_4, type: MovementType.OUT, quantity: 5, date: getDate(5), reason: 'POS Sale - RETAIL' },
  { id: 'm7', itemId: ITEM_ID_1, type: MovementType.OUT, quantity: 1, date: getDate(3), reason: 'POS Sale - RETAIL' },
  { id: 'm8', itemId: ITEM_ID_2, type: MovementType.OUT, quantity: 1, date: getDate(2), reason: 'POS Sale - RETAIL' },
  { id: 'm9', itemId: ITEM_ID_4, type: MovementType.OUT, quantity: 20, date: getDate(1), reason: 'POS Sale - WHOLESALE' },
  { id: 'm10', itemId: ITEM_ID_3, type: MovementType.OUT, quantity: 1, date: getDate(1), reason: 'POS Sale - RETAIL' },
  
  // Today's Sales
  { id: 'm11', itemId: ITEM_ID_1, type: MovementType.OUT, quantity: 2, date: new Date().toISOString(), reason: 'POS Sale - RETAIL' },
  { id: 'm12', itemId: ITEM_ID_2, type: MovementType.OUT, quantity: 1, date: new Date().toISOString(), reason: 'POS Sale - RETAIL' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'exp1', description: 'Store Rent', amount: 5000, category: 'Rent', date: getDate(20) },
    { id: 'exp2', description: 'Electricity Bill', amount: 1200, category: 'Utilities', date: getDate(15) },
    { id: 'exp3', description: 'Staff Lunch', amount: 350, category: 'Food', date: getDate(0) },
];

// Initialize with some dummy wallet history for the demo
const INITIAL_WALLET_TX: WalletTransaction[] = [
    { id: 'w1', type: 'DEPOSIT', amount: 20000, date: getDate(30), reason: 'Initial Cash Float' },
    { id: 'w2', type: 'EXPENSE', amount: 5000, date: getDate(20), reason: 'Store Rent' },
    { id: 'w3', type: 'EXPENSE', amount: 1200, date: getDate(15), reason: 'Electricity Bill' },
    { id: 'w4', type: 'SALE', amount: 1798, date: getDate(5), reason: 'POS Sale' },
];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Ref to prevent saving state to localStorage during a factory reset
  const isResettingRef = useRef(false);

  // Initialize state from LocalStorage or use Defaults
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('nexus_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('nexus_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('nexus_movements');
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('nexus_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('nexus_wallet');
    return saved ? JSON.parse(saved) : INITIAL_WALLET_TX;
  });

  const [passcode, setPasscode] = useState<string>(() => {
    const saved = localStorage.getItem('nexus_passcode');
    return saved || DEFAULT_PASSCODE;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('nexus_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = sessionStorage.getItem('nexus_current_user');
      return saved ? JSON.parse(saved) : null;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('nexus_company_info');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });

  // Calculate current wallet balance derived from history
  const walletBalance = walletTransactions.reduce((acc, tx) => {
    if (tx.type === 'DEPOSIT' || tx.type === 'SALE') return acc + tx.amount;
    return acc - tx.amount;
  }, 0);

  // Persist to LocalStorage whenever state changes, unless resetting
  useEffect(() => {
    if (isResettingRef.current) return;

    localStorage.setItem('nexus_items', JSON.stringify(items));
    localStorage.setItem('nexus_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('nexus_movements', JSON.stringify(movements));
    localStorage.setItem('nexus_expenses', JSON.stringify(expenses));
    localStorage.setItem('nexus_wallet', JSON.stringify(walletTransactions));
    localStorage.setItem('nexus_passcode', passcode);
    localStorage.setItem('nexus_users', JSON.stringify(users));
    localStorage.setItem('nexus_categories', JSON.stringify(categories));
    localStorage.setItem('nexus_company_info', JSON.stringify(companyInfo));
    
    if (currentUser) {
        sessionStorage.setItem('nexus_current_user', JSON.stringify(currentUser));
    } else {
        sessionStorage.removeItem('nexus_current_user');
    }

  }, [items, suppliers, movements, expenses, walletTransactions, passcode, users, categories, companyInfo, currentUser]);

  // --- CRUD Operations ---

  const addItem = (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Capture intended initial quantity
    const initialQty = newItem.quantity;

    const item: InventoryItem = {
      ...newItem,
      quantity: 0, // Initialize to 0 so addMovement adds the actual stock without doubling it
      id,
      lastUpdated: new Date().toISOString(),
    };
    // Prepend new item to the start of the list
    setItems(prev => [item, ...prev]);
    
    if (initialQty > 0) {
      addMovement({
        itemId: id,
        type: MovementType.IN,
        quantity: initialQty,
        reason: 'Initial Inventory Entry'
      });
    }
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
    const supplier = {
      ...newSupplier,
      id: Math.random().toString(36).substr(2, 9)
    };
    setSuppliers(prev => [...prev, supplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addMovement = (newMovement: Omit<StockMovement, 'id' | 'date'>) => {
    const movement = {
      ...newMovement,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      userId: currentUser?.id,
      userName: currentUser?.name
    };
    setMovements(prev => [movement, ...prev]);

    setItems(prev => prev.map(item => {
      if (item.id === newMovement.itemId) {
        let newQty = item.quantity;
        if (newMovement.type === MovementType.IN) newQty += newMovement.quantity;
        if (newMovement.type === MovementType.OUT) newQty = Math.max(0, newQty - newMovement.quantity);
        if (newMovement.type === MovementType.ADJUSTMENT) newQty = newMovement.quantity; 
        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    }));
  };

  // Category Management
  const addCategory = (category: string) => {
    if (category && !categories.includes(category)) {
      setCategories(prev => [...prev, category]);
    }
  };

  const deleteCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
  };

  // Wallet Logic
  const addWalletTransaction = (amount: number, type: WalletTransactionType, reason: string, itemsSnapshot?: ReceiptItem[], customId?: string) => {
     const tx: WalletTransaction = {
         id: customId || Math.random().toString(36).substr(2, 9),
         date: new Date().toISOString(),
         amount,
         type,
         reason,
         itemsSnapshot,
         userId: currentUser?.id,
         userName: currentUser?.name
     };
     setWalletTransactions(prev => [tx, ...prev]);
  };

  const addExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense = {
        ...newExpense,
        id: Math.random().toString(36).substr(2, 9)
    };
    setExpenses(prev => [expense, ...prev]);

    // Automatically deduct from Wallet
    addWalletTransaction(newExpense.amount, 'EXPENSE', `Expense: ${newExpense.description}`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
  };

  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  // --- Settings & User Management ---

  const login = (u: string, p: string) => {
    const user = users.find(usr => usr.username === u && usr.password === p);
    if (user) {
        // Update last login
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        updateUser(user.id, { lastLogin: new Date().toISOString() });
        setCurrentUser(updatedUser);
        return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (userData: Omit<User, 'id'>) => {
      const newUser = {
          ...userData,
          id: Math.random().toString(36).substr(2, 9)
      };
      setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      if (currentUser && currentUser.id === id) {
          setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      }
  };

  const deleteUser = (id: string) => {
      if (currentUser?.id === id) {
          alert("You cannot delete your own account while logged in.");
          return;
      }
      setUsers(prev => prev.filter(u => u.id !== id));
  };

  const verifyPasscode = (code: string) => {
    return code === passcode;
  };

  const updatePasscode = (newCode: string) => {
    setPasscode(newCode);
  };

  const exportData = () => {
    // SECURITY: We explicitly do NOT include credentials or passcode in the export.
    const data = {
      items,
      suppliers,
      movements,
      expenses,
      walletTransactions,
      categories,
      companyInfo,
      exportedAt: new Date().toISOString(),
      version: '1.5' // Version bump
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (fileContent: string): boolean => {
    try {
      const data = JSON.parse(fileContent);
      
      if (!data || typeof data !== 'object') return false;

      // SECURITY: Explicitly only import business data.
      if (Array.isArray(data.items)) setItems(data.items);
      if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (Array.isArray(data.movements)) setMovements(data.movements);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.walletTransactions)) setWalletTransactions(data.walletTransactions);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      
      return true;
    } catch (e) {
      console.error("Failed to parse import data", e);
      return false;
    }
  };

  const resetSystemData = () => {
    setItems([]);
    setSuppliers([]);
    setMovements([]);
    setExpenses([]);
    setWalletTransactions([]);
  };

  const factoryReset = () => {
    isResettingRef.current = true;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <InventoryContext.Provider value={{ 
      items, suppliers, movements, expenses, walletTransactions, walletBalance, categories, companyInfo,
      users, currentUser,
      addItem, updateItem, deleteItem, 
      addSupplier, updateSupplier, 
      addMovement, 
      addExpense, deleteExpense,
      addWalletTransaction,
      addCategory, deleteCategory,
      updateCompanyInfo,
      getSupplierName,
      login, logout, addUser, updateUser, deleteUser,
      verifyPasscode, updatePasscode,
      exportData, importData, resetSystemData, factoryReset,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};
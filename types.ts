
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Inactive';
}

export type MovementSpeed = 'Fast' | 'Normal' | 'Slow';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
}

export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this would be hashed
  name: string;
  role: UserRole;
  lastLogin?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  costUnit: string;
  minStockLevel: number;
  unitCost: number; // Buying Price
  wholesalePrice: number; // Selling Price (Wholesale)
  retailPrice: number; // Selling Price (Retail)
  movementSpeed: MovementSpeed;
  supplierId: string;
  location: string;
  description: string;
  imageUrl?: string; // Primary Image URL (Legacy/Backward Compatibility)
  images?: string[]; // New: Multiple Images support
  imageFit?: 'cover' | 'contain'; // New: Control how image fits in container
  lastUpdated: string;
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
  userId?: string; // ID of the user who performed the action
  userName?: string; // Name snapshot
}

export interface Expense {
  id: string;
  description: string; // e.g., "Rent", "Electricity", "Lunch"
  amount: number;
  category: string; // e.g., "Utilities", "Operations", "Misc"
  date: string;
}

export type WalletTransactionType = 'SALE' | 'EXPENSE' | 'DEPOSIT' | 'WITHDRAWAL';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  date: string;
  reason: string;
  itemsSnapshot?: ReceiptItem[]; // Store items for receipt reconstruction
  userId?: string;
  userName?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  totalSuppliers: number;
}
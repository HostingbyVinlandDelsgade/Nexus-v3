import React from 'react';
import { Package, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';

const DashboardStats: React.FC = () => {
  const { items, suppliers } = useInventory();

  const totalItems = items.length;
  // Calculate value based on Unit Cost (Buying Price) only.
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * (item.unitCost || 0)), 0);
  const lowStockCount = items.filter(item => item.quantity <= item.minStockLevel).length;
  const activeSuppliers = suppliers.length;

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-400 mt-4">{subtext}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard 
        title="Total Products" 
        value={totalItems} 
        icon={Package} 
        color="bg-blue-500" 
        subtext={`${activeSuppliers} active suppliers`}
      />
      <StatCard 
        title="Inventory Value" 
        value={`₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
        icon={DollarSign} 
        color="bg-green-500" 
        subtext="Total asset value (Cost)"
      />
      <StatCard 
        title="Low Stock Alert" 
        value={lowStockCount} 
        icon={AlertTriangle} 
        color="bg-orange-500" 
        subtext="Items below min. level"
      />
      <StatCard 
        title="Stock Health" 
        value={lowStockCount === 0 ? "Good" : "Attention"} 
        icon={Activity} 
        color={lowStockCount === 0 ? "bg-indigo-500" : "bg-red-500"} 
        subtext="Based on reorder levels"
      />
    </div>
  );
};

export default DashboardStats;
import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { MovementType } from '../../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, User, Filter } from 'lucide-react';

const StockMovementLog: React.FC = () => {
  const { movements, items, users } = useInventory();
  const [selectedUser, setSelectedUser] = useState('All');

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || 'Unknown Item';
  const getItemSku = (id: string) => items.find(i => i.id === id)?.sku || 'N/A';

  const getIcon = (type: MovementType) => {
    switch (type) {
      case MovementType.IN: return <ArrowDownLeft className="text-green-500" size={18} />;
      case MovementType.OUT: return <ArrowUpRight className="text-red-500" size={18} />;
      case MovementType.ADJUSTMENT: return <RefreshCcw className="text-orange-500" size={18} />;
    }
  };

  const getBadgeClass = (type: MovementType) => {
    switch (type) {
      case MovementType.IN: return 'bg-green-100 text-green-800';
      case MovementType.OUT: return 'bg-red-100 text-red-800';
      case MovementType.ADJUSTMENT: return 'bg-orange-100 text-orange-800';
    }
  };

  const filteredMovements = movements.filter(m => 
      selectedUser === 'All' || m.userId === selectedUser
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Stock Movements</h2>
        
        {/* User Filter */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            <User size={16} className="text-gray-500" />
            <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            >
                <option value="All">All Users</option>
                {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
            </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4 text-center">Quantity</th>
              <th className="px-6 py-4">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMovements.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No activity found for this user.
                    </td>
                </tr>
            ) : (
                filteredMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(movement.date).toLocaleDateString()} <span className="text-gray-400 text-xs">{new Date(movement.date).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {movement.userName || '-'}
                    </td>
                    <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(movement.type)}`}>
                        {getIcon(movement.type)}
                        {movement.type}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getItemName(movement.itemId)}</span>
                        <span className="text-xs text-gray-500">{getItemSku(movement.itemId)}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-gray-700">
                    {movement.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                    {movement.reason}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovementLog;
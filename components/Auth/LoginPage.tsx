import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { Lock, ArrowRight, User, Key } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, companyInfo } = useInventory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      setError('');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 pb-6 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
                <Lock size={32} className="text-white" />
            </div>
            {/* Dynamic Company Name */}
            <h1 className="text-2xl font-bold text-gray-900">{companyInfo ? companyInfo.name : 'Nexus Inventory'}</h1>
            <p className="text-gray-500 mt-2">Sign in to manage your inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Enter username"
                        autoFocus
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Enter password"
                    />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium text-center animate-pulse">{error}</p>}

            <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
            >
                Login <ArrowRight size={20} />
            </button>
            
            <p className="text-xs text-center text-gray-400 mt-6">
                Default: admin / password
            </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
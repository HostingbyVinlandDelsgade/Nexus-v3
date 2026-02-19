import React, { useState } from 'react';
import { useInventory } from './contexts/InventoryContext';
import { LayoutDashboard, Package, Users, History, Boxes, ShoppingCart, Settings as SettingsIcon, LogOut, BarChart3, Menu } from 'lucide-react';

// Components
import DashboardStats from './components/Dashboard/DashboardStats';
import InventoryList from './components/Inventory/InventoryList';
import SupplierList from './components/Suppliers/SupplierList';
import StockMovementLog from './components/Stock/StockMovementLog';
import InventoryAssistant from './components/AI/InventoryAssistant';
import PointOfSale from './components/POS/PointOfSale';
import Settings from './components/Settings/Settings';
import LoginPage from './components/Auth/LoginPage';
import ReportsPage from './components/Reports/ReportsPage';

type View = 'dashboard' | 'inventory' | 'suppliers' | 'movements' | 'pos' | 'settings' | 'reports';

const App = () => {
  const { isAuthenticated, logout } = useInventory();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
      title={isSidebarCollapsed ? label : ''}
    >
      <Icon size={20} className="flex-shrink-0" />
      <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shadow-xl z-20`}
      >
        <div className={`h-16 flex items-center border-b border-slate-800 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <div className="bg-indigo-500 p-1.5 rounded-lg flex-shrink-0">
                <Boxes size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Nexus Inv.</h1>
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
             <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-x-hidden">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="pos" icon={ShoppingCart} label="Point of Sale" />
          <NavItem view="reports" icon={BarChart3} label="Reports" />
          <NavItem view="inventory" icon={Package} label="Inventory" />
          <NavItem view="suppliers" icon={Users} label="Suppliers" />
          <NavItem view="movements" icon={History} label="Stock Movements" />
          
          <div className="my-4 border-t border-slate-800 pt-4">
             <NavItem view="settings" icon={SettingsIcon} label="Settings" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
            title="Logout"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                Logout
            </span>
          </button>
          <div className={`mt-4 text-xs text-slate-600 text-center whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
             v1.0.0 &copy; 2024 Nexus Inc.
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300">
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
               <div className="flex items-center gap-2">
                  <Boxes size={24} className="text-indigo-600" />
                  <span className="font-bold text-gray-900">Nexus Inventory</span>
               </div>
               <button onClick={logout} className="text-gray-500 hover:text-red-600">
                  <LogOut size={20} />
               </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="w-full h-full">
                  {/* View Router */}
                  {currentView === 'dashboard' && (
                      <div className="space-y-6 animate-fadeIn">
                          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                          <InventoryAssistant />
                          <DashboardStats />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Snippets of other views for the dashboard */}
                              <div>
                                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Stock Activity</h3>
                                  <div className="h-[400px] overflow-hidden rounded-xl border border-gray-100 shadow-sm relative">
                                      <div className="absolute inset-0 overflow-y-auto">
                                           <StockMovementLog />
                                      </div>
                                  </div>
                              </div>
                              <div>
                                   <h3 className="text-lg font-semibold mb-4 text-gray-700">Quick Inventory Look</h3>
                                    <div className="h-[400px] overflow-hidden rounded-xl border border-gray-100 shadow-sm relative">
                                      <div className="absolute inset-0 overflow-y-auto">
                                          <InventoryList />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {currentView === 'pos' && (
                      <div className="h-full animate-fadeIn">
                           <PointOfSale />
                      </div>
                  )}

                  {currentView === 'reports' && (
                      <div className="h-full animate-fadeIn">
                           <ReportsPage />
                      </div>
                  )}

                  {currentView === 'inventory' && (
                      <div className="space-y-6 animate-fadeIn">
                           <InventoryList />
                      </div>
                  )}

                  {currentView === 'suppliers' && (
                      <div className="space-y-6 animate-fadeIn">
                          <SupplierList />
                      </div>
                  )}

                  {currentView === 'movements' && (
                      <div className="space-y-6 animate-fadeIn">
                          <StockMovementLog />
                      </div>
                  )}

                  {currentView === 'settings' && (
                      <div className="space-y-6 animate-fadeIn h-full">
                          <Settings />
                      </div>
                  )}
              </div>
          </div>
      </main>

      {/* Mobile Nav Bottom Bar (Optional, for mobile-first feel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 safe-area-bottom">
          <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><LayoutDashboard size={24}/></button>
          <button onClick={() => setCurrentView('pos')} className={`p-2 rounded-lg ${currentView === 'pos' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><ShoppingCart size={24}/></button>
          <button onClick={() => setCurrentView('reports')} className={`p-2 rounded-lg ${currentView === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><BarChart3 size={24}/></button>
          <button onClick={() => setCurrentView('inventory')} className={`p-2 rounded-lg ${currentView === 'inventory' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><Package size={24}/></button>
          <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-lg ${currentView === 'settings' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><SettingsIcon size={24}/></button>
      </div>
    </div>
  );
};

export default App;
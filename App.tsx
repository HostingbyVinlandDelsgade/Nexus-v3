import React, { useState, useEffect } from 'react';
import { useInventory } from './contexts/InventoryContext';
import { LayoutDashboard, Package, Users, History, Boxes, ShoppingCart, Settings as SettingsIcon, LogOut, BarChart3, Menu, Activity, ShieldAlert } from 'lucide-react';

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
import SystemFlow from './components/SystemFlow/SystemFlow';

type View = 'dashboard' | 'inventory' | 'suppliers' | 'movements' | 'pos' | 'settings' | 'reports' | 'flow';

const App = () => {
  const { isAuthenticated, logout, companyInfo, currentUser } = useInventory();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Effect to default cashiers to POS view
  useEffect(() => {
      if (currentUser?.role === 'cashier') {
          setCurrentView('pos');
      }
  }, [currentUser]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const appName = companyInfo ? companyInfo.name : 'Nexus Inv.';
  const isCashier = currentUser?.role === 'cashier';

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
            <h1 className="text-xl font-bold tracking-tight whitespace-nowrap truncate max-w-[150px]" title={appName}>{appName}</h1>
          </div>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
             <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 overflow-x-hidden">
          {/* Dashboard - Visible to everyone, but content might be limited for cashiers */}
          {!isCashier && <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />}
          
          <NavItem view="pos" icon={ShoppingCart} label="Point of Sale" />
          
          {/* Restricted Views */}
          {!isCashier && <NavItem view="reports" icon={BarChart3} label="Reports" />}
          
          <NavItem view="inventory" icon={Package} label="Inventory" />
          
          {!isCashier && <NavItem view="suppliers" icon={Users} label="Suppliers" />}
          {!isCashier && <NavItem view="movements" icon={History} label="Stock Movements" />}
          
          <div className="my-4 border-t border-slate-800 pt-4">
             {!isCashier && <NavItem view="flow" icon={Activity} label="System Flow" />}
             {!isCashier && <NavItem view="settings" icon={SettingsIcon} label="Settings" />}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`mb-3 flex items-center gap-2 px-2 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  {currentUser?.username.substring(0,2).toUpperCase()}
              </div>
              <div className={`text-xs text-slate-400 overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                  <p className="font-medium text-white truncate">{currentUser?.name}</p>
                  <p className="capitalize">{currentUser?.role}</p>
              </div>
          </div>
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
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex justify-around items-center px-2 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium mt-1">Home</span>
        </button>
        <button 
            onClick={() => setCurrentView('pos')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'pos' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <ShoppingCart size={20} />
            <span className="text-[10px] font-medium mt-1">POS</span>
        </button>
        <button 
            onClick={() => setCurrentView('inventory')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'inventory' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
            <Package size={20} />
            <span className="text-[10px] font-medium mt-1">Items</span>
        </button>
        <button 
            onClick={() => setIsSidebarCollapsed(false)} // Reusing sidebar state to maybe show a menu modal or just toggle sidebar? 
            // Actually, sidebar is hidden on mobile. Let's make a simple menu for other links or just expose them.
            // For now, let's just show the sidebar as a drawer if clicked?
            // Or better, just add the other links here if they fit, or a "More" tab.
            // Let's use a "More" tab that sets view to 'settings' or opens a drawer.
            // Given the constraints, let's just map 'Menu' to toggling the sidebar visibility on mobile (which we need to implement).
            // But sidebar is `hidden md:flex`. We need to make it visible on mobile when toggled.
            className={`flex flex-col items-center p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-600`}
            onClick={() => {
                // Toggle a mobile menu state
                const mobileMenu = document.getElementById('mobile-sidebar');
                if (mobileMenu) mobileMenu.classList.toggle('hidden');
            }}
        >
            <Menu size={20} />
            <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </nav>

      {/* Mobile Sidebar Drawer (Hidden by default) */}
      <div id="mobile-sidebar" className="fixed inset-0 z-50 bg-black/50 hidden md:hidden" onClick={(e) => {
          if(e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
      }}>
          <div className="w-64 h-full bg-slate-900 text-white p-4 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">{appName}</h2>
                  <button onClick={() => document.getElementById('mobile-sidebar')?.classList.add('hidden')} className="p-2 hover:bg-slate-800 rounded-lg">
                      <LogOut size={20} className="rotate-180"/> 
                  </button>
              </div>
              <nav className="space-y-2">
                  <button onClick={() => { setCurrentView('dashboard'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><LayoutDashboard size={20}/> Dashboard</button>
                  <button onClick={() => { setCurrentView('pos'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><ShoppingCart size={20}/> Point of Sale</button>
                  <button onClick={() => { setCurrentView('inventory'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><Package size={20}/> Inventory</button>
                  <button onClick={() => { setCurrentView('suppliers'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><Users size={20}/> Suppliers</button>
                  <button onClick={() => { setCurrentView('movements'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><History size={20}/> Movements</button>
                  <button onClick={() => { setCurrentView('reports'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><BarChart3 size={20}/> Reports</button>
                  <button onClick={() => { setCurrentView('settings'); document.getElementById('mobile-sidebar')?.classList.add('hidden'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300"><SettingsIcon size={20}/> Settings</button>
              </nav>
              <div className="mt-auto pt-4 border-t border-slate-800">
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-red-400"><LogOut size={20}/> Logout</button>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 pb-16 md:pb-0">
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
               <div className="flex items-center gap-2">
                  <Boxes size={24} className="text-indigo-600" />
                  <span className="font-bold text-gray-900 truncate max-w-[200px]">{appName}</span>
               </div>
               <button onClick={logout} className="text-gray-500 hover:text-red-600">
                  <LogOut size={20} />
               </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="w-full h-full">
                  {/* View Router with Access Control */}
                  {currentView === 'dashboard' && !isCashier && (
                      <div className="space-y-6 animate-fadeIn">
                          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                          <InventoryAssistant />
                          <DashboardStats />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  {currentView === 'reports' && !isCashier && (
                      <div className="h-full animate-fadeIn">
                           <ReportsPage />
                      </div>
                  )}

                  {currentView === 'inventory' && (
                      <div className="space-y-6 animate-fadeIn">
                           <InventoryList />
                      </div>
                  )}

                  {currentView === 'suppliers' && !isCashier && (
                      <div className="space-y-6 animate-fadeIn">
                          <SupplierList />
                      </div>
                  )}

                  {currentView === 'movements' && !isCashier && (
                      <div className="space-y-6 animate-fadeIn">
                          <StockMovementLog />
                      </div>
                  )}

                  {currentView === 'flow' && !isCashier && (
                      <div className="space-y-6 animate-fadeIn h-full">
                          <SystemFlow />
                      </div>
                  )}

                  {currentView === 'settings' && !isCashier && (
                      <div className="space-y-6 animate-fadeIn h-full">
                          <Settings />
                      </div>
                  )}

                  {/* Fallback for Restricted Views */}
                  {((['dashboard', 'reports', 'suppliers', 'movements', 'flow', 'settings'].includes(currentView) && isCashier)) && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <ShieldAlert size={64} className="text-red-500 mb-4" />
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                          <p className="text-gray-500 max-w-md">You do not have permission to view this page. This section is reserved for Administrators.</p>
                          <button onClick={() => setCurrentView('pos')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Go to POS</button>
                      </div>
                  )}
              </div>
          </div>
      </main>

      {/* Mobile Nav Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 safe-area-bottom">
          {!isCashier && <button onClick={() => setCurrentView('dashboard')} className={`p-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><LayoutDashboard size={24}/></button>}
          <button onClick={() => setCurrentView('pos')} className={`p-2 rounded-lg ${currentView === 'pos' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><ShoppingCart size={24}/></button>
          {!isCashier && <button onClick={() => setCurrentView('reports')} className={`p-2 rounded-lg ${currentView === 'reports' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><BarChart3 size={24}/></button>}
          <button onClick={() => setCurrentView('inventory')} className={`p-2 rounded-lg ${currentView === 'inventory' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><Package size={24}/></button>
          {!isCashier && <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-lg ${currentView === 'settings' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}><SettingsIcon size={24}/></button>}
      </div>
    </div>
  );
};

export default App;
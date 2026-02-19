import React, { useState, useMemo } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Calendar, 
  PieChart, ChevronLeft, ChevronRight, Filter, CalendarDays,
  Plus, Trash2, Wallet, ArrowDownLeft, ArrowUpRight, Minus,
  AlertTriangle, PiggyBank, Receipt
} from 'lucide-react';
import { MovementType, WalletTransactionType } from '../../types';
import Modal from '../ui/Modal';
import ReceiptModal from '../POS/ReceiptModal';

type ReportTab = 'sales' | 'inventory' | 'wallet';
type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

const ReportsPage: React.FC = () => {
  const { items, movements, expenses, walletTransactions, walletBalance, addExpense, deleteExpense, addWalletTransaction } = useInventory();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  
  // Date Navigation State
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [referenceDate, setReferenceDate] = useState(new Date());

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Operational' });

  // Wallet Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletForm, setWalletForm] = useState({ type: 'WITHDRAWAL' as WalletTransactionType, amount: '', reason: '' });

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);

  // --- Date Logic Helpers ---

  const getDateRange = () => {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'daily':
        // Start and End are already set to the reference day
        break;
      case 'weekly':
        // Set start to Monday of the current week
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        // Set end to Sunday
        end.setDate(diff + 6);
        break;
      case 'monthly':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0); // Last day of month
        break;
      case 'yearly':
        start.setMonth(0, 1); // Jan 1st
        end.setMonth(11, 31); // Dec 31st
        break;
      case 'all':
        return { start: new Date(0), end: new Date(8640000000000000) }; // Max date range
    }
    return { start, end };
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(referenceDate);
    const val = direction === 'next' ? 1 : -1;

    switch (period) {
      case 'daily':
        newDate.setDate(newDate.getDate() + val);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (val * 7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + val);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + val);
        break;
    }
    setReferenceDate(newDate);
  };

  const formatPeriodLabel = () => {
    if (period === 'all') return 'All Time';
    
    const { start, end } = getDateRange();
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

    if (period === 'daily') {
      return start.toLocaleDateString(undefined, { ...options, weekday: 'short' });
    }
    if (period === 'weekly') {
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, options)}`;
    }
    if (period === 'monthly') {
      return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (period === 'yearly') {
      return start.getFullYear().toString();
    }
    return '';
  };

  const setToday = () => {
    setReferenceDate(new Date());
  };

  // --- Handlers ---
  
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    addExpense({
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: new Date().toISOString()
    });
    setNewExpense({ description: '', amount: '', category: 'Operational' });
  };

  const handleWalletTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(walletForm.amount);
    if (!amt || !walletForm.reason) return;
    
    // Only allow withdrawals if enough balance
    if (walletForm.type === 'WITHDRAWAL' && amt > walletBalance) {
        alert("Insufficient funds in wallet.");
        return;
    }

    addWalletTransaction(amt, walletForm.type, walletForm.reason);
    setWalletForm({ type: 'WITHDRAWAL', amount: '', reason: '' });
    setIsWalletModalOpen(false);
  };

  const handleViewReceipt = (tx: any) => {
      if (!tx.itemsSnapshot) return;
      
      const data = {
          transactionId: tx.id.substring(0,6).toUpperCase(),
          date: tx.date,
          items: tx.itemsSnapshot,
          subtotal: tx.amount, // Approximate for history
          total: tx.amount,
          cashReceived: tx.amount, // No record of exact change in history
          change: 0
      };
      setReceiptData(data);
  };

  // --- Calculations: Sales & Profit & Expenses ---

  const salesData = useMemo(() => {
    const { start, end } = getDateRange();
    
    // 1. Calculate Product Sales
    const filteredMovements = movements.filter(m => {
      const mDate = new Date(m.date);
      return m.type === MovementType.OUT && mDate >= start && mDate <= end;
    });
    
    let totalRevenue = 0;
    let totalCOGS = 0; // Cost of Goods Sold
    let totalItemsSold = 0;
    
    const salesLog = filteredMovements.map(m => {
      const item = items.find(i => i.id === m.itemId);
      if (!item) return null;

      // Determine Price based on reason tag from POS
      const isWholesale = m.reason.toUpperCase().includes('WHOLESALE');
      const salePrice = isWholesale ? item.wholesalePrice : item.retailPrice;
      
      // FIX: Strictly use unitCost (Buying Price) for COGS.
      // Do NOT fall back to wholesalePrice to avoid profit calculation errors.
      const buyingPrice = item.unitCost || 0; 

      const revenue = salePrice * m.quantity;
      const cogs = buyingPrice * m.quantity;
      const profit = revenue - cogs;

      totalRevenue += revenue;
      totalCOGS += cogs;
      totalItemsSold += m.quantity;

      return {
        id: m.id,
        date: m.date,
        itemName: item.name,
        sku: item.sku,
        quantity: m.quantity,
        salePrice,
        costPrice: buyingPrice,
        revenue,
        profit,
        type: isWholesale ? 'Wholesale' : 'Retail'
      };
    }).filter(Boolean) as any[];

    // 2. Calculate Expenses
    const filteredExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= start && eDate <= end;
    });

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Totals
    const grossProfit = totalRevenue - totalCOGS;
    const netIncome = grossProfit - totalExpenses;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { 
        log: salesLog, 
        expenseLog: filteredExpenses,
        totalRevenue, 
        totalCOGS, 
        totalExpenses,
        grossProfit, 
        netIncome, 
        margin, 
        totalItemsSold 
    };
  }, [movements, items, expenses, period, referenceDate]);

  // --- Calculations: Wallet & Cash Flow ---
  
  const walletData = useMemo(() => {
    const { start, end } = getDateRange();

    const filteredTx = walletTransactions.filter(tx => {
        const d = new Date(tx.date);
        return d >= start && d <= end;
    });

    // Breakdown Cash In sources
    const salesIn = filteredTx.filter(tx => tx.type === 'SALE').reduce((sum, tx) => sum + tx.amount, 0);
    const depositsIn = filteredTx.filter(tx => tx.type === 'DEPOSIT').reduce((sum, tx) => sum + tx.amount, 0);
    const cashIn = salesIn + depositsIn;

    // Breakdown Cash Out sources
    const expensesOut = filteredTx.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawalsOut = filteredTx.filter(tx => tx.type === 'WITHDRAWAL').reduce((sum, tx) => sum + tx.amount, 0);
    const cashOut = expensesOut + withdrawalsOut;

    const netCashFlow = cashIn - cashOut;

    // Growth check (Simple Logic: Is Net Cash Flow Positive?)
    const isGrowing = netCashFlow > 0;

    return { 
        log: filteredTx, 
        cashIn, salesIn, depositsIn, 
        cashOut, expensesOut, withdrawalsOut, 
        netCashFlow, isGrowing 
    };
  }, [walletTransactions, period, referenceDate]);


  // --- Calculations: Inventory Valuation ---

  const inventoryData = useMemo(() => {
    let totalStock = 0;
    let totalAssetValue = 0; 
    let totalRetailValue = 0; 

    const valuationLog = items.map(item => {
      // FIX: Use unitCost for Asset Value (Cost Basis)
      const assetValue = item.quantity * (item.unitCost || 0); 
      const retailValue = item.quantity * item.retailPrice;
      
      totalStock += item.quantity;
      totalAssetValue += assetValue;
      totalRetailValue += retailValue;

      return {
        ...item,
        assetValue,
        retailValue
      };
    });

    valuationLog.sort((a, b) => b.assetValue - a.assetValue);

    return { log: valuationLog, totalStock, totalAssetValue, totalRetailValue };
  }, [items]);


  // --- Render Components ---

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, onClick }: any) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm ${onClick ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {subtext && <p className={`text-xs mt-2 font-medium ${colorClass}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon size={24} className={colorClass.replace('text-', 'text-opacity-100 ')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
           <p className="text-gray-500 text-sm">Financial performance and inventory valuation</p>
        </div>

        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'sales' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Sales & Profit
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'wallet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Cash & Wallet
          </button>
          <button
             onClick={() => setActiveTab('inventory')}
             className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Inventory Value
          </button>
        </div>
      </div>

      {/* --- SALES TAB CONTROLS --- */}
      {activeTab === 'sales' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Advanced Period Selector */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
             
             {/* Period Type Buttons */}
             <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                {(['daily', 'weekly', 'monthly', 'yearly', 'all'] as ReportPeriod[]).map((p) => (
                   <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                        period === p 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                   >
                      {p}
                   </button>
                ))}
             </div>

             {/* Date Navigator */}
             {period !== 'all' && (
               <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <button onClick={() => handleNavigate('prev')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all">
                      <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2 px-2 min-w-[180px] justify-center font-semibold text-gray-800">
                      <CalendarDays size={18} className="text-indigo-600" />
                      <span>{formatPeriodLabel()}</span>
                  </div>

                  <button onClick={() => handleNavigate('next')} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition-all">
                      <ChevronRight size={20} />
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <button 
                    onClick={setToday}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md uppercase tracking-wide"
                  >
                    Current
                  </button>
               </div>
             )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`₱${salesData.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
              icon={DollarSign} 
              colorClass="text-blue-600"
              subtext={`${salesData.totalItemsSold} items sold`}
            />
            <StatCard 
              title="Operational Expenses" 
              value={`₱${salesData.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
              icon={Wallet} 
              colorClass="text-red-500"
              subtext="Rent, Utilities, etc."
            />
             <StatCard 
              title="Net Income" 
              value={`₱${salesData.netIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
              icon={TrendingUp} 
              colorClass={salesData.netIncome >= 0 ? "text-green-600" : "text-red-600"}
              subtext="Revenue - COGS - Expenses"
            />
             <StatCard 
              title="Profit Margin" 
              value={`${salesData.margin.toFixed(1)}%`} 
              icon={PieChart} 
              colorClass="text-purple-600"
              subtext="Gross Margin %"
            />
          </div>

          <div className="flex justify-end">
             <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 shadow-sm"
             >
                <Wallet size={18} className="text-red-500" />
                Manage Other Expenses
             </button>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">Sales Breakdown</h3>
               <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                 {salesData.log.length} Transaction{salesData.log.length !== 1 ? 's' : ''}
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Item</th>
                     <th className="px-6 py-4">Type</th>
                     <th className="px-6 py-4 text-center">Qty</th>
                     <th className="px-6 py-4 text-right">Sold At</th>
                     <th className="px-6 py-4 text-right">Revenue</th>
                     <th className="px-6 py-4 text-right">Profit</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {salesData.log.length === 0 ? (
                     <tr><td colSpan={7} className="p-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                           <Filter size={32} className="opacity-20" />
                           <p>No sales records found for this period.</p>
                        </div>
                     </td></tr>
                   ) : (
                     salesData.log.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(row => (
                       <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                            {new Date(row.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(row.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{row.itemName}</div>
                            <div className="text-xs text-gray-500">{row.sku}</div>
                          </td>
                          <td className="px-6 py-3">
                             <span className={`text-xs px-2 py-0.5 rounded-full ${row.type === 'Retail' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                               {row.type}
                             </span>
                          </td>
                          <td className="px-6 py-3 text-center">{row.quantity}</td>
                          <td className="px-6 py-3 text-right text-gray-600">₱{row.salePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900">₱{row.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className={`px-6 py-3 text-right font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₱{row.profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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

      {/* --- WALLET TAB --- */}
      {activeTab === 'wallet' && (
         <div className="space-y-6 animate-fadeIn">
            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Main Balance Card */}
                 <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-xl shadow-lg text-white md:col-span-2 lg:col-span-1">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <p className="text-indigo-200 text-sm font-medium">Total Cash on Hand</p>
                              <h2 className="text-3xl font-bold mt-1">₱{walletBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
                          </div>
                          <div className="bg-white/10 p-2 rounded-lg">
                              <Wallet size={24} className="text-white" />
                          </div>
                      </div>
                      
                      {/* Low Cash Warning */}
                      {walletBalance < 1000 && (
                          <div className="bg-red-500/20 border border-red-500/50 p-2 rounded-lg mb-4 flex items-center gap-2 text-xs text-red-100">
                             <AlertTriangle size={16} />
                             <span>Low Cash Alert. Please Deposit Capital.</span>
                          </div>
                      )}

                      <button 
                        onClick={() => setIsWalletModalOpen(true)}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                          <ArrowUpRight size={16} /> Withdraw / Deposit
                      </button>
                 </div>

                 {/* Sources Breakdown (Where did cash come from?) */}
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                     <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Cash Sources (In)</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="p-1 bg-green-100 text-green-700 rounded"><TrendingUp size={14}/></span>
                                <span className="text-sm font-medium text-gray-700">Sales (Profit)</span>
                             </div>
                             <span className="font-bold text-gray-900">₱{walletData.salesIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="p-1 bg-blue-100 text-blue-700 rounded"><PiggyBank size={14}/></span>
                                <span className="text-sm font-medium text-gray-700">Capital Deposit</span>
                             </div>
                             <span className="font-bold text-gray-900">₱{walletData.depositsIn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                     </div>
                     <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        *Deposits are used when Sales cannot cover Expenses.
                     </div>
                 </div>

                 {/* Usage Breakdown (Where did cash go?) */}
                 <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                     <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Cash Usage (Out)</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="p-1 bg-red-100 text-red-700 rounded"><Wallet size={14}/></span>
                                <span className="text-sm font-medium text-gray-700">Expenses</span>
                             </div>
                             <span className="font-bold text-gray-900">₱{walletData.expensesOut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="p-1 bg-orange-100 text-orange-700 rounded"><ArrowUpRight size={14}/></span>
                                <span className="text-sm font-medium text-gray-700">Withdrawals</span>
                             </div>
                             <span className="font-bold text-gray-900">₱{walletData.withdrawalsOut.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                     </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                         <span className="text-xs text-gray-500 font-medium">Net Cash Flow</span>
                         <span className={`text-sm font-bold ${walletData.isGrowing ? 'text-green-600' : 'text-red-500'}`}>
                             {walletData.isGrowing ? '+' : ''}₱{walletData.netCashFlow.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                         </span>
                     </div>
                 </div>
            </div>

            {/* Transaction History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Wallet Transaction History</h3>
                     <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {walletData.log.length} Transaction{walletData.log.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {walletData.log.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        No transactions found in this period.
                                    </td>
                                </tr>
                            ) : (
                                walletData.log.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
                                    const isPositive = tx.type === 'DEPOSIT' || tx.type === 'SALE';
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                                                    tx.type === 'SALE' ? 'bg-green-50 text-green-700' :
                                                    tx.type === 'DEPOSIT' ? 'bg-blue-50 text-blue-700' :
                                                    tx.type === 'WITHDRAWAL' ? 'bg-orange-50 text-orange-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                    {tx.type === 'DEPOSIT' ? 'CAPITAL / DEPOSIT' : tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-800">{tx.reason}</td>
                                            <td className={`px-6 py-3 text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPositive ? '+' : '-'}₱{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {tx.itemsSnapshot && (
                                                    <button 
                                                        onClick={() => handleViewReceipt(tx)}
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                        title="View Receipt"
                                                    >
                                                        <Receipt size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      )}

      {/* --- INVENTORY TAB --- */}
      {activeTab === 'inventory' && (
         <div className="space-y-6 animate-fadeIn">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Total Asset Value" 
                value={`₱${inventoryData.totalAssetValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                subtext="Based on Unit Cost (Buying Price)"
                icon={Package} 
                colorClass="text-blue-600"
              />
               <StatCard 
                title="Potential Revenue" 
                value={`₱${inventoryData.totalRetailValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                subtext="Based on Retail Price"
                icon={TrendingUp} 
                colorClass="text-green-600"
              />
               <StatCard 
                title="Total Stock Count" 
                value={inventoryData.totalStock.toLocaleString()} 
                subtext="Units across all items"
                icon={BarChart3} 
                colorClass="text-indigo-600"
              />
            </div>

            {/* Valuation Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">Inventory Assets</h3>
               <span className="text-xs text-gray-400">Sorted by Asset Value (High to Low)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4">Item</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4 text-center">Stock</th>
                     <th className="px-6 py-4 text-right">Cost (Unit)</th>
                     <th className="px-6 py-4 text-right">Asset Value</th>
                     <th className="px-6 py-4 text-right">Retail (Unit)</th>
                     <th className="px-6 py-4 text-right">Potential Rev.</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {inventoryData.log.map(row => (
                       <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3">
                            <div className="font-medium text-gray-900">{row.name}</div>
                            <div className="text-xs text-gray-500">{row.sku}</div>
                          </td>
                          <td className="px-6 py-3 text-gray-500">{row.category}</td>
                          <td className="px-6 py-3 text-center font-medium">
                            {row.quantity} <span className="text-xs text-gray-400 font-normal">{row.costUnit}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-gray-500">₱{(row.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3 text-right font-medium text-blue-700 bg-blue-50/50">₱{row.assetValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3 text-right text-gray-500">₱{row.retailPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-6 py-3 text-right text-gray-500">₱{row.retailValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                       </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>
         </div>
      )}

      {/* --- EXPENSE MODAL --- */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title="Manage Expenses"
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
            {/* Input Form */}
            <div className="md:col-span-1 border-r border-gray-100 pr-0 md:pr-6">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size={16} className="text-indigo-600"/> Add Expense
                 </h4>
                 <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Rent, Lunch"
                            value={newExpense.description}
                            onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={newExpense.category}
                            onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="Operational">Operational</option>
                            <option value="Rent">Rent</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Food">Food / Meals</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Misc">Miscellaneous</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                        Add Expense
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Note: Expenses are automatically deducted from the Wallet Balance.
                    </p>
                 </form>
            </div>

            {/* List */}
            <div className="md:col-span-2 flex flex-col overflow-hidden">
                <div className="flex justify-between items-end mb-4">
                    <h4 className="font-bold text-gray-800">Expense History</h4>
                    <span className="text-xs text-gray-500">Showing expenses in selected period</span>
                </div>
                
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {salesData.expenseLog.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                        No expenses recorded for this period.
                                    </td>
                                </tr>
                            ) : (
                                salesData.expenseLog.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{e.category}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-red-600">₱{e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => deleteExpense(e.id)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold sticky bottom-0 border-t border-gray-200">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-gray-600 text-right">Total:</td>
                                <td className="px-4 py-3 text-right text-red-600">₱{salesData.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
      </Modal>

      {/* --- WITHDRAW / DEPOSIT MODAL --- */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        title="Wallet Transaction"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleWalletTransaction} className="space-y-4">
             <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                <button
                    type="button"
                    onClick={() => setWalletForm({ ...walletForm, type: 'WITHDRAWAL' })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${walletForm.type === 'WITHDRAWAL' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Withdraw Cash
                </button>
                <button
                    type="button"
                    onClick={() => setWalletForm({ ...walletForm, type: 'DEPOSIT' })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${walletForm.type === 'DEPOSIT' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Add Capital / Deposit
                </button>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₱)</label>
                <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={walletForm.amount}
                    onChange={e => setWalletForm({...walletForm, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                    placeholder="0.00"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Note</label>
                <textarea
                    required
                    rows={3}
                    value={walletForm.reason}
                    onChange={e => setWalletForm({...walletForm, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={walletForm.type === 'WITHDRAWAL' ? "e.g. Owner Draw, Emergency Purchase" : "e.g. Additional Capital, Petty Cash Top-up"}
                />
            </div>

            <div className="pt-4 flex gap-3">
                 <button 
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                 >
                    Cancel
                 </button>
                 <button 
                    type="submit"
                    className={`flex-1 py-2 text-white rounded-lg shadow-sm font-medium ${walletForm.type === 'WITHDRAWAL' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                 >
                    Confirm {walletForm.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Deposit'}
                 </button>
            </div>
        </form>
      </Modal>

      {/* --- RECEIPT VIEWER --- */}
      <ReceiptModal 
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        data={receiptData}
      />

    </div>
  );
};

export default ReportsPage;
import React, { useState } from 'react';
import { ArrowRight, Database, Wallet, ShoppingCart, Truck, Activity, Calculator, Code } from 'lucide-react';

const SystemFlow: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Helper to highlight lines
  const getStrokeColor = (source: string, target: string) => {
    if (activeNode === source || activeNode === target) return '#4f46e5'; // Indigo-600
    return '#cbd5e1'; // Slate-300
  };

  const getStrokeWidth = (source: string, target: string) => {
    if (activeNode === source || activeNode === target) return 2;
    return 1;
  };

  const NodeCard = ({ id, title, icon: Icon, description, x, y }: any) => (
    <div 
        className={`absolute w-48 p-4 bg-white rounded-xl shadow-sm border transition-all duration-300 cursor-pointer z-10 ${activeNode === id ? 'border-indigo-500 ring-2 ring-indigo-200 scale-105' : 'border-slate-200 hover:border-indigo-300'}`}
        style={{ left: x, top: y }}
        onMouseEnter={() => setActiveNode(id)}
        onMouseLeave={() => setActiveNode(null)}
    >
        <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${activeNode === id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={18} />
            </div>
            <span className="font-bold text-slate-700 text-sm">{title}</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Activity size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">System Flow & Architecture</h1>
            <p className="text-gray-500 text-sm">Visualizing data relationships and calculation logic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN: VISUAL DIAGRAM --- */}
        <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative min-h-[500px] shadow-inner">
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data Flow Diagram</div>
            
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Supplier -> Item */}
                <line x1="120" y1="120" x2="120" y2="220" stroke={getStrokeColor('suppliers', 'items')} strokeWidth={getStrokeWidth('suppliers', 'items')} strokeDasharray="4" />
                <path d="M 120 220 L 115 210 L 125 210 Z" fill={getStrokeColor('suppliers', 'items')} />

                {/* Item -> Movement */}
                <line x1="220" y1="260" x2="350" y2="260" stroke={getStrokeColor('items', 'movements')} strokeWidth={getStrokeWidth('items', 'movements')} />
                <path d="M 350 260 L 340 255 L 340 265 Z" fill={getStrokeColor('items', 'movements')} />

                {/* POS -> Movement */}
                <line x1="450" y1="120" x2="450" y2="220" stroke={getStrokeColor('pos', 'movements')} strokeWidth={getStrokeWidth('pos', 'movements')} />
                <path d="M 450 220 L 445 210 L 455 210 Z" fill={getStrokeColor('pos', 'movements')} />

                {/* POS -> Wallet */}
                <path d="M 550 80 C 650 80, 650 350, 550 400" fill="none" stroke={getStrokeColor('pos', 'wallet')} strokeWidth={getStrokeWidth('pos', 'wallet')} />
                <path d="M 550 400 L 560 395 L 560 405 Z" fill={getStrokeColor('pos', 'wallet')} />

                {/* Expenses -> Wallet */}
                <line x1="220" y1="400" x2="350" y2="400" stroke={getStrokeColor('expenses', 'wallet')} strokeWidth={getStrokeWidth('expenses', 'wallet')} />
                <path d="M 350 400 L 340 395 L 340 405 Z" fill={getStrokeColor('expenses', 'wallet')} />
            </svg>

            {/* Nodes */}
            <div className="relative w-full h-full p-8">
                {/* 1. Supplier */}
                <NodeCard 
                    id="suppliers" title="Suppliers" icon={Truck} x={20} y={40}
                    description="Source of goods. Items are linked to a specific supplier ID."
                />

                {/* 2. POS */}
                <NodeCard 
                    id="pos" title="Point of Sale (POS)" icon={ShoppingCart} x={350} y={40}
                    description="Frontend interface. Initiates Sales which trigger Stock Movements (OUT) and Wallet Transactions (SALE)."
                />

                {/* 3. Items */}
                <NodeCard 
                    id="items" title="Inventory Items" icon={Database} x={20} y={220}
                    description="Core entity. Holds Stock Qty, Costs, Prices (Retail/Wholesale), and Metadata."
                />

                {/* 4. Movements */}
                <NodeCard 
                    id="movements" title="Stock Movements" icon={Activity} x={350} y={220}
                    description="Audit trail. Records every change in stock (IN/OUT/ADJUSTMENT) with a timestamp."
                />

                {/* 5. Expenses */}
                <NodeCard 
                    id="expenses" title="Expenses" icon={Calculator} x={20} y={360}
                    description="Operational costs (Rent, Utilities). Manually added or automated."
                />

                {/* 6. Wallet */}
                <NodeCard 
                    id="wallet" title="Digital Wallet" icon={Wallet} x={350} y={360}
                    description="Financial Ledger. Tracks Cash Flow: Sales (+), Deposits (+), Expenses (-), Withdrawals (-)."
                />
            </div>
        </div>

        {/* --- RIGHT COLUMN: LOGIC & FORMULAS --- */}
        <div className="space-y-6">
            
            {/* Computation Logic */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calculator size={18} className="text-indigo-600"/>
                    System Formulas
                </h3>
                
                <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Wallet Balance</div>
                        <div className="font-mono text-sm text-slate-700">
                            (Σ Sales + Σ Deposits) - (Σ Expenses + Σ Withdrawals)
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Inventory Asset Value</div>
                        <div className="font-mono text-sm text-slate-700">
                            Σ (Item Quantity × Item Unit Cost)
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                            *Uses Unit Cost (Buying Price), not Retail Price.
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Net Income (Profit)</div>
                        <div className="font-mono text-sm text-slate-700">
                            Total Revenue - Total COGS - Expenses
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="text-xs text-slate-500"><span className="font-bold">Revenue:</span> Sale Price × Qty Sold</div>
                            <div className="text-xs text-slate-500"><span className="font-bold">COGS:</span> Unit Cost × Qty Sold</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Relationships */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Code size={18} className="text-indigo-600"/>
                    Key Relations
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-2">
                        <ArrowRight size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Item</strong> belongs to one <strong>Supplier</strong> (1:1 link via <code>supplierId</code>).</span>
                    </li>
                    <li className="flex gap-2">
                        <ArrowRight size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Movement</strong> belongs to one <strong>Item</strong> (1:N link). Deleting an item keeps movement history but loses the name link unless handled.</span>
                    </li>
                    <li className="flex gap-2">
                        <ArrowRight size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span><strong>Expense</strong> automatically creates a <strong>Wallet Transaction</strong> of type 'EXPENSE'.</span>
                    </li>
                    <li className="flex gap-2">
                        <ArrowRight size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span><strong>POS Checkout</strong> creates multiple <strong>Movements</strong> (one per item) but typically one aggregated <strong>Wallet Transaction</strong> for the total cash.</span>
                    </li>
                </ul>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SystemFlow;
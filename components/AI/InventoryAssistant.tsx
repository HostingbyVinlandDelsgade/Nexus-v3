import React, { useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { generateInventoryInsight } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

const InventoryAssistant: React.FC = () => {
  const { items, movements } = useInventory();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateInventoryInsight(items, movements);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Bot size={24} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Inventory Insights</h3>
            <p className="text-indigo-200 text-sm">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      {insight ? (
        <div className="prose prose-invert max-w-none prose-sm bg-black/20 p-4 rounded-lg border border-white/5">
            <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-indigo-200 text-sm bg-black/20 p-4 rounded-lg border border-white/5">
          Click "Generate Analysis" to get a comprehensive summary of your inventory status, value distribution, and reorder recommendations based on current stock levels and recent movements.
        </p>
      )}
    </div>
  );
};

export default InventoryAssistant;
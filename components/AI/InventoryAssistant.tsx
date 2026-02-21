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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Bot size={24} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">AI Inventory Insights</h3>
            <p className="text-indigo-600 text-xs font-medium">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
      </div>

      {insight ? (
        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700">
            <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      ) : (
        <div className="bg-gray-300/50 p-4 rounded-lg border border-gray-200/50">
          <p className="text-indigo-300 text-sm font-medium">
            Click "Generate Analysis" to get a comprehensive summary of your inventory status, value distribution, and reorder recommendations based on current stock levels and recent movements.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryAssistant;
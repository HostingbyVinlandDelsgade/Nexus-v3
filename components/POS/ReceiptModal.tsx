import React from 'react';
import { X, Printer, Download } from 'lucide-react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  sku: string;
}

interface ReceiptData {
  transactionId: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  cashReceived: number;
  change: number;
  cashier?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 no-print">
          <h2 className="text-lg font-semibold text-gray-900">Transaction Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50 flex justify-center">
            {/* Actual Receipt - This div gets the 'printable-area' class for CSS print visibility */}
            <div className="printable-area w-[300px] bg-white p-6 shadow-sm text-sm font-mono border border-gray-100">
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Nexus Inventory</h1>
                    <p className="text-xs text-gray-500">123 Tech Avenue, Silicon City</p>
                    <p className="text-xs text-gray-500">Tel: (02) 8888-1234</p>
                </div>

                <div className="border-b-2 border-dashed border-gray-200 mb-4 pb-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Date:</span>
                        <span>{new Date(data.date).toLocaleDateString()} {new Date(data.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">Trans ID:</span>
                        <span>#{data.transactionId.toUpperCase()}</span>
                    </div>
                    {data.cashier && (
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-gray-500">Cashier:</span>
                            <span>{data.cashier}</span>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                                <th className="text-left py-1 font-normal">Item</th>
                                <th className="text-center py-1 font-normal">Qty</th>
                                <th className="text-right py-1 font-normal">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 pr-2">
                                        <div className="font-bold">{item.name}</div>
                                        <div className="text-[10px] text-gray-400">{item.sku}</div>
                                    </td>
                                    <td className="py-2 text-center align-top">{item.quantity}</td>
                                    <td className="py-2 text-right align-top">
                                        {((item.price) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-2 space-y-1">
                    <div className="flex justify-between font-bold text-base">
                        <span>TOTAL</span>
                        <span>₱{data.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>CASH</span>
                        <span>₱{data.cashReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>CHANGE</span>
                        <span>₱{data.change.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs font-bold mb-1">Thank you for your purchase!</p>
                    <p className="text-[10px] text-gray-400">Please keep this receipt for warranty.</p>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3 no-print bg-white rounded-b-xl">
             <button 
                onClick={onClose}
                className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
                Close
            </button>
             <button 
                onClick={handlePrint}
                className="flex-1 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
                <Printer size={18} /> Print Receipt
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
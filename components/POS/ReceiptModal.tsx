import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useInventory } from '../../contexts/InventoryContext';

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
  const { companyInfo } = useInventory();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    
    try {
        const canvas = await html2canvas(receiptRef.current, {
            scale: 2, // Better resolution
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true 
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Receipt_${data.transactionId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Receipt download failed", err);
        alert("Could not generate receipt image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto no-print">
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
            {/* 
                Actual Receipt 
                - 'printable-area' class is used by index.html print media query to show this element 
                - id='receipt-content' is used by html2canvas
            */}
            <div className="printable-area">
                <div 
                    id="receipt-content" 
                    ref={receiptRef}
                    className="w-[80mm] bg-white p-6 shadow-sm text-sm font-mono border border-gray-100 mx-auto"
                    style={{ minHeight: '100mm' }} 
                >
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold uppercase tracking-wider mb-1 text-black">{companyInfo.name}</h1>
                        <p className="text-xs text-gray-500">{companyInfo.address}</p>
                        <p className="text-xs text-gray-500">Tel: {companyInfo.phone}</p>
                        {companyInfo.website && <p className="text-xs text-gray-500">{companyInfo.website}</p>}
                    </div>

                    <div className="border-b-2 border-dashed border-gray-300 mb-4 pb-4 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Date:</span>
                            <span className="text-black font-medium">{new Date(data.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Time:</span>
                            <span className="text-black font-medium">{new Date(data.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Trans ID:</span>
                            <span className="text-black font-medium">#{data.transactionId.toUpperCase()}</span>
                        </div>
                        {data.cashier && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Cashier:</span>
                                <span className="text-black font-medium">{data.cashier}</span>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-300 text-gray-500">
                                    <th className="text-left py-2 font-semibold w-[50%]">Item</th>
                                    <th className="text-center py-2 font-semibold w-[20%]">Qty</th>
                                    <th className="text-right py-2 font-semibold w-[30%]">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-2 pr-1 align-top">
                                            <div className="font-bold text-black break-words leading-tight">{item.name}</div>
                                            <div className="text-[10px] text-gray-400 font-sans mt-0.5">{item.sku}</div>
                                        </td>
                                        <td className="py-2 text-center align-top text-black">{item.quantity}</td>
                                        <td className="py-2 text-right align-top text-black font-medium">
                                            {((item.price) * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2">
                        <div className="flex justify-between text-sm font-bold text-black">
                            <span>TOTAL</span>
                            <span>₱{data.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>CASH</span>
                            <span>₱{data.cashReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>CHANGE</span>
                            <span>₱{data.change.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-1">
                        <p className="text-xs font-bold text-black">Thank you for your purchase!</p>
                        <p className="text-[10px] text-gray-400">Please keep this receipt for warranty purposes.</p>
                        <div className="mt-4 pt-2 border-t border-gray-100">
                            <p className="text-[10px] text-gray-300 font-sans">Powered by {companyInfo.name}</p>
                        </div>
                    </div>
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
                onClick={handleDownload}
                className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Download size={18} /> PNG
            </button>
             <button 
                onClick={handlePrint}
                className="flex-1 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
                <Printer size={18} /> Print
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;